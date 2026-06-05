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
// Close paths (the modal hide()s itself when any of these fire):
//   1. × button in the header
//   2. Click on ANY descendant carrying [data-modal-close] — typical
//      authoring pattern for a footer Cancel / Confirm button.
//      Implemented as host-level event delegation; works through
//      Shadow DOM via composedPath().
//   3. Click on the backdrop OR on the centring container scrim
//      around the dialog (unless [no-backdrop-close] is set)
//   4. Escape key — handled at the document level in BUBBLE phase
//      so nested popovers/dropdowns get first crack via their own
//      keydown listeners. They can stopPropagation to close just
//      their own widget; if nothing intercepts, the modal closes.
//      Works regardless of where focus currently is. SC 2.1.2:
//      Escape is always available, no attribute may suppress it.
//
// Keyboard navigation:
//   Tab / Shift+Tab cycle within the dialog. Document-bubble keydown
//   handler discovers focusables across BOTH the modal's own shadow
//   root and slotted Light DOM, and descends into OPEN shadow roots
//   of nested custom elements (hbd-button, hbd-input, hbd-select,
//   ...) so their internal focusable targets are reachable. When
//   focus is outside the discovered list (e.g. landed on the dialog
//   box itself), Tab forces focus back into the cycle — preventing
//   the "Tab leaks out of the modal" bug.
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
    this._onContainerClick = this._onContainerClick.bind(this);
    this._onCloseButtonClick = this._onCloseButtonClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onDialogTransitionEnd = this._onDialogTransitionEnd.bind(this);
    this._onFooterSlotChange = this._onFooterSlotChange.bind(this);
    this._onSlotClick = this._onSlotClick.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/modal.css',
      '/ds/styles/components/button.css',
    ]);
    this._render();
    // Host-level click delegation: ANY descendant carrying
    // [data-modal-close] closes the modal. Authors don't need to
    // wire their own footer close handler — see hbd-modal.js header.
    this.addEventListener('click', this._onSlotClick);
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
    this.removeEventListener('click', this._onSlotClick);
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
    const container = this.shadowRoot.querySelector('.hbd-modal__container');
    const closeBtn = this.shadowRoot.querySelector('.hbd-modal__close');
    const dialog = this.shadowRoot.querySelector('.hbd-modal__dialog');
    const footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');
    if (backdrop) backdrop.addEventListener('pointerdown', this._onBackdropClick);
    // The container is the flex wrapper that centres the dialog. It
    // sits ABOVE the backdrop in stacking order (z-index modal vs
    // overlay), so the visible scrim area is actually the container,
    // not the backdrop. Click on the container itself (not on a
    // dialog descendant) → dismiss.
    if (container) container.addEventListener('pointerdown', this._onContainerClick);
    if (closeBtn) closeBtn.addEventListener('click', this._onCloseButtonClick);
    if (dialog) {
      dialog.addEventListener('transitionend', this._onDialogTransitionEnd);
    }
    if (footerSlot) footerSlot.addEventListener('slotchange', this._onFooterSlotChange);
  }

  _removeWiredListeners() {
    const backdrop = this.shadowRoot.querySelector('.hbd-modal__backdrop');
    const container = this.shadowRoot.querySelector('.hbd-modal__container');
    const closeBtn = this.shadowRoot.querySelector('.hbd-modal__close');
    const dialog = this.shadowRoot.querySelector('.hbd-modal__dialog');
    const footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');
    if (backdrop) backdrop.removeEventListener('pointerdown', this._onBackdropClick);
    if (container) container.removeEventListener('pointerdown', this._onContainerClick);
    if (closeBtn) closeBtn.removeEventListener('click', this._onCloseButtonClick);
    if (dialog) {
      dialog.removeEventListener('transitionend', this._onDialogTransitionEnd);
    }
    if (footerSlot) footerSlot.removeEventListener('slotchange', this._onFooterSlotChange);
  }

  // Click delegation across the entire host. Any element with
  // [data-modal-close] (anywhere in the slotted Light DOM) closes
  // the modal when clicked. Covers footer Cancel/Close/Confirm
  // buttons, body links, the works — authors mark the element and
  // forget about it.
  _onSlotClick(e) {
    const target = e.target && e.composedPath
      ? e.composedPath().find((n) => n && n.nodeType === Node.ELEMENT_NODE
        && n.matches && n.matches('[data-modal-close]'))
      : (e.target && e.target.closest ? e.target.closest('[data-modal-close]') : null);
    if (!target) return;
    e.stopPropagation();
    this.hide();
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
    // BUBBLE phase (not capture). Nested popovers/dropdowns/comboboxes
    // attach their own keydown listeners; bubble phase here means they
    // run first and can stopPropagation when they have their own
    // Tab/Escape semantics (e.g. close their panel on Escape without
    // also closing the modal). Document-level listener also catches
    // Escape pressed while focus is outside the dialog (e.g. on the
    // trigger button after a delayed open) — fixing the "Escape
    // ignored when focus is not in the modal" bug.
    document.addEventListener('keydown', this._onKeydown, false);
  }
  _uninstallKeyListener() {
    if (!this._keyListenerInstalled) return;
    this._keyListenerInstalled = false;
    document.removeEventListener('keydown', this._onKeydown, false);
  }
  // Document-bubble handler: Tab focus trap AND Escape close.
  //
  // BUBBLE PHASE (not capture) so nested popovers/dropdowns get first
  // crack at the key — they can stopPropagation on their own Escape /
  // Tab handler and the modal's listener will never run. By the time
  // bubble reaches document, every nested handler has executed.
  //
  // Tab discipline: if focus is currently OUTSIDE the focusable list
  // (e.g. it landed on the dialog box itself, or somehow escaped to
  // an element outside the modal), we forcibly redirect into the
  // cycle. This is what fixes "Tab doesn't move focus inside the
  // modal" — previously focus stuck on the dialog host and Tab fell
  // through to the browser default, which moved focus into the page
  // behind the modal.
  //
  // SC 2.1.2: Escape ALWAYS closes the modal once we receive it; the
  // no-close attribute removes the visual × only, it does NOT
  // suppress Escape. There is always a keyboard exit path.
  _onKeydown(e) {
    if (!this._isOpen) return;

    // Only the TOP modal in the stack responds.
    if (this._stackIndex !== HbdModal._stackCount) return;

    if (e.key === 'Escape') {
      if (e.defaultPrevented) return;
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
    const activeIndex = focusable.indexOf(active);

    if (activeIndex === -1) {
      // Focus is outside the focusable list (likely on the dialog
      // host or escaped to the page behind). Pull it into the cycle.
      e.preventDefault();
      (e.shiftKey ? last : first).focus({ preventScroll: false });
      return;
    }
    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault();
        last.focus({ preventScroll: false });
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus({ preventScroll: false });
    }
  }

  // ── Focusable discovery — Shadow DOM + slotted Light DOM ─────────
  //
  // The modal contains a mix of:
  //   1. Our own shadow DOM (the × close button, header chrome)
  //   2. Slotted Light DOM (the author's body + footer content)
  //   3. Custom elements slotted into the body/footer (hbd-button,
  //      hbd-input, hbd-select, etc.) whose REAL focusable lives
  //      inside their own open shadow root.
  //
  // querySelectorAll does NOT pierce shadow boundaries, so we have
  // to walk shadow roots explicitly. Without this, Tab "traps" on
  // a Light-DOM focusable inside the modal because the focusable
  // <button> inside an hbd-button's shadow root is invisible to
  // the discovery and the cycle has only one member.
  _collectFocusable(scope, out) {
    if (!scope) return;
    const direct = scope.querySelectorAll
      ? Array.from(scope.querySelectorAll(FOCUSABLE_SELECTOR))
      : [];
    for (const el of direct) {
      if (this._isVisible(el) && !el.closest('[aria-hidden="true"]')) {
        out.push(el);
      }
    }
    // Walk every element inside the scope and descend into open shadow
    // roots so focusables inside custom elements (hbd-button, hbd-input,
    // hbd-select, ...) are included.
    if (scope.querySelectorAll) {
      const all = scope.querySelectorAll('*');
      for (const el of all) {
        if (el.shadowRoot && el.shadowRoot.mode === 'open') {
          this._collectFocusable(el.shadowRoot, out);
        }
      }
    }
  }

  _getFocusable() {
    const root = this.shadowRoot;
    if (!root) return [];

    const merged = [];

    // 1. Shadow DOM of this modal — × button and other chrome.
    this._collectFocusable(root, merged);

    // 2. Slotted Light DOM — body and footer content. assignedElements
    //    gives us the slot's distributed nodes; for each we collect its
    //    own focusables and recurse into any nested open shadow roots.
    root.querySelectorAll('slot').forEach((slot) => {
      const assigned = slot.assignedElements({ flatten: true });
      assigned.forEach((el) => {
        // The element itself might be focusable (e.g. an <a> in the body).
        if (el.matches && el.matches(FOCUSABLE_SELECTOR)) {
          if (this._isVisible(el)) merged.push(el);
        }
        // Walk its subtree (Light DOM + open shadow roots).
        this._collectFocusable(el, merged);
      });
    });

    // De-dupe (an element discovered both as a slot assignment and
    // via a parent's querySelectorAll would appear twice).
    const seen = new Set();
    const deduped = [];
    for (const el of merged) {
      if (seen.has(el)) continue;
      seen.add(el);
      deduped.push(el);
    }

    // Document-order sort. compareDocumentPosition returns
    // DOCUMENT_POSITION_DISCONNECTED when comparing across shadow
    // boundaries, so we fall back to a structural rule:
    //
    //   slotted Light-DOM focusables (body + footer)  ──  FIRST
    //   modal-shadow focusables (× close button)      ──  LAST
    //
    // This gives the natural authoring expectation: opening the
    // modal focuses the first body input, Tab cycles through body
    // → footer → × → back to first body. If × came first, opening
    // would land focus on the close button, which is rarely what
    // the user wants.
    deduped.sort((a, b) => {
      const pos = a.compareDocumentPosition(b);
      // eslint-disable-next-line no-bitwise
      if (pos & Node.DOCUMENT_POSITION_DISCONNECTED) {
        const aInOwnShadow = a.getRootNode() === this.shadowRoot;
        const bInOwnShadow = b.getRootNode() === this.shadowRoot;
        if (aInOwnShadow && !bInOwnShadow) return 1;  // × after slotted
        if (!aInOwnShadow && bInOwnShadow) return -1; // slotted before ×
        return 0;
      }
      // eslint-disable-next-line no-bitwise
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      // eslint-disable-next-line no-bitwise
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
    return deduped;
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

  // The container is the flex wrapper that sits above the backdrop
  // in stacking order, so the visible scrim is actually pointerdown
  // on the container, not the backdrop. Only fire when the target
  // is the container itself (a click on the dialog box bubbles
  // through here but e.target points to the dialog or one of its
  // descendants — in which case we ignore).
  _onContainerClick(e) {
    if (this.hasAttribute('no-backdrop-close')) return;
    const container = this.shadowRoot.querySelector('.hbd-modal__container');
    if (e.target !== container) return;
    e.stopPropagation();
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
