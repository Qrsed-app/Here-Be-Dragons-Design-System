// ds/components/hbd-drawer.js
// Here Be Dragons DS — <hbd-drawer> custom element (CLAUDE.md §7).
//
// Sliding overlay panel. Four placements (left / right / top / bottom),
// two size modifiers per axis (wide for L/R, tall for T/B). Establishes
// the focus-trap + scroll-lock + return-focus patterns that Modal /
// Dialog will reuse — implemented here once, correctly.
//
// Shadow DOM. Styles via adopted stylesheets.
//
// Behaviour summary:
//   open  → snapshot the previously-focused element, lock body scroll,
//           apply .is-open (drives transform-in), focus the first
//           tabbable inside the drawer, install Tab/Shift+Tab + Escape
//           listeners, fire hbd:open
//   close → apply .is-closing, wait for the panel's transitionend,
//           remove .is-open + .is-closing, restore scroll + focus,
//           uninstall listeners, fire hbd:close
//
// Focus trap covers BOTH the shadow DOM (close button, footer slots)
// AND the slotted Light-DOM body. The two are merged + sorted into
// document order so Tab cycles naturally.

import { adoptStyles } from '../utils/shared-styles.js';

let uidCounter = 0;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  'details > summary:first-of-type',
].join(',');

// Track how many drawers are currently locking body scroll so nested
// or sibling drawers don't clobber each other's lock release.
let activeLockCount = 0;
let savedBodyOverflow = '';

