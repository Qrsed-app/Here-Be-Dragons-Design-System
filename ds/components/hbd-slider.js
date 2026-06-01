// ds/components/hbd-slider.js
// Here Be Dragons DS — <hbd-slider> custom element (CLAUDE.md §7).
//
// Single-handle and range (two-handle) slider. Built on native
// input[type="range"] — the native input handles ALL pointer + keyboard
// interactions (no custom drag/keyboard code). We layer a transparent
// native input over a styled track + thumb; JS updates the thumb/fill
// inline `left` / `width` whenever the input fires.
//
// Inline styles on the fill/thumb are a documented exception (parallel
// to the auto-resize textarea height): the position is value-driven and
// cannot be expressed in CSS without a custom property bridge per
// instance.
//
// Form association:
//   Single  — _internals.setFormValue(value) on every input.
//   Range   — ElementInternals carries ONE value per host (the low
//             value), so for full two-value form submission the native
//             inputs in the shadow root carry name-low / name-high
//             attributes. Shadow-DOM form participation has caveats
//             (the native inputs are scoped to the shadow root, not
//             the outer form); consumers that need both values
//             reliably should listen to the `hbd:change` event detail.
//
// Styles: adopted stylesheets (../utils/shared-styles.js) — no FOUC.

import { adoptStyles } from '../utils/shared-styles.js';

let uidCounter = 0;

