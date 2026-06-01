// ds/components/hbd-button.js
// Here Be Dragons DS — <hbd-button> custom element (CLAUDE.md §7).
// Styles via adopted stylesheets (../utils/shared-styles.js) to avoid FOUC
// on re-render when attributes like `disabled` / `loading` change.

import { adoptStyles } from '../utils/shared-styles.js';

class HbdButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading', 'type'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._handleClick = this._handleClick.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/button.css',
    ]);
    this._render();
    this._upgradeAccessibility();
    this.shadowRoot.addEventListener('click', this._handleClick);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._handleClick);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      this._render();
      this._upgradeAccessibility();
    }
  }

  _render() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const type = this.getAttribute('type') || 'button';
    const isLoading = this.hasAttribute('loading');
    const isDisabled = this.hasAttribute('disabled');

    const classes = ['hbd-button', `hbd-button--${variant}`, `hbd-button--${size}`];
    if (isLoading) classes.push('is-loading');
    if (isDisabled) classes.push('is-disabled');

    // Stylesheets are adopted in connectedCallback (see adoptStyles).
    this.shadowRoot.innerHTML = `
      <button
        class="${classes.join(' ')}"
        type="${type}"
        ${isDisabled ? 'disabled' : ''}
        ${isLoading ? 'aria-busy="true"' : ''}
      >
        <slot name="icon-left"></slot>
        <slot></slot>
        <slot name="icon-right"></slot>
      </button>
    `;
  }

  _upgradeAccessibility() {
    const variant = this.getAttribute('variant') || 'primary';
    const isLoading = this.hasAttribute('loading');
    const isDisabled = this.hasAttribute('disabled');

    const hasName =
      (this.textContent && this.textContent.trim().length > 0) ||
      this.hasAttribute('aria-label') ||
      this.hasAttribute('aria-labelledby');

    // Icon-only buttons must carry an accessible name.
    if (variant === 'icon-only' && !hasName) {
      console.warn('hbd-button: icon-only button has no accessible name. Add aria-label.', this);
    }

    // Loading without an explicit name → announce "Loading".
    if (isLoading && !hasName) {
      this.setAttribute('aria-label', 'Loading');
    }

    // Reflect disabled to the host for assistive tech.
    if (isDisabled) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }
  }

  // Keyboard: the inner native <button> handles Enter/Space activation —
  // no custom key handling is required.
  _handleClick(e) {
    if (this.hasAttribute('disabled') || this.hasAttribute('loading')) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    this.dispatchEvent(new CustomEvent('hbd:click', {
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('hbd-button')) {
  customElements.define('hbd-button', HbdButton);
}
