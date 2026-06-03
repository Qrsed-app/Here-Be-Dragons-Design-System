// ds/components/hbd-progress.js
// Here Be Dragons DS — <hbd-progress> custom element (CLAUDE.md §7).
//
// Light DOM. Three modes, picked by attributes:
//   1. Determinate    — `value` set, renders a sized fill bar.
//   2. Indeterminate  — `value` absent; the fill shimmers from CSS.
//   3. Segmented      — `segments` set; N filled cells of M.
//
// The fill's `width` is the one inline-style exception; everything
// else (track, colours, durations, easing) lives in progress.css.
//
// Attributes:
//   value      — current value (0..max). When absent → indeterminate.
//   max        — upper bound (default 100).
//   label      — visible label rendered in the label-row.
//   show-value — boolean; renders "N%" alongside the label.
//   variant    — "default" | "success" | "warning" | "error".
//   size       — "sm" | "md" (default) | "lg".
//   striped    — boolean; animated diagonal stripe overlay.
//   segments   — integer; enables segmented mode with N segments.
//
// Public methods:
//   setValue(n) — clamp, store, animate fill width, update ARIA.

class HbdProgress extends HTMLElement {
  static get observedAttributes() {
    return [
      'value', 'max', 'label', 'show-value',
      'variant', 'size', 'striped', 'segments',
    ];
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

  // ─── Attribute readers ──────────────────────────────────────────
  get _hasValue() { return this.getAttribute('value') != null; }
  get _max() {
    const n = parseFloat(this.getAttribute('max'));
    return Number.isFinite(n) && n > 0 ? n : 100;
  }
  get _rawValue() {
    const n = parseFloat(this.getAttribute('value'));
    return Number.isFinite(n) ? n : 0;
  }
  /** Value clamped to [0, max]. */
  get _clampedValue() {
    return Math.max(0, Math.min(this._rawValue, this._max));
  }
  /** Percentage 0..100, used for the fill width and ARIA. */
  get _percent() {
    return (this._clampedValue / this._max) * 100;
  }
  get _segments() {
    const n = parseInt(this.getAttribute('segments'), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  get _variant() {
    const v = (this.getAttribute('variant') || 'default').toLowerCase();
    return ['default', 'success', 'warning', 'error'].includes(v)
      ? v : 'default';
  }
  get _size() {
    const s = (this.getAttribute('size') || 'md').toLowerCase();
    return ['sm', 'md', 'lg'].includes(s) ? s : 'md';
  }
  get _label() { return this.getAttribute('label') || ''; }
  get _showValue() { return this.hasAttribute('show-value'); }
  get _isStriped() { return this.hasAttribute('striped'); }
  get _mode() {
    if (this._segments > 0) return 'segmented';
    if (!this._hasValue) return 'indeterminate';
    return 'determinate';
  }

  // ─── Public API ─────────────────────────────────────────────────
  /** Update the value without a full re-render — just slide the fill
   *  and update the ARIA value. Falls back to a re-render in modes
   *  that don't have a sliding fill (indeterminate, segmented). */
  setValue(n) {
    const max = this._max;
    const clamped = Math.max(0, Math.min(parseFloat(n) || 0, max));
    this.setAttribute('value', String(clamped));
    if (this._mode !== 'determinate') return;
    const fill = this.querySelector('.hbd-progress__fill');
    if (fill) fill.style.width = `${(clamped / max) * 100}%`;
    const bar = this.querySelector('[role="progressbar"]');
    if (bar) {
      bar.setAttribute('aria-valuenow', String(clamped));
      bar.setAttribute(
        'aria-valuetext',
        this._formatValueText(clamped, max)
      );
    }
    const valueEl = this.querySelector('.hbd-progress__value');
    if (valueEl) valueEl.textContent = `${Math.round((clamped / max) * 100)}%`;
  }

  _formatValueText(value, max) {
    const pct = Math.round((value / max) * 100);
    const label = this._label;
    return label ? `${pct}% — ${label}` : `${pct}%`;
  }

  // ─── Render ─────────────────────────────────────────────────────
  _render() {
    if (!this._ready) return;

    const mode = this._mode;
    const variant = this._variant;
    const size = this._size;
    const label = this._label;
    const showValue = this._showValue;

    // Host classes carry every modifier so authors can target them
    // with their own page-level CSS if needed.
    const classes = ['hbd-progress'];
    if (size !== 'md') classes.push(`hbd-progress--${size}`);
    if (variant !== 'default') classes.push(`hbd-progress--${variant}`);
    if (mode === 'indeterminate') classes.push('hbd-progress--indeterminate');
    if (mode === 'segmented')     classes.push('hbd-progress--segmented');
    if (this._isStriped && mode === 'determinate') classes.push('hbd-progress--striped');
    this.className = classes.join(' ');

    // Label row.
    let labelRow = '';
    const valueDisplay = mode === 'determinate' && showValue
      ? `${Math.round(this._percent)}%`
      : '';
    if (label || valueDisplay) {
      labelRow =
        `<div class="hbd-progress__label-row">` +
          (label
            ? `<span class="hbd-progress__label">${escapeText(label)}</span>`
            : '<span></span>') +
          (valueDisplay
            ? `<span class="hbd-progress__value" aria-hidden="true">${valueDisplay}</span>`
            : '') +
        `</div>`;
    }

    // ARIA: the progressbar role lives on the track (or segments
    // wrapper for segmented mode). Indeterminate explicitly omits
    // aria-valuenow — empty-string would be invalid.
    const max = this._max;
    const ariaLabel = label || 'Progress';
    let bodyHtml = '';

    if (mode === 'segmented') {
      const total = this._segments;
      const value = this._clampedValue;
      const filled = Math.round((value / max) * total);
      const cells = [];
      for (let i = 0; i < total; i += 1) {
        const isFilled = i < filled;
        cells.push(
          `<div class="hbd-progress__segment${isFilled ? ' is-filled' : ''}"
                aria-hidden="true"></div>`
        );
      }
      bodyHtml =
        `<div class="hbd-progress__segments"
              role="progressbar"
              aria-label="${escapeAttr(ariaLabel)}"
              aria-valuemin="0"
              aria-valuemax="${total}"
              aria-valuenow="${filled}"
              aria-valuetext="${escapeAttr(filled + ' of ' + total)}">` +
          cells.join('') +
        `</div>`;
    } else if (mode === 'indeterminate') {
      bodyHtml =
        `<div class="hbd-progress__track"
              role="progressbar"
              aria-label="${escapeAttr(ariaLabel)}"
              aria-valuemin="0"
              aria-valuemax="${max}">
           <div class="hbd-progress__fill"></div>
         </div>`;
    } else {
      // determinate
      const clamped = this._clampedValue;
      const percent = this._percent;
      bodyHtml =
        `<div class="hbd-progress__track"
              role="progressbar"
              aria-label="${escapeAttr(ariaLabel)}"
              aria-valuemin="0"
              aria-valuemax="${max}"
              aria-valuenow="${clamped}"
              aria-valuetext="${escapeAttr(this._formatValueText(clamped, max))}">
           <div class="hbd-progress__fill" style="width: ${percent}%;"></div>
         </div>`;
    }

    this.innerHTML = labelRow + bodyHtml;
  }
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!customElements.get('hbd-progress')) {
  customElements.define('hbd-progress', HbdProgress);
}
