// ds/components/hbd-switch.js
// Here Be Dragons DS — <hbd-switch> custom element (CLAUDE.md §7).
//
// A binary on/off control whose change SHOULD take effect immediately —
// unlike <hbd-checkbox> which represents a form value that's submitted
// later. The component itself does not enforce the immediate-effect
// behaviour; that's the consuming application's responsibility. Listen
// to the `hbd:change` event (or the standard `change` event on the host)
// to act on the new state.
//
// Mirrors the checkbox/radio pattern: a native <input type="checkbox">
// with role="switch" carries focus + form value, hidden via the clip
// technique; visible track + thumb are pure presentation. The role
// override on the native input is the canonical accessible pattern —
// keeps native keyboard activation (Space toggles) and form submission
// while announcing as a switch to AT.
//
// No indeterminate state — a switch is strictly on or off.
//
// Styles: adopted stylesheets (../utils/shared-styles.js) — no <link>
// tags, no FOUC on re-render.

import { adoptStyles } from '../utils/shared-styles.js';

let uidCounter = 0;

class HbdSwitch extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'checked', 'disabled', 'label', 'hint', 'error',
      'name', 'value', 'size', 'label-position',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-switch-${++uidCounter}`;
    this._handleChange = this._handleChange.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/checkbox.css',   // shared label/hint selectors
      '/ds/styles/components/input.css',
    ]);
    this._render();
    this._input = this.shadowRoot.querySelector('input');
    this._label = this.shadowRoot.querySelector('.hbd-switch');
    this._input.addEventListener('change', this._handleChange);
    this._sync();
    this._warnIfUnnamed();
  }

  disconnectedCallback() {
    if (this._input) this._input.removeEventListener('change', this._handleChange);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.shadowRoot.querySelector('input')) return;
    // Re-entrancy guard: _handleChange below toggles the `checked`
    // attribute, which would fire us back here and cause a full re-render
    // mid-click (destroying focus + interrupting the thumb-slide). Skip
    // the render if the input already matches — the visual sync was done
    // by _handleChange directly.
    if (this._internalUpdate) return;
    this._render();
    this._input = this.shadowRoot.querySelector('input');
    this._label = this.shadowRoot.querySelector('.hbd-switch');
    this._input.addEventListener('change', this._handleChange);
    this._sync();
  }

  // ── Public reflection ───────────────────────────────────────────────
  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { this.toggleAttribute('checked', !!v); }

  // ── Helpers ─────────────────────────────────────────────────────────
  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _size() {
    const s = this.getAttribute('size') || 'md';
    return ['sm', 'md', 'lg'].includes(s) ? s : 'md';
  }

  _labelPosition() {
    return this.getAttribute('label-position') === 'left' ? 'left' : 'right';
  }

  _warnIfUnnamed() {
    const hasLabel = !!(this.getAttribute('label') || '').trim();
    const hasAriaLabel = !!(this.getAttribute('aria-label') || '').trim();
    if (!hasLabel && !hasAriaLabel) {
      console.warn(
        'hbd-switch: missing accessible name. Provide a `label` attribute ' +
        'for a visible label, or `aria-label` if the switch is visually ' +
        'self-explanatory.',
        this,
      );
    }
  }

  _render() {
    const uid = this._uid;
    const checked = this.hasAttribute('checked');
    const disabled = this.hasAttribute('disabled');
    const name = this.getAttribute('name');
    const value = this.getAttribute('value') || 'on';
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint') || '';
    const error = this.getAttribute('error') || '';
    const hasError = error !== '';
    const size = this._size();
    const labelPos = this._labelPosition();
    const ariaLabel = this.getAttribute('aria-label');

    const classes = ['hbd-switch', `hbd-switch--${size}`];
    if (labelPos === 'left') classes.push('hbd-switch--label-left');
    if (checked) classes.push('hbd-switch--checked');
    if (disabled) classes.push('hbd-switch--disabled');
    if (hasError) classes.push('hbd-switch--error', 'hbd-field--error');

    const hasVisibleLabel = !!label;
    const hintId = `hint-${uid}`;
    const errorId = `error-${uid}`;
    const describedBy = [hint ? hintId : '', hasError ? errorId : '']
      .filter(Boolean).join(' ');

    // Stylesheets are adopted in connectedCallback (see adoptStyles).
    this.shadowRoot.innerHTML = `
      <label class="${classes.join(' ')}">
        <input
          class="hbd-switch__input"
          type="checkbox"
          role="switch"
          ${name ? `name="${this._esc(name)}"` : ''}
          value="${this._esc(value)}"
          aria-checked="${checked ? 'true' : 'false'}"
          ${(!hasVisibleLabel && ariaLabel) ? `aria-label="${this._esc(ariaLabel)}"` : ''}
          ${describedBy ? `aria-describedby="${describedBy}"` : ''}
          ${hasError ? 'aria-invalid="true"' : ''}
          ${checked ? 'checked' : ''}
          ${disabled ? 'disabled' : ''}>
        <span class="hbd-switch__track" aria-hidden="true">
          <span class="hbd-switch__thumb"></span>
        </span>
        ${hasVisibleLabel ? `
        <span class="hbd-switch__label-text">
          <span class="hbd-switch__label">${this._esc(label)}</span>
          ${hint ? `<span class="hbd-switch__hint" id="${hintId}">${this._esc(hint)}</span>` : ''}
        </span>` : ''}
      </label>
      ${hasError ? `<span class="hbd-switch__error hbd-field__error" id="${errorId}" role="alert">${this._esc(error)}</span>` : ''}
    `;
  }

  // Push the current checked state to the form + ARIA. Used after both
  // initial render and after user-driven change events.
  _sync() {
    this._internals.setFormValue(
      this._input.checked ? (this.getAttribute('value') || 'on') : null,
    );
    this._input.setAttribute('aria-checked', this._input.checked ? 'true' : 'false');
    this._label.classList.toggle('hbd-switch--checked', this._input.checked);
  }

  // Native change handler — mutates the visible state in place (no full
  // re-render) so focus stays put and the thumb-slide transition is
  // not interrupted by a DOM rebuild. The _internalUpdate flag prevents
  // the re-entrant attributeChangedCallback below from triggering a
  // render in response to our own toggleAttribute('checked', …).
  _handleChange() {
    this._internalUpdate = true;
    try {
      this.toggleAttribute('checked', this._input.checked);
    } finally {
      this._internalUpdate = false;
    }
    this._sync();
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: {
        checked: this._input.checked,
        value: this.getAttribute('value') || 'on',
      },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('hbd-switch')) {
  customElements.define('hbd-switch', HbdSwitch);
}
