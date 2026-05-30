// ds/components/hbd-input.js
// Here Be Dragons DS — <hbd-input> custom element (CLAUDE.md §7).
//
// The first form input in the DS. Establishes label association, helper/hint
// text, validation states (error/success), ARIA error linking, character count,
// password show/hide, and form association for all later form inputs.
//
// Shadow DOM (per task). Styles are loaded via adopted stylesheets
// (see ../utils/shared-styles.js), NOT via per-render <link> tags — adopting
// once eliminates the FOUC "blink" that would otherwise happen on every
// re-render when innerHTML is replaced. The native <input> lives in the shadow
// root; form association is bridged with ElementInternals.

import { adoptStyles } from '../utils/shared-styles.js';

const ALLOWED_TYPES = new Set([
  'text', 'email', 'password', 'search', 'tel', 'url', 'number',
]);

let uidCounter = 0;

class HbdInput extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'type', 'name', 'value', 'placeholder', 'label', 'hint', 'error',
      'success', 'required', 'disabled', 'readonly', 'maxlength', 'size',
      'prefix', 'suffix',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-input-${++uidCounter}`;
    this._value = this.getAttribute('value') || '';
    this._passwordVisible = false;
    this._onInput = this._onInput.bind(this);
    this._onChange = this._onChange.bind(this);
    this._onToggle = this._onToggle.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/input.css',
    ]);
    this._render();
    this._internals.setFormValue(this._value);
  }

  disconnectedCallback() {
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value') this._value = newVal || '';
    if (this.isConnected) this._render();
  }

  // ── Public value reflection ─────────────────────────────────────────
  get value() { return this._value; }
  set value(v) {
    this._value = v == null ? '' : String(v);
    this.setAttribute('value', this._value);
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  get _type() {
    const t = (this.getAttribute('type') || 'text').toLowerCase();
    return ALLOWED_TYPES.has(t) ? t : 'text';
  }
  get _isPassword() { return this._type === 'password'; }
  get _size() {
    const s = this.getAttribute('size') || 'md';
    return ['sm', 'md', 'lg'].includes(s) ? s : 'md';
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _removeListeners() {
    const input = this.shadowRoot.querySelector('.hbd-field__input');
    if (input) {
      input.removeEventListener('input', this._onInput);
      input.removeEventListener('change', this._onChange);
    }
    const toggle = this.shadowRoot.querySelector('.hbd-field__toggle');
    if (toggle) toggle.removeEventListener('click', this._onToggle);
  }

  // 3b — build aria-describedby from only the non-empty message elements.
  _describedBy(ids) {
    return ids.filter(Boolean).join(' ');
  }

  // ── Render ──────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const type = this._isPassword && this._passwordVisible ? 'text' : this._type;
    const name = this.getAttribute('name');
    const placeholder = this.getAttribute('placeholder');
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint');
    const error = this.getAttribute('error');
    const success = this.getAttribute('success');
    const required = this.hasAttribute('required');
    const disabled = this.hasAttribute('disabled');
    const readonly = this.hasAttribute('readonly');
    const maxlength = this.getAttribute('maxlength');
    const prefix = this.getAttribute('prefix');
    const suffix = this.getAttribute('suffix');

    const hasError = error != null && error !== '';
    const hasSuccess = !hasError && success != null && success !== '';
    const hasHint = hint != null && hint !== '';
    // Password toggle always occupies the suffix slot, ignoring `suffix`.
    const hasPrefix = prefix != null && prefix !== '';
    const hasSuffix = !this._isPassword && suffix != null && suffix !== '';

    const classes = ['hbd-field', `hbd-field--${this._size}`];
    if (hasError) classes.push('hbd-field--error');
    if (hasSuccess) classes.push('hbd-field--success');
    if (disabled) classes.push('hbd-field--disabled');
    if (readonly) classes.push('hbd-field--readonly');
    if (hasPrefix) classes.push('hbd-field--with-prefix');
    if (hasSuffix) classes.push('hbd-field--with-suffix');
    if (this._isPassword) classes.push('hbd-field--with-toggle');

    // aria-describedby: only IDs of elements that will actually have content.
    const describedBy = this._describedBy([
      hasHint ? `hint-${uid}` : '',
      hasError ? `error-${uid}` : '',
      hasSuccess ? `success-${uid}` : '',
      maxlength ? `count-${uid}` : '',
    ]);

    const currentLen = this._value.length;
    const atLimit = maxlength && currentLen >= parseInt(maxlength, 10);

    const prefixHtml = hasPrefix
      ? `<span class="hbd-field__prefix" aria-hidden="true">${this._esc(prefix)}</span>` : '';
    const suffixHtml = hasSuffix
      ? `<span class="hbd-field__suffix" aria-hidden="true">${this._esc(suffix)}</span>` : '';
    const toggleHtml = this._isPassword
      ? `<button type="button" class="hbd-field__toggle"
                 aria-label="${this._passwordVisible ? 'Hide password' : 'Show password'}"
                 ${disabled ? 'disabled' : ''}>${this._passwordVisible ? this._eyeOff() : this._eye()}</button>`
      : '';

    // Stylesheets are adopted in connectedCallback (see adoptStyles).
    this.shadowRoot.innerHTML = `
      <div class="${classes.join(' ')}">
        ${label ? `
        <label class="hbd-field__label" for="${uid}">
          ${this._esc(label)}${required ? `<span class="hbd-field__label-required" aria-hidden="true">*</span>` : ''}
        </label>` : ''}

        <div class="hbd-field__input-wrapper">
          ${prefixHtml}
          <input
            class="hbd-field__input"
            id="${uid}"
            type="${type}"
            ${name ? `name="${this._esc(name)}"` : ''}
            value="${this._esc(this._value)}"
            ${placeholder != null ? `placeholder="${this._esc(placeholder)}"` : ''}
            ${describedBy ? `aria-describedby="${describedBy}"` : ''}
            ${required ? 'aria-required="true" required' : ''}
            ${hasError ? 'aria-invalid="true"' : ''}
            ${disabled ? 'disabled' : ''}
            ${readonly ? 'readonly' : ''}
            ${maxlength ? `maxlength="${this._esc(maxlength)}"` : ''}
          >
          ${suffixHtml}
          ${toggleHtml}
        </div>

        ${hasHint ? `<span class="hbd-field__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
        ${hasError ? `<span class="hbd-field__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
        ${hasSuccess ? `<span class="hbd-field__success" id="success-${uid}">${this._esc(success)}</span>` : ''}
        ${maxlength ? `<span class="hbd-field__char-count${atLimit ? ' is-at-limit' : ''}" id="count-${uid}" aria-live="polite">${currentLen}/${this._esc(maxlength)}</span>` : ''}
      </div>
    `;

    // Wire listeners on the freshly-rendered nodes.
    const input = this.shadowRoot.querySelector('.hbd-field__input');
    input.addEventListener('input', this._onInput);
    input.addEventListener('change', this._onChange);
    const toggle = this.shadowRoot.querySelector('.hbd-field__toggle');
    if (toggle) toggle.addEventListener('click', this._onToggle);

    // Reflect native validity into the form (3e).
    this._syncValidity(input);
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

  // ── Events ──────────────────────────────────────────────────────────
  _onInput(e) {
    this._value = e.target.value;
    this._internals.setFormValue(this._value);
    this._syncValidity(e.target);

    // Char counter update (3c).
    const maxlength = this.getAttribute('maxlength');
    if (maxlength) {
      const count = this.shadowRoot.querySelector('.hbd-field__char-count');
      if (count) {
        count.textContent = `${this._value.length}/${maxlength}`;
        count.classList.toggle('is-at-limit', this._value.length >= parseInt(maxlength, 10));
      }
    }

    this.dispatchEvent(new CustomEvent('hbd:input', {
      detail: { value: this._value, name: this.getAttribute('name') },
      bubbles: true,
      composed: true,
    }));
  }

  _onChange(e) {
    this._value = e.target.value;
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { value: this._value, name: this.getAttribute('name') },
      bubbles: true,
      composed: true,
    }));
  }

  // 3f — toggle password visibility, preserving caret/value.
  _onToggle() {
    if (this.hasAttribute('disabled')) return;
    const input = this.shadowRoot.querySelector('.hbd-field__input');
    if (input) this._value = input.value;
    this._passwordVisible = !this._passwordVisible;
    this._render();
    const newInput = this.shadowRoot.querySelector('.hbd-field__input');
    if (newInput) {
      newInput.focus();
      const end = newInput.value.length;
      newInput.setSelectionRange(end, end);
    }
  }

  // Inline SVG eye icons (decorative; button carries the aria-label).
  _eye() {
    return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 9s3-5.5 8-5.5S17 9 17 9s-3 5.5-8 5.5S1 9 1 9Z" stroke="currentColor" stroke-width="1.3"/><circle cx="9" cy="9" r="2.25" stroke="currentColor" stroke-width="1.3"/></svg>`;
  }
  _eyeOff() {
    return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 9s3-5.5 8-5.5c1.2 0 2.3.32 3.3.82M17 9s-3 5.5-8 5.5c-1.2 0-2.3-.32-3.3-.82" stroke="currentColor" stroke-width="1.3"/><path d="M3 15 15 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
  }
}

if (!customElements.get('hbd-input')) {
  customElements.define('hbd-input', HbdInput);
}
