// ds/components/hbd-modal.js
// Here Be Dragons DS — <hbd-modal> custom element (CLAUDE.md §7).
//
// Centred overlay dialog. Reuses the focus-trap, scroll-lock, and
// return-focus patterns from hbd-drawer (the canonical implementation)
// — the trap covers BOTH shadow-DOM focusables and slotted Light-DOM
// content via slot.assignedElements({ flatten: true }) merged in
// document order.
//
// Shadow DOM. Styles via adopted stylesheets.
//
// Attributes:
//   open               — boolean; presence opens the modal.
//   size               — "sm" | "md" (default) | "lg" | "full"
//   title              — bold heading text
//   type               — "dialog" (default) | "alertdialog"
//   no-close           — boolean; hides the × button. Escape still
//                        closes (SC 2.1.2 — no attribute may remove
//                        the keyboard exit path).
//   no-backdrop-close  — boolean; clicking the backdrop does NOT
//                        close the modal. Useful for must-acknowledge
//                        alertdialogs. Escape still closes.
//
// Open/close lifecycle:
//   open()  — snapshot active element, lock body scroll, apply
//             .is-open, focus the dialog (or alertdialog cancel
//             button), install Tab/Escape listeners, fire hbd:open
//   close() — apply .is-closing, await dialog's opacity transitionend,
//             release scroll lock, restore focus, uninstall
//             listeners, fire hbd:close
//
// Stacked modals (Step 3f):
//   A static counter tracks how many modals are open. Each new modal
//   gets z-index = base + counter so the most recent sits on top.

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

const VALID_SIZES = ['sm', 'md', 'lg', 'full'];
const VALID_TYPES = ['dialog', 'alertdialog'];

// Shared body-scroll lock counter — survives multiple stacked modals
// and modals stacked on top of drawers (drawer uses its own counter,
// but both write to document.body.style.overflow so we coordinate
// carefully: each component releases only when its own counter
// reaches zero).
let activeLockCount = 0;
let savedBodyOverflow = '';

class HbdModal extends HTMLElement {
  static _stackCount = 0;

