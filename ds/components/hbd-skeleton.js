// ds/components/hbd-skeleton.js
// Here Be Dragons DS — <hbd-skeleton> custom element (CLAUDE.md §7).
//
// Light DOM. A decorative placeholder shape used while real content
// loads. The skeleton itself is aria-hidden — the SURROUNDING
// container that becomes the real content is responsible for the
// loading affordance:
//
//   <div aria-busy="true" aria-label="Loading spell list">
//     <hbd-skeleton-group preset="list-item"></hbd-skeleton-group>
//   </div>
//
// Once data arrives the author flips aria-busy="false" and replaces
// the skeletons with the real DOM. The skeleton component never
// participates in the accessibility tree — that is by design.
//
// Attributes:
//   variant — "text" (default) | "text-sm" | "text-lg" | "circle" | "rect"
//   width   — CSS width override (e.g. "120px", "60%")
//   height  — CSS height override (required for "rect" variant)
//   no-shimmer — boolean; disables the shimmer animation. Equivalent
//                to the reduced-motion appearance, useful in tests
//                and for fully-static placeholders.

const VARIANTS = ['text', 'text-sm', 'text-lg', 'circle', 'rect'];

class HbdSkeleton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'width', 'height', 'no-shimmer'];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(_n, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (this.isConnected) this._render();
  }

  _render() {
    const raw = (this.getAttribute('variant') || 'text').toLowerCase();
    const variant = VARIANTS.includes(raw) ? raw : 'text';
    const classes = ['hbd-skeleton', `hbd-skeleton--${variant}`];
    if (this.hasAttribute('no-shimmer')) classes.push('hbd-skeleton--no-shimmer');
    this.className = classes.join(' ');
    this.setAttribute('aria-hidden', 'true');

    // width/height are author-supplied value-driven properties —
    // documented inline-style exception (same pattern as
    // hbd-progress fill width). Reset to '' when the attr is absent
    // so removing the attribute doesn't leave the previous value.
    const width = this.getAttribute('width');
    this.style.width = width != null ? width : '';

    const height = this.getAttribute('height');
    this.style.height = height != null ? height : '';
  }
}

if (!customElements.get('hbd-skeleton')) {
  customElements.define('hbd-skeleton', HbdSkeleton);
}
