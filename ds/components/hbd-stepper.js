// ds/components/hbd-stepper.js
// Here Be Dragons DS — <hbd-stepper> custom element (CLAUDE.md §7).
//
// Numeric stepper: a number input flanked by decrement (−) and increment (+)
// buttons. Use when the valid range is small and predictable (spell slot
// level, character level, quantity). For larger ranges or precision-driven
// values, use a plain <hbd-input type="number">.
//
// Shadow DOM. Styles are loaded via adopted stylesheets
// (see ../utils/shared-styles.js).
//
// Keyboard model: the native <input type="number"> is the SOLE Tab stop.
// The two step buttons are tabindex="-1" — they remain clickable by mouse
// and touch, but keyboard users increment/decrement via the input's native
// arrow keys (and PageUp/PageDown/Home/End handled in _onKeydown). This
// avoids three Tab stops for what is logically one field.

import { adoptStyles } from '../utils/shared-styles.js';

let uidCounter = 0;

class HbdStepper extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'value', 'min', 'max', 'step', 'label', 'hint', 'error',
      'required', 'disabled', 'name', 'size',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-stepper-${++uidCounter}`;
    this._value = this.getAttribute('value') ?? '0';
    this._ready = false;
    this._onIncrement = this._onIncrement.bind(this);
    this._onDecrement = this._onDecrement.bind(this);
    this._onInput = this._onInput.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/input.css',
    ]);
    this._ready = true;
    this._render();
    this._internals.setFormValue(this._value);
  }

  disconnectedCallback() {
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value') this._value = newVal ?? '0';
    if (this._ready) this._render();
  }

  // ── Public value reflection ─────────────────────────────────────────
  get value() { return this._value; }
  set value(v) {
    this._value = v == null ? '0' : String(v);
    this.setAttribute('value', this._value);
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  get _size() {
    const s = this.getAttribute('size') || 'md';
    return ['sm', 'md', 'lg'].includes(s) ? s : 'md';
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _describedBy(ids) {
    return ids.filter(Boolean).join(' ');
  }

  // Decimal precision of the step value — used to round results and avoid
  // float drift like 0.1 + 0.2 = 0.30000000000000004.
  _decimalPlaces(n) {
    const s = String(n);
    const i = s.indexOf('.');
    return i === -1 ? 0 : s.length - i - 1;
  }

  _stepValue() {
    const raw = parseFloat(this.getAttribute('step'));
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }

  _minValue() {
    const raw = this.getAttribute('min');
    return raw === null || raw === '' ? null : parseFloat(raw);
  }

  _maxValue() {
    const raw = this.getAttribute('max');
    return raw === null || raw === '' ? null : parseFloat(raw);
  }

  _removeListeners() {
    const dec = this.shadowRoot.querySelector('.hbd-stepper__button--decrement');
    const inc = this.shadowRoot.querySelector('.hbd-stepper__button--increment');
    const input = this.shadowRoot.querySelector('.hbd-stepper__input');
    if (dec) dec.removeEventListener('click', this._onDecrement);
    if (inc) inc.removeEventListener('click', this._onIncrement);
    if (input) {
      input.removeEventListener('input', this._onInput);
      input.removeEventListener('blur', this._onBlur);
      input.removeEventListener('keydown', this._onKeydown);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint');
    const error = this.getAttribute('error');
    const required = this.hasAttribute('required');
    const disabled = this.hasAttribute('disabled');
    const name = this.getAttribute('name');
    const min = this._minValue();
    const max = this._maxValue();
    const step = this._stepValue();

    const hasError = error != null && error !== '';
    const hasHint = hint != null && hint !== '';

    const classes = ['hbd-field', `hbd-field--${this._size}`];
    if (hasError) classes.push('hbd-field--error');
    if (disabled) classes.push('hbd-field--disabled');

    const describedBy = this._describedBy([
      hasHint ? `hint-${uid}` : '',
      hasError ? `error-${uid}` : '',
    ]);

    const ariaLabelDec = `Decrease ${label || 'value'}`;
    const ariaLabelInc = `Increase ${label || 'value'}`;

    this.shadowRoot.innerHTML = `
      <div class="${classes.join(' ')}">
        ${label ? `
        <label class="hbd-field__label" for="${uid}">
          ${this._esc(label)}${required ? `<span class="hbd-field__label-required" aria-hidden="true">*</span>` : ''}
        </label>` : ''}

        <div class="hbd-field__input-wrapper">
          <div class="hbd-stepper" role="group"${label ? ` aria-labelledby="label-${uid}"` : ''}>

            <button type="button"
                    class="hbd-stepper__button hbd-stepper__button--decrement"
                    aria-label="${this._esc(ariaLabelDec)}"
                    tabindex="-1"
                    ${disabled ? 'disabled' : ''}>
              &minus;
            </button>

            <input
              class="hbd-stepper__input"
              id="${uid}"
              type="number"
              value="${this._esc(this._value)}"
              ${min !== null ? `min="${min}"` : ''}
              ${max !== null ? `max="${max}"` : ''}
              step="${step}"
              ${name ? `name="${this._esc(name)}"` : ''}
              ${describedBy ? `aria-describedby="${describedBy}"` : ''}
              ${required ? 'aria-required="true" required' : ''}
              ${hasError ? 'aria-invalid="true"' : ''}
              ${disabled ? 'disabled' : ''}
            >

            <button type="button"
                    class="hbd-stepper__button hbd-stepper__button--increment"
                    aria-label="${this._esc(ariaLabelInc)}"
                    tabindex="-1"
                    ${disabled ? 'disabled' : ''}>
              +
            </button>

          </div>
        </div>

        <div class="hbd-field__footer">
          ${hasHint ? `<span class="hbd-field__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
          ${hasError ? `<span class="hbd-field__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
        </div>
      </div>
    `;

    const dec = this.shadowRoot.querySelector('.hbd-stepper__button--decrement');
    const inc = this.shadowRoot.querySelector('.hbd-stepper__button--increment');
    const input = this.shadowRoot.querySelector('.hbd-stepper__input');
    dec.addEventListener('click', this._onDecrement);
    inc.addEventListener('click', this._onIncrement);
    input.addEventListener('input', this._onInput);
    input.addEventListener('blur', this._onBlur);
    input.addEventListener('keydown', this._onKeydown);

    this._updateBoundaries();
    this._syncValidity(input);
  }

  // ── Increment / decrement / direct set ──────────────────────────────
  _increment(multiplier = 1) {
    const input = this.shadowRoot.querySelector('.hbd-stepper__input');
    const current = parseFloat(input.value);
    const base = Number.isFinite(current) ? current : (this._minValue() ?? 0);
    const step = this._stepValue() * multiplier;
    const max = this._maxValue();
    let next = base + step;
    if (max !== null && next > max) next = max;
    this._setValue(next);
  }

  _decrement(multiplier = 1) {
    const input = this.shadowRoot.querySelector('.hbd-stepper__input');
    const current = parseFloat(input.value);
    const base = Number.isFinite(current) ? current : (this._maxValue() ?? 0);
    const step = this._stepValue() * multiplier;
    const min = this._minValue();
    let next = base - step;
    if (min !== null && next < min) next = min;
    this._setValue(next);
  }

  _setValue(n) {
    const step = this._stepValue();
    const dp = this._decimalPlaces(step);
    const rounded = parseFloat(n.toFixed(dp));
    const str = String(rounded);

    this._value = str;
    const input = this.shadowRoot.querySelector('.hbd-stepper__input');
    if (input && input.value !== str) input.value = str;

    this._internals.setFormValue(this._value);
    this._updateBoundaries();
    if (input) this._syncValidity(input);

    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { value: this._value, name: this.getAttribute('name') },
      bubbles: true,
      composed: true,
    }));
  }

  _updateBoundaries() {
    const input = this.shadowRoot.querySelector('.hbd-stepper__input');
    const dec = this.shadowRoot.querySelector('.hbd-stepper__button--decrement');
    const inc = this.shadowRoot.querySelector('.hbd-stepper__button--increment');
    if (!input || !dec || !inc) return;

    if (this.hasAttribute('disabled')) {
      dec.disabled = true;
      inc.disabled = true;
      dec.classList.add('is-disabled');
      inc.classList.add('is-disabled');
      return;
    }

    const val = parseFloat(input.value);
    const min = this._minValue();
    const max = this._maxValue();

    const atMin = Number.isFinite(val) && min !== null && val <= min;
    const atMax = Number.isFinite(val) && max !== null && val >= max;

    dec.disabled = atMin;
    inc.disabled = atMax;
    dec.classList.toggle('is-disabled', atMin);
    inc.classList.toggle('is-disabled', atMax);
  }

  _syncValidity(input) {
    if (input.validity.valid) {
      this._internals.setValidity({});
    } else {
      this._internals.setValidity(
        input.validity,
        input.validationMessage,
        input,
      );
    }
  }

  // ── Event handlers ──────────────────────────────────────────────────
  _onIncrement() {
    if (this.hasAttribute('disabled')) return;
    this._increment();
    const input = this.shadowRoot.querySelector('.hbd-stepper__input');
    if (input) input.focus();
  }

  _onDecrement() {
    if (this.hasAttribute('disabled')) return;
    this._decrement();
    const input = this.shadowRoot.querySelector('.hbd-stepper__input');
    if (input) input.focus();
  }

  // Allow free typing — only sync the in-flight raw value, don't clamp
  // (clamping mid-type would block valid intermediates like "-" or ".5").
  _onInput(e) {
    this._value = e.target.value;
    this._internals.setFormValue(this._value);
    this._syncValidity(e.target);
    this.dispatchEvent(new CustomEvent('hbd:input', {
      detail: { value: this._value, name: this.getAttribute('name') },
      bubbles: true,
      composed: true,
    }));
  }

  // On blur: parse, revert to last valid if NaN, clamp, round to step precision.
  _onBlur(e) {
    const raw = e.target.value;
    const parsed = parseFloat(raw);

    if (!Number.isFinite(parsed)) {
      // Revert to last valid value.
      e.target.value = this._value;
      this._updateBoundaries();
      return;
    }

    let next = parsed;
    const min = this._minValue();
    const max = this._maxValue();
    if (min !== null && next < min) next = min;
    if (max !== null && next > max) next = max;

    this._setValue(next);
  }

  _onKeydown(e) {
    if (this.hasAttribute('disabled')) return;

    const min = this._minValue();
    const max = this._maxValue();

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this._increment();
        return;
      case 'ArrowDown':
        e.preventDefault();
        this._decrement();
        return;
      case 'PageUp':
        e.preventDefault();
        this._increment(10);
        return;
      case 'PageDown':
        e.preventDefault();
        this._decrement(10);
        return;
      case 'Home':
        if (min !== null) {
          e.preventDefault();
          this._setValue(min);
        }
        return;
      case 'End':
        if (max !== null) {
          e.preventDefault();
          this._setValue(max);
        }
        return;
      default:
        return;
    }
  }
}

if (!customElements.get('hbd-stepper')) {
  customElements.define('hbd-stepper', HbdStepper);
}
