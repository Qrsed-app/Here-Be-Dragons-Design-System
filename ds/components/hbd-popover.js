// ds/components/hbd-popover.js
// Here Be Dragons DS — <hbd-popover> custom element (CLAUDE.md §7).
//
// Light DOM. Click-triggered floating panel for interactive content.
// Unlike <hbd-tooltip>, EACH instance owns its own panel — popover
// content is unique per trigger (forms, action lists, rich text), and
// reusing a singleton would lose author-provided event listeners on
// re-show. Unlike <hbd-drawer>, popover does NOT block the page:
// aria-modal="false", no backdrop, no scroll lock.
//
// Authors write:
//   <hbd-popover title="Spell Details" placement="bottom">
//     <hbd-button slot="trigger">View Spell</hbd-button>
//     <div slot="content">
//       <p>Fireball — Evocation, Level 3</p>
//       <hbd-button variant="primary">Cast Now</hbd-button>
//     </div>
//     <div slot="footer">
//       <hbd-button>Close</hbd-button>
//     </div>
//   </hbd-popover>
//
// Attributes:
//   title      — optional heading; renders the header row when set
//   placement  — "top" | "bottom" (default) | "left" | "right"
//   offset     — px gap from the trigger (default reads from CSS)
//   no-close   — boolean; hides the ✕ close button (Escape still closes)
//
// Events:
//   hbd:open   — fires after the panel becomes visible
//   hbd:close  — fires after the panel finishes closing

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