  static get observedAttributes() {
    return ['open', 'size', 'title', 'type', 'no-close', 'no-backdrop-close'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._uid = `hbd-modal-${++uidCounter}`;
    this._isOpen = false;
    this._isClosing = false;
    this._previousFocus = null;
    this._stackIndex = 0;
    this._ready = false;
    this._keyListenerInstalled = false;

    this._onBackdropClick = this._onBackdropClick.bind(this);
    this._onCloseButtonClick = this._onCloseButtonClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onDialogTransitionEnd = this._onDialogTransitionEnd.bind(this);
    this._onFooterSlotChange = this._onFooterSlotChange.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/modal.css',
      '/ds/styles/components/button.css',
    ]);
    this._render();
    this._ready = true;
    if (this.hasAttribute('open')) this._open();
  }

  disconnectedCallback() {
    // Defensive: if the modal is yanked out of the DOM while open,
    // release the scroll lock + listeners so the page doesn't get
    // stuck in a locked state.
    if (this._isOpen || this._isClosing) {
      this._releaseScrollLock();
      this._uninstallKeyListener();
      if (this._stackIndex > 0) {
        HbdModal._stackCount = Math.max(0, HbdModal._stackCount - 1);
        this._stackIndex = 0;
      }
    }
    this._removeWiredListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    if (name === 'open') {
      if (this.hasAttribute('open')) this._open();
      else this._close();
      return;
    }
    // size / title / type / no-close / no-backdrop-close → re-render
    // the shell. Preserve open state.
    this._render();
    if (this._isOpen) this._applyOpenClass(true);
  }

  // ── Reading helpers ────────────────────────────────────────────────
  _size() {
    const raw = (this.getAttribute('size') || 'md').toLowerCase();
    return VALID_SIZES.includes(raw) ? raw : 'md';
  }
  _type() {
    const raw = (this.getAttribute('type') || 'dialog').toLowerCase();
    return VALID_TYPES.includes(raw) ? raw : 'dialog';
  }
  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Public API ─────────────────────────────────────────────────────
  show() { this.setAttribute('open', ''); }
  hide() { this.removeAttribute('open'); }
  get isOpen() { return this._isOpen && !this._isClosing; }

  // ── Render shell ───────────────────────────────────────────────────
  _render() {
    this._removeWiredListeners();

    const uid = this._uid;
    const size = this._size();
    const type = this._type();
    const title = this.getAttribute('title') || '';
    const noClose = this.hasAttribute('no-close');

    const classes = ['hbd-modal'];
    if (size !== 'md') classes.push(`hbd-modal--${size}`);
    if (type === 'alertdialog') classes.push('hbd-modal--alert');
    if (this._isOpen) classes.push('is-open');
    if (this._isClosing) classes.push('is-closing');

    const titleId = `modal-title-${uid}`;

    const closeBtnHtml = noClose
      ? ''
      : `
        <hbd-button class="hbd-modal__close"
                    variant="default"
                    icon-only
                    type="button"
                    aria-label="Close dialog">
          <span class="hbd-button__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor"
                    stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </span>
        </hbd-button>`;

    const titleHtml = title
      ? `<h2 class="hbd-modal__title" id="${titleId}">${this._esc(title)}</h2>`
      // Placeholder keeps the header a two-child flex row so the close
      // button still anchors to the right when no title is set.
      : '<span></span>';

    this.shadowRoot.innerHTML = `
      <div class="${classes.join(' ')}"
           aria-hidden="${this._isOpen ? 'false' : 'true'}">
        <div class="hbd-modal__backdrop" aria-hidden="true"></div>
        <div class="hbd-modal__container">
          <div class="hbd-modal__dialog"
               role="${type}"
               aria-modal="true"
               ${title ? `aria-labelledby="${titleId}"` : ''}
               tabindex="-1">
            <div class="hbd-modal__header">
              ${titleHtml}
              ${closeBtnHtml}
            </div>
            <div class="hbd-modal__body">
              <slot></slot>
            </div>
            <div class="hbd-modal__footer" data-empty="true">
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    `;

    this._wireListeners();
    this._syncFooterEmpty();
  }

  _wireListeners() {
    const backdrop = this.shadowRoot.querySelector('.hbd-modal__backdrop');
    const closeBtn = this.shadowRoot.querySelector('.hbd-modal__close');
    const dialog = this.shadowRoot.querySelector('.hbd-modal__dialog');
    const footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');
    if (backdrop) backdrop.addEventListener('pointerdown', this._onBackdropClick);
    if (closeBtn) closeBtn.addEventListener('click', this._onCloseButtonClick);
    if (dialog) dialog.addEventListener('transitionend', this._onDialogTransitionEnd);
    if (footerSlot) footerSlot.addEventListener('slotchange', this._onFooterSlotChange);
  }

  _removeWiredListeners() {
    const backdrop = this.shadowRoot.querySelector('.hbd-modal__backdrop');
    const closeBtn = this.shadowRoot.querySelector('.hbd-modal__close');
    const dialog = this.shadowRoot.querySelector('.hbd-modal__dialog');
    const footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');
    if (backdrop) backdrop.removeEventListener('pointerdown', this._onBackdropClick);
    if (closeBtn) closeBtn.removeEventListener('click', this._onCloseButtonClick);
    if (dialog) dialog.removeEventListener('transitionend', this._onDialogTransitionEnd);
    if (footerSlot) footerSlot.removeEventListener('slotchange', this._onFooterSlotChange);
  }

  _syncFooterEmpty() {
    const footerEl = this.shadowRoot.querySelector('.hbd-modal__footer');
    const slot = this.shadowRoot.querySelector('slot[name="footer"]');
    if (!footerEl || !slot) return;
    const elements = slot.assignedElements({ flatten: true });
    const nodes = slot.assignedNodes({ flatten: true })
      .filter((n) => n.nodeType !== Node.COMMENT_NODE
        && !(n.nodeType === Node.TEXT_NODE && /^\s*$/.test(n.textContent)));
    const empty = elements.length === 0 && nodes.length === 0;
    footerEl.setAttribute('data-empty', empty ? 'true' : 'false');
  }
  _onFooterSlotChange() { this._syncFooterEmpty(); }

  // ── Open / close ───────────────────────────────────────────────────
  _applyOpenClass(open) {
    const wrap = this.shadowRoot.querySelector('.hbd-modal');
    if (!wrap) return;
    wrap.classList.toggle('is-open', open);
    wrap.classList.toggle('is-closing', !open && this._isClosing);
    wrap.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  _open() {
    if (this._isOpen && !this._isClosing) return;
    if (this._isClosing) {
      // Was mid-close, cancel and re-open.
      this._isClosing = false;
    }
    this._previousFocus = this._activeFocusable();
    this._lockScroll();

    // Stacked-modal z-index — bump the static counter, remember our
    // own index, and offset the container's z-index so this modal
    // sits above any older sibling that's still open.
    HbdModal._stackCount += 1;
    this._stackIndex = HbdModal._stackCount;
    const container = this.shadowRoot.querySelector('.hbd-modal__container');
    const backdrop = this.shadowRoot.querySelector('.hbd-modal__backdrop');
    if (container) {
      // Each stacked layer steps up by 2 so the backdrop of the upper
      // modal still sits above the previous modal's dialog.
      const layerStep = (this._stackIndex - 1) * 2;
      container.style.zIndex = `calc(var(--hbd-z-modal) + ${layerStep + 1})`;
      if (backdrop) backdrop.style.zIndex = `calc(var(--hbd-z-overlay) + ${layerStep})`;
    }

    this._isOpen = true;
    this._applyOpenClass(true);
    this._installKeyListener();

    requestAnimationFrame(() => {
      this._focusOnOpen();
    });

    this.dispatchEvent(new CustomEvent('hbd:open', {
      bubbles: true, composed: true,
    }));
  }

  _close() {
    if (!this._isOpen && !this._isClosing) return;
    if (this._isClosing) return;
    this._isClosing = true;
    const wrap = this.shadowRoot.querySelector('.hbd-modal');
    if (wrap) wrap.classList.add('is-closing');
    this._isOpen = false;
    if (wrap) wrap.classList.remove('is-open');
    if (wrap) wrap.setAttribute('aria-hidden', 'true');
  }

  // Fired by the dialog's transitionend during close. Filter on the
  // opacity property — opacity + transform both transition, picking
  // one keeps the cleanup from firing twice.
  _onDialogTransitionEnd(e) {
    if (!this._isClosing) return;
    if (e.propertyName !== 'opacity') return;
    this._isClosing = false;
    const wrap = this.shadowRoot.querySelector('.hbd-modal');
    if (wrap) wrap.classList.remove('is-closing');
    this._releaseScrollLock();
    this._uninstallKeyListener();

    if (this._stackIndex > 0) {
      HbdModal._stackCount = Math.max(0, HbdModal._stackCount - 1);
      this._stackIndex = 0;
    }

    const target = this._previousFocus;
    this._previousFocus = null;
    if (target && typeof target.focus === 'function' && target.isConnected) {
      target.focus({ preventScroll: true });
    }

    this.dispatchEvent(new CustomEvent('hbd:close', {
      bubbles: true, composed: true,
    }));
  }

  // ── Focus on open — alertdialog focuses the first footer button ──
  _focusOnOpen() {
    const dialog = this.shadowRoot.querySelector('.hbd-modal__dialog');
    if (this._type() === 'alertdialog') {
      // The safer/cancel action lives first in the footer slot. If
      // an author placed the destructive button first they made a
      // documented mistake — we still focus the first found.
      const footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');
      if (footerSlot) {
        const assigned = footerSlot.assignedElements({ flatten: true });
        for (const el of assigned) {
          const candidate = this._firstFocusableIn(el);
          if (candidate) {
            candidate.focus({ preventScroll: true });
            return;
          }
        }
      }
      // No footer button → fall back to the dialog box itself
      // (tabindex=-1, so focus is valid).
      if (dialog) dialog.focus({ preventScroll: true });
      return;
    }

    // Standard dialog: focus the first tabbable inside, falling back
    // to the dialog box. Matches the drawer's pattern.
    const focusable = this._getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus({ preventScroll: true });
    } else if (dialog) {
      dialog.focus({ preventScroll: true });
    }
  }

  _firstFocusableIn(el) {
    if (!el) return null;
    if (el.matches && el.matches(FOCUSABLE_SELECTOR) && this._isVisible(el)) {
      return el;
    }
    if (el.querySelector) {
      const found = el.querySelector(FOCUSABLE_SELECTOR);
      if (found && this._isVisible(found)) return found;
    }
    return null;
  }

  // ── Scroll lock ────────────────────────────────────────────────────
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

  // ── Key listener: focus trap + Escape ─────────────────────────────
  _installKeyListener() {
    if (this._keyListenerInstalled) return;
    this._keyListenerInstalled = true;
    document.addEventListener('keydown', this._onKeydown, true);
  }
  _uninstallKeyListener() {
    if (!this._keyListenerInstalled) return;
    this._keyListenerInstalled = false;
    document.removeEventListener('keydown', this._onKeydown, true);
  }
  _onKeydown(e) {
    if (!this._isOpen) return;

    // Only the TOP modal in the stack responds. Older modals stay
    // open but ignore Escape/Tab until the top is closed.
    if (this._stackIndex !== HbdModal._stackCount) return;

    if (e.key === 'Escape') {
      // SC 2.1.2: Escape MUST always close, regardless of no-close.
      // The no-close attribute removes the visual × only.
      e.stopPropagation();
      e.preventDefault();
      this.hide();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = this._getFocusable();
    if (focusable.length === 0) {
      e.preventDefault();
      const dialog = this.shadowRoot.querySelector('.hbd-modal__dialog');
      if (dialog) dialog.focus({ preventScroll: true });
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
    } else if (active === last) {
      e.preventDefault();
      first.focus({ preventScroll: false });
    }
  }

  // ── Focusable discovery — Shadow DOM + slotted Light DOM ─────────
  _getFocusable() {
    const root = this.shadowRoot;
    if (!root) return [];

    const shadowList = Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((el) => this._isVisible(el)
        && !el.closest('[aria-hidden="true"]'));

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

    // Document-order sort so Tab cycles naturally across the Shadow
    // DOM / Light DOM boundary.
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

  _activeFocusable() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  }

  _isVisible(el) {
    if (!el) return false;
    if (el.offsetParent !== null) return true;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // ── Event handlers ─────────────────────────────────────────────────
  _onBackdropClick(e) {
    e.stopPropagation();
    if (this.hasAttribute('no-backdrop-close')) return;
    this.hide();
  }
  _onCloseButtonClick(e) {
    e.stopPropagation();
    this.hide();
  }
}

if (!customElements.get('hbd-modal')) {
  customElements.define('hbd-modal', HbdModal);
}
