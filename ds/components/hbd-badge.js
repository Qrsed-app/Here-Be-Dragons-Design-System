// ds/components/hbd-badge.js
// Here Be Dragons DS — <hbd-badge> custom element (CLAUDE.md §7).
//
// Light DOM. The badge is tiny visual chrome — Shadow DOM would add
// more overhead than it saves. Authors style it via the .hbd-badge*
// classes the JS writes onto the host.
//
// Attributes:
//   count   — numeric value to display; capped via `max`
//   max     — cap value (default "99"). Counts above `max` render as
//             "{max}+" and the accessible name carries the real count.
//   variant — "primary" | "success" | "warning" | "error" | "neutral"
//             (default "neutral")
//   dot     — boolean; renders the small dot variant, no text
//   label   — optional accessible name for dot/status badges.
//             Required for dot variants since dots carry no visible
//             text. When set on a count badge it becomes the prefix:
//             label="Notifications" + count=12 → "Notifications, 12".
//
// Accessibility patterns:
//   1) Standalone badge — the badge IS the accessible name.
//      It carries aria-label="{label}, {count} items" (or similar).
//   2) Badge OVERLAID on an icon button — the badge's value should be
//      part of the BUTTON's aria-label, and the badge should be
//      aria-hidden="true" so SR doesn't announce it twice. Authors
//      apply aria-hidden manually in this composition (the component
//      can't know it is being used as an overlay).
//
// Validators / max-cap rule:
//   The visible text caps at "{max}+", but the accessible label still
//   reports the raw count so SR users get accurate information.

class HbdBadge extends HTMLElement {
  static get observedAttributes() {
    return ['count', 'max', 'variant', 'dot', 'label'];
  }

  constructor() {
    super();
    this._ready = false;
  }

  connectedCallback() {
    this._ready = true;
    this._render();
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  // ─── Attribute readers ─────────────────────────────────────────────
  get _variant() {
    const v = (this.getAttribute('variant') || 'neutral').toLowerCase();
    return ['primary', 'success', 'warning', 'error', 'neutral'].includes(v)
      ? v : 'neutral';
  }
  get _isDot() {
    return this.hasAttribute('dot');
  }
  get _max() {
    const n = parseInt(this.getAttribute('max'), 10);
    return Number.isFinite(n) && n > 0 ? n : 99;
  }
  get _rawCount() {
    if (!this.hasAttribute('count')) return null;
    const n = parseInt(this.getAttribute('count'), 10);
    return Number.isFinite(n) ? n : null;
  }

  // ─── Render ────────────────────────────────────────────────────────
  _render() {
    const variant = this._variant;
    const isDot = this._isDot;

    // Always-on classes.
    const classes = ['hbd-badge', `hbd-badge--${variant}`];
    if (isDot) classes.push('hbd-badge--dot');
    this.className = classes.join(' ');

    if (isDot) {
      // Dot has no text. Build an accessible name from `label` —
      // warn the author when neither is set, since a bare dot is
      // information-by-colour-only (SC 1.4.1 / 1.1.1).
      const label = this.getAttribute('label');
      this.textContent = '';
      if (label) {
        this.setAttribute('aria-label', label);
        this.setAttribute('role', 'status');
      } else {
        console.warn(
          '[hbd-badge] dot variant has no label attribute. Provide ' +
          'label="…" so screen readers can announce the status.'
        );
        this.removeAttribute('aria-label');
        this.removeAttribute('role');
      }
      return;
    }

    // Count variant.
    const raw = this._rawCount;
    if (raw == null) {
      this.textContent = '';
      this.removeAttribute('aria-label');
      return;
    }

    const max = this._max;
    const display = raw > max ? `${max}+` : String(raw);
    this.textContent = display;

    const label = this.getAttribute('label');
    // Build a sensible accessible label that reports the REAL count,
    // not the truncated "{max}+" string.
    const a11y = label ? `${label}, ${raw}` : `${raw}`;
    this.setAttribute('aria-label', a11y);
  }
}

if (!customElements.get('hbd-badge')) {
  customElements.define('hbd-badge', HbdBadge);
}