class HbdSlider extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'min', 'max', 'step', 'value', 'value-low', 'value-high', 'range',
      'label', 'hint', 'error', 'disabled', 'show-value', 'show-ticks',
      'tick-count', 'size', 'name', 'name-low', 'name-high',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-slider-${++uidCounter}`;
    this._ready = false;
    // Internal numeric state (kept as numbers to avoid repeated parseFloat).
    this._value = this._toNum(this.getAttribute('value'), 0);
    this._valueLow = this._toNum(this.getAttribute('value-low'), 0);
    this._valueHigh = this._toNum(this.getAttribute('value-high'), 100);
    this._onInput = this._onInput.bind(this);
    this._onChange = this._onChange.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onFocusIn = this._onFocusIn.bind(this);
    this._onFocusOut = this._onFocusOut.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/input.css',
    ]);
    this._ready = true;
    this._render();
    this._updatePositions();
    this._syncFormValue();

    // Pointer-up listeners go on window so we catch releases outside the
    // component (e.g. drag-out then release).
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('blur', this._onPointerUp);
  }

  disconnectedCallback() {
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('blur', this._onPointerUp);
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    if (name === 'value') this._value = this._toNum(newVal, 0);
    if (name === 'value-low') this._valueLow = this._toNum(newVal, this._min);
    if (name === 'value-high') this._valueHigh = this._toNum(newVal, this._max);
    if (this.isConnected) {
      this._render();
      this._updatePositions();
      this._syncFormValue();
    }
  }

  // ── Public reflection ───────────────────────────────────────────────
  get value() { return this._isRange() ? [this._valueLow, this._valueHigh] : this._value; }
  set value(v) {
    if (this._isRange()) return; // use valueLow/valueHigh setters for range
    this._value = this._toNum(v, this._min);
    this.setAttribute('value', String(this._value));
  }
  get valueLow() { return this._valueLow; }
  set valueLow(v) {
    this._valueLow = this._toNum(v, this._min);
    this.setAttribute('value-low', String(this._valueLow));
  }
  get valueHigh() { return this._valueHigh; }
  set valueHigh(v) {
    this._valueHigh = this._toNum(v, this._max);
    this.setAttribute('value-high', String(this._valueHigh));
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  _toNum(v, fallback) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  _isRange() { return this.hasAttribute('range'); }
  get _min() { return this._toNum(this.getAttribute('min'), 0); }
  get _max() { return this._toNum(this.getAttribute('max'), 100); }
  get _step() { return this._toNum(this.getAttribute('step'), 1); }
  get _size() {
    const s = this.getAttribute('size') || 'md';
    return ['sm', 'md', 'lg'].includes(s) ? s : 'md';
  }

  // Build aria-describedby from only the non-empty message IDs.
  _describedBy(ids) { return ids.filter(Boolean).join(' '); }

  _removeListeners() {
    const inputs = this.shadowRoot.querySelectorAll('.hbd-slider__input');
    inputs.forEach((input) => {
      input.removeEventListener('input', this._onInput);
      input.removeEventListener('change', this._onChange);
      input.removeEventListener('pointerdown', this._onPointerDown);
      input.removeEventListener('focusin', this._onFocusIn);
      input.removeEventListener('focusout', this._onFocusOut);
    });
  }

  // ── Render ──────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const min = this._min;
    const max = this._max;
    const step = this._step;
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint');
    const error = this.getAttribute('error');
    const disabled = this.hasAttribute('disabled');
    const showValue = this.hasAttribute('show-value');
    const showTicks = this.hasAttribute('show-ticks');
    const isRange = this._isRange();

    const hasError = error != null && error !== '';
    const hasHint = hint != null && hint !== '';

    const fieldClasses = ['hbd-slider-field', `hbd-slider-field--${this._size}`];
    if (disabled) fieldClasses.push('hbd-slider-field--disabled');
    if (hasError) fieldClasses.push('hbd-slider-field--error');

    const describedBy = this._describedBy([
      hasHint ? `hint-${uid}` : '',
      hasError ? `error-${uid}` : '',
    ]);

    const valueDisplay = showValue
      ? `<span class="hbd-slider-field__value-display" aria-live="polite" aria-atomic="true">${this._displayValue()}</span>`
      : '';

    let inputsHtml = '';
    let thumbsHtml = '';
    if (isRange) {
      // Range: two inputs (low + high), two thumbs. data-handle marks which.
      const nameLow = this.getAttribute('name-low') || '';
      const nameHigh = this.getAttribute('name-high') || '';
      inputsHtml = `
        <input
          class="hbd-slider__input"
          data-handle="low"
          type="range"
          min="${min}" max="${max}" step="${step}"
          value="${this._valueLow}"
          aria-label="${this._esc(label || 'Slider')} minimum"
          ${nameLow ? `name="${this._esc(nameLow)}"` : ''}
          ${describedBy ? `aria-describedby="${describedBy}"` : ''}
          ${hasError ? 'aria-invalid="true"' : ''}
          ${disabled ? 'disabled' : ''}>
        <input
          class="hbd-slider__input"
          data-handle="high"
          type="range"
          min="${min}" max="${max}" step="${step}"
          value="${this._valueHigh}"
          aria-label="${this._esc(label || 'Slider')} maximum"
          ${nameHigh ? `name="${this._esc(nameHigh)}"` : ''}
          ${describedBy ? `aria-describedby="${describedBy}"` : ''}
          ${hasError ? 'aria-invalid="true"' : ''}
          ${disabled ? 'disabled' : ''}>`;
      thumbsHtml = `
        <div class="hbd-slider__thumb-wrapper" data-handle="low">
          <div class="hbd-slider__thumb"></div>
        </div>
        <div class="hbd-slider__thumb-wrapper" data-handle="high">
          <div class="hbd-slider__thumb"></div>
        </div>`;
    } else {
      const name = this.getAttribute('name') || '';
      inputsHtml = `
        <input
          class="hbd-slider__input"
          id="slider-${uid}"
          data-handle="single"
          type="range"
          min="${min}" max="${max}" step="${step}"
          value="${this._value}"
          ${label ? '' : 'aria-label="Slider"'}
          ${name ? `name="${this._esc(name)}"` : ''}
          ${describedBy ? `aria-describedby="${describedBy}"` : ''}
          ${hasError ? 'aria-invalid="true"' : ''}
          ${disabled ? 'disabled' : ''}>`;
      thumbsHtml = `
        <div class="hbd-slider__thumb-wrapper" data-handle="single">
          <div class="hbd-slider__thumb"></div>
        </div>`;
    }

    const ticksHtml = showTicks ? this._renderTicks(min, max) : '';

    this.shadowRoot.innerHTML = `
      <div class="${fieldClasses.join(' ')}">
        ${label || showValue ? `
        <div class="hbd-slider-field__header">
          ${label ? `<label class="hbd-slider-field__label" for="slider-${uid}">${this._esc(label)}</label>` : '<span></span>'}
          ${valueDisplay}
        </div>` : ''}

        <div class="hbd-slider__track-container">
          <div class="hbd-slider__track">
            <div class="hbd-slider__fill"></div>
          </div>
          ${inputsHtml}
          ${thumbsHtml}
        </div>
        ${ticksHtml}

        ${(hasHint || hasError) ? `
        <div class="hbd-field__footer">
          ${hasHint ? `<span class="hbd-field__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
          ${hasError ? `<span class="hbd-field__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
        </div>` : ''}
      </div>
    `;

    // Wire input listeners.
    const inputs = this.shadowRoot.querySelectorAll('.hbd-slider__input');
    inputs.forEach((input) => {
      input.addEventListener('input', this._onInput);
      input.addEventListener('change', this._onChange);
      input.addEventListener('pointerdown', this._onPointerDown);
      input.addEventListener('focusin', this._onFocusIn);
      input.addEventListener('focusout', this._onFocusOut);
    });
  }

  _renderTicks(min, max) {
    const count = Math.max(2, parseInt(this.getAttribute('tick-count'), 10) || 5);
    let html = '<div class="hbd-slider__ticks" aria-hidden="true">';
    for (let i = 0; i < count; i++) {
      const v = min + ((max - min) * i) / (count - 1);
      // Round to step granularity for nicer labels.
      const step = this._step;
      const rounded = step >= 1 ? Math.round(v) : Math.round(v * 100) / 100;
      html += `
        <div class="hbd-slider__tick">
          <span class="hbd-slider__tick-mark"></span>
          <span class="hbd-slider__tick-label">${rounded}</span>
        </div>`;
    }
    html += '</div>';
    return html;
  }

  _displayValue() {
    if (this._isRange()) return `${this._valueLow} – ${this._valueHigh}`;
    return String(this._value);
  }

  // Position the fill bar and each thumb wrapper as a percentage of the
  // track. Direct inline-style writes — value-driven layout that cannot
  // be expressed in CSS without per-instance custom-property plumbing.
  _updatePositions() {
    const root = this.shadowRoot;
    const fill = root.querySelector('.hbd-slider__fill');
    if (!fill) return;
    const min = this._min;
    const max = this._max;
    const range = max - min || 1;

    if (this._isRange()) {
      const lowPct = ((this._valueLow - min) / range) * 100;
      const highPct = ((this._valueHigh - min) / range) * 100;
      fill.style.left = `${lowPct}%`;
      fill.style.width = `${highPct - lowPct}%`;
      const lowWrap = root.querySelector('.hbd-slider__thumb-wrapper[data-handle="low"]');
      const highWrap = root.querySelector('.hbd-slider__thumb-wrapper[data-handle="high"]');
      if (lowWrap) lowWrap.style.left = `${lowPct}%`;
      if (highWrap) highWrap.style.left = `${highPct}%`;

      // Both range inputs span the whole track and overlap. Without a
      // hit-region split, the SECOND input in source order (high) wins
      // every initial click anywhere on the track and the low handle is
      // un-grabbable. clip-path restricts each input's pointer surface
      // to its own half of the track, split at the midpoint between the
      // two current values. Native pointer-capture takes over once a
      // drag starts, so dragging across the split still works.
      const splitPct = (lowPct + highPct) / 2;
      const lowInput = root.querySelector('.hbd-slider__input[data-handle="low"]');
      const highInput = root.querySelector('.hbd-slider__input[data-handle="high"]');
      if (lowInput) lowInput.style.clipPath = `inset(0 ${100 - splitPct}% 0 0)`;
      if (highInput) highInput.style.clipPath = `inset(0 0 0 ${splitPct}%)`;
    } else {
      const pct = ((this._value - min) / range) * 100;
      fill.style.width = `${pct}%`;
      fill.style.left = '0%';
      const wrap = root.querySelector('.hbd-slider__thumb-wrapper[data-handle="single"]');
      if (wrap) wrap.style.left = `${pct}%`;
    }

    // Sync the value display if present.
    const display = root.querySelector('.hbd-slider-field__value-display');
    if (display) display.textContent = this._displayValue();
  }

  _syncFormValue() {
    if (this._isRange()) {
      // ElementInternals carries one value — submit the LOW value as the
      // host's form value; the high value rides the native input's
      // name-high attribute. Consumers needing both should listen to
      // hbd:change for the canonical detail.
      this._internals.setFormValue(String(this._valueLow));
    } else {
      this._internals.setFormValue(String(this._value));
    }
  }

  // ── Events ──────────────────────────────────────────────────────────
  _onInput(e) {
    const input = e.target;
    const newVal = this._toNum(input.value, 0);
    const handle = input.getAttribute('data-handle');

    if (handle === 'single') {
      this._value = newVal;
    } else if (handle === 'low') {
      // Clamp: low cannot exceed high - step.
      const cap = this._valueHigh - this._step;
      this._valueLow = Math.min(newVal, cap);
      if (this._valueLow !== newVal) input.value = String(this._valueLow);
    } else if (handle === 'high') {
      const cap = this._valueLow + this._step;
      this._valueHigh = Math.max(newVal, cap);
      if (this._valueHigh !== newVal) input.value = String(this._valueHigh);
    }

    this._updatePositions();
    this._syncFormValue();

    const detail = this._isRange()
      ? { valueLow: this._valueLow, valueHigh: this._valueHigh }
      : { value: this._value };
    this.dispatchEvent(new CustomEvent('hbd:input', {
      detail, bubbles: true, composed: true,
    }));
  }

  _onChange() {
    const detail = this._isRange()
      ? { valueLow: this._valueLow, valueHigh: this._valueHigh }
      : { value: this._value };
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail, bubbles: true, composed: true,
    }));
  }

  // Pointer-down on an input lifts it above its sibling and marks the
  // matching thumb as active (visual press-down).
  _onPointerDown(e) {
    const input = e.target;
    const handle = input.getAttribute('data-handle');
    // Range overlap: raise the touched input above the other.
    if (this._isRange()) {
      const other = handle === 'low' ? 'high' : 'low';
      const sibling = this.shadowRoot.querySelector(`.hbd-slider__input[data-handle="${other}"]`);
      input.style.zIndex = '2';
      if (sibling) sibling.style.zIndex = '1';
    }
    this._setThumbActive(handle, true);
  }

  _onPointerUp() {
    // Clear active state on all thumbs (release may happen outside).
    this.shadowRoot.querySelectorAll('.hbd-slider__thumb').forEach((t) => {
      t.classList.remove('is-active');
    });
  }

  _onFocusIn(e) {
    const handle = e.target.getAttribute('data-handle');
    this._setThumbFocused(handle, true);
  }
  _onFocusOut(e) {
    const handle = e.target.getAttribute('data-handle');
    this._setThumbFocused(handle, false);
  }

  _setThumbActive(handle, on) {
    const wrap = this.shadowRoot.querySelector(`.hbd-slider__thumb-wrapper[data-handle="${handle}"]`);
    const thumb = wrap && wrap.querySelector('.hbd-slider__thumb');
    if (thumb) thumb.classList.toggle('is-active', on);
  }
  _setThumbFocused(handle, on) {
    const wrap = this.shadowRoot.querySelector(`.hbd-slider__thumb-wrapper[data-handle="${handle}"]`);
    const thumb = wrap && wrap.querySelector('.hbd-slider__thumb');
    if (thumb) thumb.classList.toggle('is-focused', on);
  }

  // Native input[type="range"] handles all keyboard interactions:
  // Arrow keys step by step; Home/End jump to min/max; PageUp/PageDown
  // step by 10% of range. No custom keyboard handling needed.
}

if (!customElements.get('hbd-slider')) {
  customElements.define('hbd-slider', HbdSlider);
}