class HbdPopover extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'placement', 'offset', 'no-close'];
  }

  constructor() {
    super();
    this._uid = `hbd-popover-${++uidCounter}`;
    this._isOpen = false;
    this._isClosing = false;
    this._previousFocus = null;
    this._trigger = null;
    this._panel = null;
    this._authoredContent = null;
    this._authoredFooter = null;
    this._ready = false;

    this._onTriggerClick = this._onTriggerClick.bind(this);
    this._onCloseClick = this._onCloseClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onScrollOrResize = this._onScrollOrResize.bind(this);
    this._onPanelTransitionEnd = this._onPanelTransitionEnd.bind(this);
  }

  connectedCallback() {
    this._snapshotSlots();
    this._render();
    this._ready = true;
  }

  disconnectedCallback() {
    this._teardownTrigger();
    this._uninstallOpenListeners();
    this._isOpen = false;
    this._isClosing = false;
    if (this._panel && this._panel.parentNode === this) {
      this._panel.remove();
    }
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    const wasOpen = this._isOpen;
    this._render();
    if (wasOpen) this._open();
  }

  // ─── Public API ───────────────────────────────────────────────────
  show() { if (!this._isOpen) this._open(); }
  hide() { if (this._isOpen) this._close(); }
  get isOpen() { return this._isOpen && !this._isClosing; }

  // ─── Slot snapshotting ────────────────────────────────────────────
  // Snapshot author-provided nodes once. Re-renders move them between
  // wrappers but never re-parse innerHTML — preserving event listeners
  // attached by the author to slotted children.
  _snapshotSlots() {
    if (this._authoredTrigger && this._authoredContent) return;
    this._authoredTrigger = this.querySelector(':scope > [slot="trigger"]');
    this._authoredContent = this.querySelector(':scope > [slot="content"]');
    this._authoredFooter  = this.querySelector(':scope > [slot="footer"]');
  }

  // ─── Attribute readers ────────────────────────────────────────────
  get _placement() {
    const p = (this.getAttribute('placement') || 'bottom').toLowerCase();
    return ['top', 'bottom', 'left', 'right'].includes(p) ? p : 'bottom';
  }
  get _offset() {
    const n = parseInt(this.getAttribute('offset'), 10);
    return Number.isFinite(n) ? n : 8;
  }
  get _title() {
    return this.getAttribute('title') || '';
  }
  get _hasClose() {
    return !this.hasAttribute('no-close');
  }

  // ─── Render ───────────────────────────────────────────────────────
  _render() {
    this._teardownTrigger();
    // Detach previous panel before clearing innerHTML so the authored
    // content nodes inside it aren't blown away.
    const prevContentWrap = this._panel && this._panel.querySelector('[data-popover-content]');
    const prevFooterWrap  = this._panel && this._panel.querySelector('[data-popover-footer]');
    if (prevContentWrap && this._authoredContent) {
      prevContentWrap.removeChild(this._authoredContent);
    }
    if (prevFooterWrap && this._authoredFooter) {
      prevFooterWrap.removeChild(this._authoredFooter);
    }

    // Rebuild the host with the trigger at the front and the new panel
    // shell at the back. Keep the authored trigger node — clearing
    // innerHTML would drop listeners.
    while (this.firstChild) this.removeChild(this.firstChild);

    if (this._authoredTrigger) {
      this.appendChild(this._authoredTrigger);
      this._trigger = this._authoredTrigger;
    } else {
      this._trigger = null;
    }

    // Build the panel.
    const panel = document.createElement('div');
    panel.className = `hbd-popover hbd-popover--${this._placement}`;
    panel.id = this._uid;
    panel.setAttribute('role', 'dialog');
    // aria-modal="false" is the crucial distinction from a modal
    // dialog. Popover content is reachable AND the rest of the page
    // remains in the AT tree. AT will not announce backdrop semantics.
    panel.setAttribute('aria-modal', 'false');
    panel.hidden = true;

    const title = this._title;
    const titleId = `${this._uid}-title`;
    if (title) {
      panel.setAttribute('aria-labelledby', titleId);
    } else {
      panel.removeAttribute('aria-labelledby');
    }

    let headerHtml = '';
    if (title) {
      const closeBtn = this._hasClose
        ? `<button type="button"
                    class="hbd-popover__close hbd-button hbd-button--default hbd-button--sm hbd-button--icon-only"
                    aria-label="Close popover"
                    data-popover-close>
             <svg viewBox="0 0 16 16" width="16" height="16" fill="none"
                  stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" aria-hidden="true">
               <line x1="4" y1="4"  x2="12" y2="12"></line>
               <line x1="12" y1="4" x2="4"  y2="12"></line>
             </svg>
           </button>`
        : '';
      headerHtml =
        `<div class="hbd-popover__header">
           <h2 class="hbd-popover__title" id="${titleId}">${escapeText(title)}</h2>
           ${closeBtn}
         </div>`;
    } else if (this._hasClose) {
      // No title but a close button is still useful — render it as a
      // floating ✕ inside the body wrapper so the layout works without
      // a header row.
      headerHtml = '';
    }

    panel.innerHTML =
      headerHtml +
      '<div class="hbd-popover__body" data-popover-content></div>' +
      (this._authoredFooter
        ? '<div class="hbd-popover__footer" data-popover-footer></div>'
        : '') +
      '<div class="hbd-popover__arrow" aria-hidden="true"></div>';

    // Move authored content + footer into the rendered wrappers so
    // their listeners and identity are preserved.
    const contentWrap = panel.querySelector('[data-popover-content]');
    const footerWrap  = panel.querySelector('[data-popover-footer]');
    if (contentWrap && this._authoredContent) {
      contentWrap.appendChild(this._authoredContent);
    }
    if (footerWrap && this._authoredFooter) {
      footerWrap.appendChild(this._authoredFooter);
    }

    this.appendChild(panel);
    this._panel = panel;

    panel.addEventListener('transitionend', this._onPanelTransitionEnd);
    const closeBtn = panel.querySelector('[data-popover-close]');
    if (closeBtn) closeBtn.addEventListener('click', this._onCloseClick);

    this._wireTrigger();
  }

  _wireTrigger() {
    if (!this._trigger) return;
    this._trigger.setAttribute('aria-haspopup', 'dialog');
    this._trigger.setAttribute('aria-expanded', 'false');
    this._trigger.setAttribute('aria-controls', this._uid);
    this._trigger.addEventListener('click', this._onTriggerClick);
  }

  _teardownTrigger() {
    if (!this._trigger) return;
    this._trigger.removeEventListener('click', this._onTriggerClick);
    if (this._trigger.getAttribute('aria-controls') === this._uid) {
      this._trigger.removeAttribute('aria-haspopup');
      this._trigger.removeAttribute('aria-expanded');
      this._trigger.removeAttribute('aria-controls');
    }
  }

  // ─── Open / close ─────────────────────────────────────────────────
  _open() {
    if (this._isOpen && !this._isClosing) {
      // Reposition in case it was opened mid-close; class transitions
      // handle the rest.
      this._position();
      return;
    }
    if (this._isClosing) this._isClosing = false;
    this._previousFocus = this._activeFocusable();
    this._isOpen = true;
    this._panel.hidden = false;
    this._position();
    // Defer the visibility class one frame so the position is committed
    // before the opacity/transform transition kicks in (avoids a flash
    // animating from the wrong start position).
    requestAnimationFrame(() => {
      if (!this._isOpen) return;
      this._panel.classList.add('hbd-popover--visible');
    });
    if (this._trigger) this._trigger.setAttribute('aria-expanded', 'true');

    this._installOpenListeners();

    // Move focus into the panel. Prefer the first focusable inside the
    // content; fall back to the close button; fall back to the panel
    // itself (give it tabindex=-1 so it can receive programmatic focus).
    requestAnimationFrame(() => {
      const focusable = this._getFocusable();
      if (focusable.length > 0) {
        focusable[0].focus({ preventScroll: true });
      } else {
        this._panel.setAttribute('tabindex', '-1');
        this._panel.focus({ preventScroll: true });
      }
    });

    this.dispatchEvent(new CustomEvent('hbd:open', {
      bubbles: true, composed: true,
    }));
  }

  _close() {
    if (!this._isOpen && !this._isClosing) return;
    if (this._isClosing) return;
    this._isClosing = true;
    this._isOpen = false;
    this._panel.classList.remove('hbd-popover--visible');
    if (this._trigger) this._trigger.setAttribute('aria-expanded', 'false');
    this._uninstallOpenListeners();
  }

  _onPanelTransitionEnd(e) {
    // Only react to the opacity transition completing on close — the
    // panel has multiple animated properties and we only need one
    // signal. opacity is always present.
    if (!this._isClosing) return;
    if (e.target !== this._panel) return;
    if (e.propertyName !== 'opacity') return;
    this._isClosing = false;
    this._panel.hidden = true;

    const target = this._previousFocus;
    this._previousFocus = null;
    if (target && typeof target.focus === 'function' && target.isConnected) {
      target.focus({ preventScroll: true });
    }
    this.dispatchEvent(new CustomEvent('hbd:close', {
      bubbles: true, composed: true,
    }));
  }

  // ─── Listeners while open ─────────────────────────────────────────
  _installOpenListeners() {
    document.addEventListener('keydown', this._onKeydown, true);
    document.addEventListener('pointerdown', this._onPointerDown, true);
    window.addEventListener('scroll', this._onScrollOrResize, true);
    window.addEventListener('resize', this._onScrollOrResize);
  }
  _uninstallOpenListeners() {
    document.removeEventListener('keydown', this._onKeydown, true);
    document.removeEventListener('pointerdown', this._onPointerDown, true);
    window.removeEventListener('scroll', this._onScrollOrResize, true);
    window.removeEventListener('resize', this._onScrollOrResize);
  }

  // ─── Event handlers ───────────────────────────────────────────────
  _onTriggerClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this._isOpen) this._close();
    else this._open();
  }

  _onCloseClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this._close();
  }

  _onKeydown(e) {
    if (!this._isOpen) return;
    // Escape always closes — even when no-close is set on the close
    // BUTTON, the user must still be able to dismiss the panel via
    // keyboard (SC 2.1.2). no-close hides the visible ✕ only.
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      this._close();
      return;
    }
    if (e.key !== 'Tab') return;
    // Focus trap inside the panel.
    const focusable = this._getFocusable();
    if (focusable.length === 0) {
      e.preventDefault();
      this._panel.focus({ preventScroll: true });
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this._activeFocusable();
    if (e.shiftKey) {
      if (active === first || !this._panel.contains(active)) {
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

  _onPointerDown(e) {
    if (!this._isOpen) return;
    const path = e.composedPath ? e.composedPath() : [];
    // Clicks inside the panel or on the trigger should NOT close.
    if (this._panel && (path.includes(this._panel) || this._panel.contains(e.target))) return;
    if (this._trigger && (path.includes(this._trigger) || this._trigger.contains(e.target))) return;
    this._close();
  }

  _onScrollOrResize() {
    if (!this._isOpen) return;
    this._position();
  }

  // ─── Positioning ──────────────────────────────────────────────────
  // Inline style is the documented exception for dynamic positioning —
  // top/left of a per-instance panel can't live in CSS. Everything
  // else (size, colour, transitions) is tokenised in popover.css.
  _position() {
    if (!this._trigger || !this._panel) return;
    const rect = this._trigger.getBoundingClientRect();
    // Pre-paint offscreen so getBoundingClientRect() returns accurate
    // dimensions for the panel before we move it.
    this._panel.style.top = '-9999px';
    this._panel.style.left = '-9999px';
    const pRect = this._panel.getBoundingClientRect();
    const pad = this._offset;
    let placement = this._placement;

    const compute = (p) => {
      let top = 0, left = 0;
      switch (p) {
        case 'top':
          top = rect.top - pRect.height - pad;
          left = rect.left + rect.width / 2 - pRect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + pad;
          left = rect.left + rect.width / 2 - pRect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - pRect.height / 2;
          left = rect.left - pRect.width - pad;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - pRect.height / 2;
          left = rect.right + pad;
          break;
      }
      return { top, left };
    };

    const fits = ({ top, left }) =>
      top >= 0 &&
      left >= 0 &&
      top + pRect.height <= window.innerHeight &&
      left + pRect.width  <= window.innerWidth;

    const opposite = {
      top: 'bottom', bottom: 'top', left: 'right', right: 'left',
    };

    let pos = compute(placement);
    if (!fits(pos)) {
      const flipped = opposite[placement];
      const flippedPos = compute(flipped);
      if (fits(flippedPos)) {
        placement = flipped;
        pos = flippedPos;
        this._panel.className = `hbd-popover hbd-popover--${placement}`
          + (this._panel.classList.contains('hbd-popover--visible') ? ' hbd-popover--visible' : '');
      } else {
        pos.top  = Math.max(0, Math.min(pos.top,  window.innerHeight - pRect.height));
        pos.left = Math.max(0, Math.min(pos.left, window.innerWidth  - pRect.width));
      }
    }

    this._panel.style.top  = `${Math.round(pos.top)}px`;
    this._panel.style.left = `${Math.round(pos.left)}px`;
  }

  // ─── Focus discovery ──────────────────────────────────────────────
  _getFocusable() {
    if (!this._panel) return [];
    const list = Array.from(this._panel.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((el) => this._isVisible(el)
        && !el.closest('[aria-hidden="true"]'));
    return list;
  }

  _isVisible(el) {
    if (!el) return false;
    if (el.offsetParent !== null) return true;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // Active focusable considering Shadow DOM boundaries.
  _activeFocusable() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  }
}

function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!customElements.get('hbd-popover')) {
  customElements.define('hbd-popover', HbdPopover);
}
