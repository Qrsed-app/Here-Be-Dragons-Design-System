// ds/components/hbd-tooltip.js
// Here Be Dragons DS — <hbd-tooltip> custom element (CLAUDE.md §7).
//
// Light DOM wrapper around a single trigger element. There is one
// shared .hbd-tooltip panel in <body> — every instance reads from /
// writes to that singleton on show. This avoids N panels in the DOM
// for pages with many tooltips, and means there is never more than
// one visible tooltip at a time (visually correct + ARIA-clean).
//
// Authors write:
//   <hbd-tooltip content="Cast Fireball">
//     <hbd-button icon-only aria-label="Cast Fireball">…</hbd-button>
//   </hbd-tooltip>
//
// Attributes:
//   content    — tooltip text (required)
//   placement  — "top" (default) | "bottom" | "left" | "right"
//   delay      — show delay in ms (overrides the token default)
//
// SC 1.4.13 status:
//   • Dismissible — Escape on focused trigger hides the tooltip ✓
//   • Persistent  — stays visible while trigger is hovered/focused ✓
//   • Hoverable   — KNOWN LIMITATION: panel uses pointer-events:none
//                    so the user can't park the cursor on the tooltip
//                    itself. Acceptable because tooltips never carry
//                    interactive or selectable content by design.

let uidCounter = 0;

class HbdTooltip extends HTMLElement {
  static get observedAttributes() {
    return ['content', 'placement', 'delay'];
  }

  // ─── Singleton panel ──────────────────────────────────────────────
  static _getPanel() {
    if (!HbdTooltip._panel || !document.body.contains(HbdTooltip._panel)) {
      const panel = document.createElement('div');
      panel.className = 'hbd-tooltip';
      panel.setAttribute('role', 'tooltip');
      // aria-live=off: the tooltip is described BY the trigger
      // (via aria-describedby). It should not also be a live region.
      panel.setAttribute('aria-live', 'off');
      panel.innerHTML =
        '<span class="hbd-tooltip__content"></span>' +
        '<div class="hbd-tooltip__arrow"></div>';
      document.body.appendChild(panel);
      HbdTooltip._panel = panel;
    }
    return HbdTooltip._panel;
  }

  constructor() {
    super();
    this._uid = `hbd-tooltip-${++uidCounter}`;
    this._showTimer = null;
    this._hideTimer = null;
    this._trigger = null;
    this._isShown = false;
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onFocusIn = this._onFocusIn.bind(this);
    this._onFocusOut = this._onFocusOut.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onScroll = this._onScroll.bind(this);
  }

  connectedCallback() {
    this._bindTrigger();
  }

