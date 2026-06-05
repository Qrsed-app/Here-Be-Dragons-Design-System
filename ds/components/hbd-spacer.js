// ds/components/hbd-spacer.js
// Here Be Dragons DS — <hbd-spacer> custom element (CLAUDE.md §7).
//
// Light DOM. Explicit whitespace control. Produces no visible UI:
// width/height are written inline based on the size + axis
// attributes, and the host is marked as decorative
// (role="none" aria-hidden="true") so it never participates in the
// accessibility tree.
//
// Authoring shape:
//
//   <hbd-spacer size="4"></hbd-spacer>            <!-- 16px vertical -->
//   <hbd-spacer size="8" axis="horizontal"></hbd-spacer>
//   <hbd-spacer size="2rem" axis="both"></hbd-spacer>
//
// Attributes:
//   size — numeric token key ("1" .. "24") OR a raw CSS length
//          ("32px", "2rem", "10%"). Numeric keys resolve to
//          var(--hbd-space-N).
//   axis — "vertical" (default) | "horizontal" | "both"
//
// Naming note: the spec referred to --hbd-spacing-N. The build
// script remaps the JSON "spacing" category to the emitted "space"
// namespace, so the actual tokens are --hbd-space-N. The allowed
// numeric keys (1, 2, 3, 4, 6, 8, 12, 16, 24, 32) match the
// emitted scale.

const VALID_AXES = ['vertical', 'horizontal', 'both'];

// Mirror of the emitted spacing scale (tokens.json → spacing).
// Numeric keys outside this set fall through to "treat as raw CSS".
const VALID_SCALE = new Set(['1', '2', '3', '4', '6', '8', '12', '16', '24', '32']);

class HbdSpacer extends HTMLElement {
  static get observedAttributes() {
    return ['size', 'axis'];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(_n, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (!this.isConnected) return;
    this._render();
  }

  _axis() {
    const raw = (this.getAttribute('axis') || 'vertical').toLowerCase();
    return VALID_AXES.includes(raw) ? raw : 'vertical';
  }

  // Map "4" → "var(--hbd-space-4)"; pass anything else through.
  // A bare integer that isn't in the emitted scale (e.g. "5") is
  // treated as a raw CSS value — the browser will reject it silently
  // if invalid, which is acceptable for an authoring mistake.
  _resolveSize(size) {
    if (!size) return '';
    if (VALID_SCALE.has(size)) return `var(--hbd-space-${size})`;
    return size;
  }

  _render() {
    this.className = 'hbd-spacer';
    // Decorative — keep out of the a11y tree and the Tab order.
    this.setAttribute('aria-hidden', 'true');
    this.setAttribute('role', 'none');

    const value = this._resolveSize(this.getAttribute('size'));
    const axis = this._axis();

    // Reset whichever inline dimension isn't in play, so toggling
    // axis at runtime doesn't leave a stale value behind.
    if (axis === 'vertical' || axis === 'both') {
      this.style.height = value;
    } else {
      this.style.height = '';
    }
    if (axis === 'horizontal' || axis === 'both') {
      this.style.width = value;
    } else {
      this.style.width = '';
    }
  }
}

if (!customElements.get('hbd-spacer')) {
  customElements.define('hbd-spacer', HbdSpacer);
}