class HbdDrawer extends HTMLElement {
  static get observedAttributes() {
    return [
      'open', 'placement', 'wide', 'tall', 'title',
      'no-backdrop', 'no-close',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._uid = `hbd-drawer-${++uidCounter}`;
    this._isOpen = false;
    this._isClosing = false;
    this._previousFocus = null;
    this._ready = false;
    this._closeListenerInstalled = false;

    this._onBackdropClick = this._onBackdropClick.bind(this);
    this._onCloseButtonClick = this._onCloseButtonClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onPanelTransitionEnd = this._onPanelTransitionEnd.bind(this);
    this._onFooterSlotChange = this._onFooterSlotChange.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/drawer.css',
      '/ds/styles/components/button.css',
    ]);
    this._render();
    this._ready = true;
    // If the host already has `open` set on initial connect, respect it.
    if (this.hasAttribute('open')) this._open();
  }

  disconnectedCallback() {
    // If the drawer is removed while open, release the scroll lock and
    // listeners so the document doesn't get stuck.
    if (this._isOpen || this._isClosing) {
      this._releaseScrollLock();
      this._uninstallKeyListener();
    }
    this._removeWiredListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (!this._ready) return;
    if (name === 'open') {
      if (this.hasAttribute('open')) this._open();
      else this._close();
      return;
    }
    // Other attribute changes (placement, wide/tall, title, no-backdrop,
    // no-close) — re-render the shell. Open state is preserved by the
    // attribute check above.
    this._render();
    // If we were open, re-apply the .is-open class to the freshly-
    // rendered wrapper. Skip the slide animation — it's a config change,
    // not an open/close event.
    if (this._isOpen) this._applyOpenClass(true);
  }

  // ── Render shell ──────────────────────────────────────────────────
  _render() {
    this._removeWiredListeners();

    const uid = this._uid;
    const title = this.getAttribute('title') || '';
    const placement = this._placement();
    const wide = this.hasAttribute('wide');
    const tall = this.hasAttribute('tall');
    const noBackdrop = this.hasAttribute('no-backdrop');
    const noClose = this.hasAttribute('no-close');

    const classes = ['hbd-drawer', `hbd-drawer--${placement}`];
    if (noBackdrop) classes.push('hbd-drawer--no-backdrop');
    if (wide && (placement === 'left' || placement === 'right')) {
      classes.push('hbd-drawer--wide');
    }
    if (tall && (placement === 'top' || placement === 'bottom')) {
      classes.push('hbd-drawer--tall');
    }
    if (this._isOpen) classes.push('is-open');
    if (this._isClosing) classes.push('is-closing');

    const backdropHtml = noBackdrop
      ? ''
      : `<div class="hbd-drawer__backdrop" aria-hidden="true"></div>`;

    const closeBtnHtml = noClose
      ? ''
      : `
        <hbd-button class="hbd-drawer__close"
                    variant="default"
                    icon-only
                    type="button"
                    aria-label="Close drawer">
          <span class="hbd-button__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor"
                    stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </span>
        </hbd-button>`;

    this.shadowRoot.innerHTML = `
      <div class="${classes.join(' ')}"
           aria-hidden="${this._isOpen ? 'false' : 'true'}">
        ${backdropHtml}
        <div class="hbd-drawer__panel"
             role="dialog"
             aria-modal="true"
             ${title ? `aria-labelledby="drawer-title-${uid}"` : ''}
             tabindex="-1">

          <div class="hbd-drawer__header">
            ${title ? `<h2 class="hbd-drawer__title" id="drawer-title-${uid}">${this._esc(title)}</h2>` : '<span></span>'}
            ${closeBtnHtml}
          </div>

          <div class="hbd-drawer__body">
            <slot></slot>
          </div>

          <div class="hbd-drawer__footer" data-empty="true">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;

    this._wireListeners();
    // Initialise the footer-empty flag from current slot assignments.
    this._syncFooterEmpty();
  }

  // ── Wiring ────────────────────────────────────────────────────────
  _wireListeners() {
    const backdrop = this.shadowRoot.querySelector('.hbd-drawer__backdrop');
    const closeBtn = this.shadowRoot.querySelector('.hbd-drawer__close');
    const panel = this.shadowRoot.querySelector('.hbd-drawer__panel');
    const footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');
    if (backdrop) backdrop.addEventListener('pointerdown', this._onBackdropClick);
    if (closeBtn) closeBtn.addEventListener('click', this._onCloseButtonClick);
    if (panel) panel.addEventListener('transitionend', this._onPanelTransitionEnd);
    if (footerSlot) footerSlot.addEventListener('slotchange', this._onFooterSlotChange);
  }

  _removeWiredListeners() {
    const backdrop = this.shadowRoot.querySelector('.hbd-drawer__backdrop');
    const closeBtn = this.shadowRoot.querySelector('.hbd-drawer__close');
    const panel = this.shadowRoot.querySelector('.hbd-drawer__panel');
    const footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');
    if (backdrop) backdrop.removeEventListener('pointerdown', this._onBackdropClick);
    if (closeBtn) closeBtn.removeEventListener('click', this._onCloseButtonClick);
    if (panel) panel.removeEventListener('transitionend', this._onPanelTransitionEnd);
    if (footerSlot) footerSlot.removeEventListener('slotchange', this._onFooterSlotChange);
  }

  // Hide the footer row when the consumer didn't slot anything in.
  _syncFooterEmpty() {
    const footerEl = this.shadowRoot.querySelector('.hbd-drawer__footer');
    const slot = this.shadowRoot.querySelector('slot[name="footer"]');
    if (!footerEl || !slot) return;
    const empty = slot.assignedElements({ flatten: true }).length === 0
      && slot.assignedNodes({ flatten: true })
        .filter((n) => n.nodeType !== Node.COMMENT_NODE
          && !(n.nodeType === Node.TEXT_NODE && /^\s*$/.test(n.textContent)))
        .length === 0;
    footerEl.setAttribute('data-empty', empty ? 'true' : 'false');
  }
  _onFooterSlotChange() { this._syncFooterEmpty(); }

  // ── Helpers ───────────────────────────────────────────────────────
  _placement() {
    const p = (this.getAttribute('placement') || 'left').toLowerCase();
    return ['left', 'right', 'top', 'bottom'].includes(p) ? p : 'left';
  }
  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Public API ────────────────────────────────────────────────────
  show() { this.setAttribute('open', ''); }
  hide() { this.removeAttribute('open'); }
  get isOpen() { return this._isOpen && !this._isClosing; }

  // ── Open / close ──────────────────────────────────────────────────
  _applyOpenClass(open) {
    const wrap = this.shadowRoot.querySelector('.hbd-drawer');
    if (!wrap) return;
    wrap.classList.toggle('is-open', open);
    wrap.classList.toggle('is-closing', !open && this._isClosing);
    wrap.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  _open() {
    if (this._isOpen && !this._isClosing) return;
    // If we were mid-close, cancel that and re-open cleanly.
    if (this._isClosing) {
      this._isClosing = false;
    }
    this._previousFocus = this._captureActiveElement();
    this._lockScroll();
    this._isOpen = true;
    this._applyOpenClass(true);
    this._installKeyListener();

    // Defer focus to the next frame so the .is-open class has applied
    // and the panel is ready to receive focus visibly.
    requestAnimationFrame(() => {
      const focusable = this._getFocusable();
      if (focusable.length > 0) {
        focusable[0].focus({ preventScroll: true });
      } else {
        const panel = this.shadowRoot.querySelector('.hbd-drawer__panel');
        if (panel) panel.focus({ preventScroll: true });
      }
    });

    this.dispatchEvent(new CustomEvent('hbd:open', {
      bubbles: true, composed: true,
    }));
  }

  _close() {
    if (!this._isOpen && !this._isClosing) {
      // Already closed — nothing to do.
      return;
    }
    if (this._isClosing) return;
    this._isClosing = true;
    const wrap = this.shadowRoot.querySelector('.hbd-drawer');
    if (wrap) wrap.classList.add('is-closing');
    // Trigger the exit by removing .is-open; transition runs.
    this._isOpen = false;
    if (wrap) wrap.classList.remove('is-open');
    if (wrap) wrap.setAttribute('aria-hidden', 'true');
  }

  // Called by the panel's transitionend during close. Filter to the
  // transform property so unrelated transitions don't trigger cleanup.
  _onPanelTransitionEnd(e) {
    if (!this._isClosing) return;
    if (e.propertyName !== 'transform') return;
    this._isClosing = false;
    const wrap = this.shadowRoot.querySelector('.hbd-drawer');
    if (wrap) wrap.classList.remove('is-closing');
    this._releaseScrollLock();
    this._uninstallKeyListener();
    // Restore focus to whatever owned it when the drawer opened. Guard
    // against the previously-focused element being removed from the
    // document in the meantime.
    const target = this._previousFocus;
    this._previousFocus = null;
    if (target && typeof target.focus === 'function' && target.isConnected) {
      target.focus({ preventScroll: true });
    }
    this.dispatchEvent(new CustomEvent('hbd:close', {
      bubbles: true, composed: true,
    }));
  }

  // ── Scroll lock ───────────────────────────────────────────────────
  _lockScroll() {
    if (activeLockCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    activeLockCount += 1;
  }
  _releaseScrollLock() {
    if (activeLockCount === 0) return;
    activeLockCount -= 1;
    if (activeLockCount === 0) {
      document.body.style.overflow = savedBodyOverflow;
      savedBodyOverflow = '';
    }
  }

  // ── Focus trap + Escape ───────────────────────────────────────────
  _installKeyListener() {
    if (this._closeListenerInstalled) return;
    this._closeListenerInstalled = true;
    document.addEventListener('keydown', this._onKeydown, true);
  }
  _uninstallKeyListener() {
    if (!this._closeListenerInstalled) return;
    this._closeListenerInstalled = false;
    document.removeEventListener('keydown', this._onKeydown, true);
  }
  _onKeydown(e) {
    if (!this._isOpen) return;
    // Escape always closes UNLESS the host opts out via no-close.
    // SC 2.1.2 still allows an explicit no-dismiss modal; document
    // it in the host markup if you use that pattern. Default is
    // Escape closes.
    if (e.key === 'Escape' && !this.hasAttribute('no-close')) {
      e.stopPropagation();
      e.preventDefault();
      this.hide();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = this._getFocusable();
    if (focusable.length === 0) {
      // No tabbable targets — keep focus on the panel itself.
      e.preventDefault();
      const panel = this.shadowRoot.querySelector('.hbd-drawer__panel');
      if (panel) panel.focus({ preventScroll: true });
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this._activeFocusable();
    if (e.shiftKey) {
      if (active === first || active == null) {
        e.preventDefault();
        last.focus({ preventScroll: false });
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus({ preventScroll: false });
      }
    }
  }

  // Active focusable considering Shadow DOM boundaries. We descend
  // through shadow roots starting at document.activeElement.
  _activeFocusable() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  }

  _captureActiveElement() { return this._activeFocusable(); }

  // ── Focusable discovery (Shadow DOM + slotted Light DOM) ──────────
  _getFocusable() {
    const root = this.shadowRoot;
    if (!root) return [];

    // Shadow DOM focusables (close button, anything else we render).
    const shadowList = Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((el) => this._isVisible(el)
        && !el.closest('[aria-hidden="true"]'));

    // Slotted Light-DOM focusables — flatten across nested slots.
    const slottedList = [];
    root.querySelectorAll('slot').forEach((slot) => {
      const assigned = slot.assignedElements({ flatten: true });
      assigned.forEach((el) => {
        if (el.matches && el.matches(FOCUSABLE_SELECTOR)) slottedList.push(el);
        if (el.querySelectorAll) {
          el.querySelectorAll(FOCUSABLE_SELECTOR).forEach((c) => slottedList.push(c));
        }
      });
    });

    const merged = [...shadowList, ...slottedList].filter((el) => this._isVisible(el));

    // Sort in document order so Tab cycles naturally. Shadow vs Light
    // DOM elements share a common ancestor (the drawer host), so
    // compareDocumentPosition gives a consistent ordering once both
    // sides are resolved through their slots.
    merged.sort((a, b) => {
      const pos = a.compareDocumentPosition(b);
      // eslint-disable-next-line no-bitwise
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      // eslint-disable-next-line no-bitwise
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
    return merged;
  }

  _isVisible(el) {
    if (!el) return false;
    // offsetParent === null covers display:none and visibility:hidden
    // in most cases; the rect check catches edge cases like
    // `position: fixed` elements which have offsetParent === null.
    if (el.offsetParent !== null) return true;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // ── Event handlers ────────────────────────────────────────────────
  _onBackdropClick(e) {
    e.stopPropagation();
    if (this.hasAttribute('no-close')) return;
    this.hide();
  }
  _onCloseButtonClick(e) {
    e.stopPropagation();
    this.hide();
  }
}

if (!customElements.get('hbd-drawer')) {
  customElements.define('hbd-drawer', HbdDrawer);
}
