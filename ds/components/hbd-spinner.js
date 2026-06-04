// ds/components/hbd-spinner.js
// Here Be Dragons DS — <hbd-spinner> custom element (CLAUDE.md §7).
//
// Light DOM. An indeterminate progress indicator. Two usage modes:
//
//   Standalone — a full spinner placed in the layout:
//     <hbd-spinner size="lg" label="Loading compendium"></hbd-spinner>
//
//   Inline — a small spinner inside a button or input. Use
//   variant="inherit" so the arc tints to the surrounding text colour:
//     <hbd-spinner size="sm" variant="inherit" label="Loading"></hbd-spinner>
//
// Accessibility:
//   - The SVG itself is aria-hidden + focusable=false; the visible
//     spinner does NOT participate in the accessibility tree.
//   - The accessible message lives in a visually-hidden span carrying
//     role="status" aria-live="polite". AT announces the label when
//     the spinner appears; the same announcement is repeated if the
//     label attribute changes.
//   - SC 2.2.2 exemption: spinners auto-remove when the underlying
//     load completes — they are decorative motion, not moving
//     information. The role="status" announcement carries the
//     information. See spinner.css header for the documented stance.
//
// Reduced motion:
//   The global @media (prefers-reduced-motion: reduce) override in
//   foundations/motion.css collapses the spin animation to 0.01ms.
//   The arc reads as a static 75%-circle indicator — still legible.
//
// Attributes:
//   size    — "sm" (16px) | "md" (24px, default) | "lg" (40px) | "xl" (64px)
//   variant — "default" (action colour) | "muted" | "inherit" (currentColor)
//   label   — accessible label; default "Loading"

const VALID_SIZES = ['sm', 'md', 'lg', 'xl'];
const VALID_VARIANTS = ['default', 'muted', 'inherit'];

class HbdSpinner extends HTMLElement {
  static get observedAttributes() {
    return ['size', 'variant', 'label'];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(_n, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (!this.isConnected) return;
    this._render();
  }

  _size() {
    const raw = (this.getAttribute('size') || 'md').toLowerCase();
    return VALID_SIZES.includes(raw) ? raw : 'md';
  }
  _variant() {
    const raw = (this.getAttribute('variant') || 'default').toLowerCase();
    return VALID_VARIANTS.includes(raw) ? raw : 'default';
  }
  _label() {
    return this.getAttribute('label') || 'Loading';
  }

  _escapeText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _render() {
    const size = this._size();
    const variant = this._variant();
    const label = this._label();

    const classes = ['hbd-spinner'];
    if (size !== 'md') classes.push(`hbd-spinner--${size}`);
    if (variant !== 'default') classes.push(`hbd-spinner--${variant}`);
    this.className = classes.join(' ');

    // SVG geometry constants (cx=12 cy=12 r=10 on a 24-unit viewBox)
    // match the dash-array literals in spinner.css. transform=rotate(-90 12 12)
    // anchors the arc start at 12 o'clock instead of the SVG default
    // of 3 o'clock.
    this.innerHTML =
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" ' +
        'aria-hidden="true" focusable="false">' +
        '<circle class="hbd-spinner__track" cx="12" cy="12" r="10"></circle>' +
        '<circle class="hbd-spinner__fill"  cx="12" cy="12" r="10" ' +
          'transform="rotate(-90 12 12)"></circle>' +
      '</svg>' +
      '<span class="hbd-sr-only" role="status" aria-live="polite">' +
        this._escapeText(label) +
      '</span>';
  }
}

if (!customElements.get('hbd-spinner')) {
  customElements.define('hbd-spinner', HbdSpinner);
}
