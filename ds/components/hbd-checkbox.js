// ds/components/hbd-checkbox.js
// Here Be Dragons DS — <hbd-checkbox> custom element (CLAUDE.md §7).
// Wraps a native <input type="checkbox"> in Shadow DOM for full a11y,
// keyboard, and form-association support — no role="checkbox" emulation.
// Styles via adopted stylesheets (../utils/shared-styles.js) — no FOUC on
// re-render when attributes change.

import { adoptStyles } from '../utils/shared-styles.js';

class HbdCheckbox extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['name', 'value', 'checked', 'indeterminate', 'disabled', 'required', 'error'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._handleChange = this._handleChange.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/checkbox.css',
    ]);
    this._render();
    this._input = this.shadowRoot.querySelector('input');
    this._label = this.shadowRoot.querySelector('.hbd-checkbox');
    this._input.addEventListener('change', this._handleChange);
    this._sync();
  }

  disconnectedCallback() {
    if (this._input) this._input.removeEventListener('change', this._handleChange);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.shadowRoot.querySelector('input')) return;
    this._render();
    this._input = this.shadowRoot.querySelector('input');
    this._label = this.shadowRoot.querySelector('.hbd-checkbox');
    this._input.addEventListener('change', this._handleChange);
    this._sync();
  }

  _render() {
    const name = this.getAttribute('name');
    const value = this.getAttribute('value');
    const checked = this.hasAttribute('checked');
    const indeterminate = this.hasAttribute('indeterminate');
    const disabled = this.hasAttribute('disabled');
    const required = this.hasAttribute('required');
    const error = this.getAttribute('error');

    const classes = ['hbd-checkbox'];
    if (checked) classes.push('hbd-checkbox--checked');
    if (indeterminate) classes.push('hbd-checkbox--indeterminate');
    if (disabled) classes.push('hbd-checkbox--disabled');
    if (error) classes.push('hbd-checkbox--error');

    // Stylesheets are adopted in connectedCallback (see adoptStyles).
    this.shadowRoot.innerHTML = `
      <label class="${classes.join(' ')}">
        <input
          class="hbd-checkbox__input"
          type="checkbox"
          ${name ? `name="${name}"` : ''}
          ${value ? `value="${value}"` : ''}
          ${checked ? 'checked' : ''}
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
        >
        <span class="hbd-checkbox__control" aria-hidden="true"></span>
        <span class="hbd-checkbox__label"><slot></slot></span>
      </label>
      <span class="hbd-checkbox__hint"><slot name="hint"></slot></span>
      <span class="hbd-checkbox__error" role="alert" aria-live="polite">${error || ''}</span>
    `;
  }

  // indeterminate cannot be set via HTML; apply the JS property + wrapper class.
  _sync() {
    const indeterminate = this.hasAttribute('indeterminate');
    this._input.indeterminate = indeterminate;
    this._label.classList.toggle('hbd-checkbox--indeterminate', indeterminate);
    this._label.classList.toggle('hbd-checkbox--checked', this._input.checked);
    this._internals.setFormValue(
      this._input.checked ? (this.getAttribute('value') || 'on') : null
    );
  }

  _handleChange() {
    // A real toggle clears any indeterminate state.
    if (this.hasAttribute('indeterminate')) this.removeAttribute('indeterminate');
    this._input.indeterminate = false;
    this.toggleAttribute('checked', this._input.checked);
    this._label.classList.toggle('hbd-checkbox--checked', this._input.checked);
    this._label.classList.remove('hbd-checkbox--indeterminate');
    this._internals.setFormValue(
      this._input.checked ? (this.getAttribute('value') || 'on') : null
    );
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { checked: this._input.checked, value: this.getAttribute('value') },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('hbd-checkbox')) {
  customElements.define('hbd-checkbox', HbdCheckbox);
}
