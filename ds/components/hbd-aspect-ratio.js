// ds/components/hbd-aspect-ratio.js
// Here Be Dragons DS — <hbd-aspect-ratio> custom element (CLAUDE.md §7).
//
// Light DOM. A layout wrapper that constrains its first child to a
// fixed aspect ratio using the native `aspect-ratio` CSS property
// (see aspect-ratio.css). Authors slot any sized-by-container
// element inside — <img>, <video>, <iframe>, <canvas>, or just a
// plain <div>.
//
// Authoring shape:
//
//   <hbd-aspect-ratio ratio="16:9">
//     <img src="hero.jpg" alt="Ancient red dragon over Mount Doom">
//   </hbd-aspect-ratio>
//
//   <hbd-aspect-ratio ratio="1:1">
//     <video src="loop.mp4" autoplay muted loop aria-label="Combat preview"></video>
//   </hbd-aspect-ratio>
//
// Attributes:
//   ratio — accepts three notations:
//             "16:9", "4:3", "1:1", "3:2", "21:9", "9:16"  (colon)
//             "16/9"                                        (slash)
//             "1.777"                                       (decimal)
//           Default "16:9".
//
// Accessibility note for authors:
//   The wrapper carries no ARIA of its own. If the slotted child is
//   purely decorative or lacks an intrinsic accessible name, the
//   author must add the appropriate ARIA on the CHILD (alt="" on
//   decorative <img>, aria-label on <iframe>/<canvas>, role="img"
//   + aria-label on a styled <div>, etc.).

class HbdAspectRatio extends HTMLElement {
  static get observedAttributes() {
    return ['ratio'];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(_n, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (!this.isConnected) return;
    this._render();
  }

  _parseRatio(raw) {
    const value = String(raw || '').trim();
    if (!value) return '16 / 9';
    if (value.includes(':')) {
      // "16:9" → "16 / 9"
      const [w, h] = value.split(':').map((s) => s.trim());
      if (w && h) return `${w} / ${h}`;
    }
    if (value.includes('/')) {
      // "16/9" or "16 / 9" → "16 / 9"
      const [w, h] = value.split('/').map((s) => s.trim());
      if (w && h) return `${w} / ${h}`;
    }
    // Decimal — e.g. "1.777" → CSS aspect-ratio accepts a number.
    if (/^\d+(\.\d+)?$/.test(value)) return value;
    return '16 / 9';
  }

  _render() {
    this.className = 'hbd-aspect-ratio';
    const cssRatio = this._parseRatio(this.getAttribute('ratio'));
    // Instance-private custom property — never tokenised; per-call
    // value driven by the author. See aspect-ratio.css header.
    this.style.setProperty('--_hbd-ar', cssRatio);
  }
}

if (!customElements.get('hbd-aspect-ratio')) {
  customElements.define('hbd-aspect-ratio', HbdAspectRatio);
}