  disconnectedCallback() {
    this._unbindTrigger();
    this._hideNow();
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal) return;
    // If the tooltip is currently visible for this instance, re-render
    // its content + reposition so an attribute change shows up live.
    if (this._isShown) this._renderShown();
  }

  // ─── Trigger management ───────────────────────────────────────────
  _bindTrigger() {
    // First non-text child is the trigger. If there isn't one (e.g.
    // hbd-tooltip wrapping only text), bind to the host itself so
    // focus/hover still work — but no aria-describedby in that case.
    const trigger = this.firstElementChild;
    if (!trigger) return;
    this._trigger = trigger;

    trigger.setAttribute('aria-describedby', this._uid);

    trigger.addEventListener('mouseenter', this._onMouseEnter);
    trigger.addEventListener('mouseleave', this._onMouseLeave);
    trigger.addEventListener('focusin', this._onFocusIn);
    trigger.addEventListener('focusout', this._onFocusOut);
    trigger.addEventListener('keydown', this._onKeydown);
  }

  _unbindTrigger() {
    const trigger = this._trigger;
    if (!trigger) return;
    if (trigger.getAttribute('aria-describedby') === this._uid) {
      trigger.removeAttribute('aria-describedby');
    }
    trigger.removeEventListener('mouseenter', this._onMouseEnter);
    trigger.removeEventListener('mouseleave', this._onMouseLeave);
    trigger.removeEventListener('focusin', this._onFocusIn);
    trigger.removeEventListener('focusout', this._onFocusOut);
    trigger.removeEventListener('keydown', this._onKeydown);
    this._trigger = null;
  }

  // ─── Attribute readers ────────────────────────────────────────────
  get _placement() {
    const p = (this.getAttribute('placement') || 'top').toLowerCase();
    return ['top', 'bottom', 'left', 'right'].includes(p) ? p : 'top';
  }

  get _showDelay() {
    const explicit = parseInt(this.getAttribute('delay'), 10);
    if (Number.isFinite(explicit) && explicit >= 0) return explicit;
    // Read the token default off the computed style of the singleton
    // panel — keeps the source-of-truth in tokens.css. Fallback to
    // 300ms if the token isn't reachable yet (panel not in DOM).
    const tokenMs = parseTokenMs('--hbd-tooltip-delay-show', 300);
    return tokenMs;
  }

  get _hideDelay() {
    return parseTokenMs('--hbd-tooltip-delay-hide', 100);
  }

  // ─── Show / hide ──────────────────────────────────────────────────
  _show(delay) {
    clearTimeout(this._hideTimer);
    this._hideTimer = null;
    if (this._isShown) {
      this._renderShown();
      return;
    }
    const fire = () => {
      this._showTimer = null;
      this._renderShown();
      this._isShown = true;
      // Hook scroll + resize so the panel follows the trigger.
      window.addEventListener('scroll', this._onScroll, true);
      window.addEventListener('resize', this._onScroll);
    };
    if (delay <= 0) fire();
    else this._showTimer = setTimeout(fire, delay);
  }

  _hide() {
    clearTimeout(this._showTimer);
    this._showTimer = null;
    if (!this._isShown && !this._hideTimer) return;
    this._hideTimer = setTimeout(() => {
      this._hideTimer = null;
      this._hideNow();
    }, this._hideDelay);
  }

  _hideNow() {
    clearTimeout(this._showTimer);
    clearTimeout(this._hideTimer);
    this._showTimer = null;
    this._hideTimer = null;
    if (!this._isShown) return;
    const panel = HbdTooltip._getPanel();
    // Only clear the panel if WE are the current owner — another
    // tooltip may have taken over in the gap between hide-start and
    // hide-fire.
    if (panel.id === this._uid) {
      panel.classList.remove('hbd-tooltip--visible');
      panel.removeAttribute('id');
    }
    this._isShown = false;
    window.removeEventListener('scroll', this._onScroll, true);
    window.removeEventListener('resize', this._onScroll);
  }

  _renderShown() {
    if (!this._trigger) return;
    const panel = HbdTooltip._getPanel();
    panel.querySelector('.hbd-tooltip__content').textContent =
      this.getAttribute('content') || '';
    panel.id = this._uid;
    const placement = this._placement;
    panel.className = `hbd-tooltip hbd-tooltip--${placement}`;
    this._position(panel, placement);
    // requestAnimationFrame so the position assignment lands before
    // the opacity transition kicks in — otherwise the panel briefly
    // animates from its previous position to the new one.
    requestAnimationFrame(() => {
      if (panel.id === this._uid) panel.classList.add('hbd-tooltip--visible');
    });
  }

  // ─── Positioning ──────────────────────────────────────────────────
  // Inline style assignment is the documented exception here — the
  // top/left of a singleton panel is by definition dynamic and
  // can't live in CSS. Everything that is NOT position lives in CSS.
  _position(panel, placement) {
    const rect = this._trigger.getBoundingClientRect();
    // Pre-measure: paint the panel offscreen so getBoundingClientRect
    // gives accurate dimensions before we move it.
    panel.style.top = '-9999px';
    panel.style.left = '-9999px';
    const pRect = panel.getBoundingClientRect();
    const pad = remToPx(0.5); // small gap between trigger and tooltip

    const tryPlace = (p) => {
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

    let chosen = placement;
    let pos = tryPlace(chosen);
    if (!fits(pos)) {
      const flipped = opposite[chosen];
      const flippedPos = tryPlace(flipped);
      if (fits(flippedPos)) {
        chosen = flipped;
        pos = flippedPos;
        panel.className = `hbd-tooltip hbd-tooltip--${chosen}`;
      } else {
        // Clamp to viewport — last-resort. Better an awkward arrow
        // than a tooltip off-screen.
        pos.top  = Math.max(0, Math.min(pos.top,  window.innerHeight - pRect.height));
        pos.left = Math.max(0, Math.min(pos.left, window.innerWidth  - pRect.width));
      }
    }

    panel.style.top  = `${Math.round(pos.top)}px`;
    panel.style.left = `${Math.round(pos.left)}px`;
  }

  // ─── Event handlers ───────────────────────────────────────────────
  _onMouseEnter() { this._show(this._showDelay); }
  _onMouseLeave() { this._hide(); }
  _onFocusIn()    { this._show(0); }
  _onFocusOut()   { this._hide(); }
  _onKeydown(e) {
    if (e.key === 'Escape') {
      // Escape on the trigger hides the tooltip immediately. The
      // trigger keeps focus — Escape should not steal it. (SC 1.4.13)
      this._hideNow();
    }
  }
  _onScroll() {
    if (!this._isShown) return;
    this._position(HbdTooltip._getPanel(), this._placement);
  }
}

HbdTooltip._panel = null;

// ─── Helpers ─────────────────────────────────────────────────────────
function parseTokenMs(name, fallback) {
  const root = document.documentElement;
  if (!root) return fallback;
  const raw = getComputedStyle(root).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  if (raw.endsWith('ms')) return n;
  if (raw.endsWith('s'))  return n * 1000;
  return n;
}

function remToPx(rem) {
  const fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return rem * (Number.isFinite(fs) ? fs : 16);
}

if (!customElements.get('hbd-tooltip')) {
  customElements.define('hbd-tooltip', HbdTooltip);
}
