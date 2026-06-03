// ds/components/hbd-button.js
// Here Be Dragons DS — <hbd-button> custom element (CLAUDE.md §7).
// Styles via adopted stylesheets (../utils/shared-styles.js) to avoid FOUC
// on re-render when attributes like `disabled` / `loading` change.

import { adoptStyles } from '../utils/shared-styles.js';

class HbdButton extends HTMLElement {
  static get observedAttributes() {
    return [
      'variant', 'size', 'disabled', 'loading', 'type',
      'icon-only', 'aria-label', 'toggle', 'pressed',
      'aria-checked',
    ];
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
      // aria-label change doesn't need a structural re-render; just
      // propagate to the inner <button> so the accessible name stays
      // in sync. (The previous CSS-tooltip attr() consumer was
      // removed when hbd-tooltip superseded it.)
      if (name === 'aria-label') {
        const innerBtn = this.shadowRoot && this.shadowRoot.querySelector('button');
        if (innerBtn) {
          if (newVal == null) innerBtn.removeAttribute('aria-label');
          else innerBtn.setAttribute('aria-label', newVal);
        }
        this._upgradeAccessibility();
        return;
      }
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
    const isIconOnly = this.hasAttribute('icon-only');
    const isToggle = this.hasAttribute('toggle');
    const isPressed = this.hasAttribute('pressed');
    const ariaLabel = this.getAttribute('aria-label');
    // When the host carries `aria-checked` (the toggle group sets this in
    // single-select mode to enable the radiogroup pattern), emit aria-checked
    // instead of aria-pressed. The two are semantically distinct: pressed =
    // independent on/off, checked = one-of-N selection. See toggle-group's
    // role-decision comment for the full rationale.
    const useChecked = this.hasAttribute('aria-checked');

    const classes = ['hbd-button', `hbd-button--${variant}`, `hbd-button--${size}`];
    if (isIconOnly) classes.push('hbd-button--icon-only');
    if (isLoading) classes.push('is-loading');
    if (isDisabled) classes.push('is-disabled');
    if (isToggle && isPressed) classes.push('hbd-button--pressed');

    const slots = isIconOnly
      ? '<slot></slot>'
      : '<slot name="icon-left"></slot><slot></slot><slot name="icon-right"></slot>';

    let toggleAttr = '';
    if (isToggle) {
      if (useChecked) {
        toggleAttr = `role="radio" aria-checked="${isPressed ? 'true' : 'false'}"`;
      } else {
        toggleAttr = `aria-pressed="${isPressed ? 'true' : 'false'}"`;
      }
    }

    this.shadowRoot.innerHTML = `
      <button
        class="${classes.join(' ')}"
        type="${type}"
        ${isDisabled ? 'disabled' : ''}
        ${isLoading ? 'aria-busy="true"' : ''}
        ${ariaLabel ? `aria-label="${this._escapeAttr(ariaLabel)}"` : ''}
        ${toggleAttr}
      >
        ${slots}
      </button>
    `;
  }

  _escapeAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  _upgradeAccessibility() {
    const isIconOnly = this.hasAttribute('icon-only')
      || this.getAttribute('variant') === 'icon-only';
    const isLoading = this.hasAttribute('loading');
    const isDisabled = this.hasAttribute('disabled');

    const hasName =
      (this.textContent && this.textContent.trim().length > 0) ||
      this.hasAttribute('aria-label') ||
      this.hasAttribute('aria-labelledby');

    // Icon-only buttons must carry an accessible name.
    if (isIconOnly && !hasName) {
      console.warn(
        '[hbd-button] icon-only buttons require an aria-label.',
        this,
      );
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
    // Toggle behaviour: flip the pressed attribute on activation. The
    // attribute change triggers attributeChangedCallback → _render, which
    // updates the inner button's aria-pressed / aria-checked. The
    // hbd:toggle event lets a parent <hbd-toggle-group> coordinate
    // mutual exclusion in single mode.
    if (this.hasAttribute('toggle')) {
      this.toggleAttribute('pressed');
      this.dispatchEvent(new CustomEvent('hbd:toggle', {
        detail: {
          pressed: this.hasAttribute('pressed'),
          value: this.getAttribute('value'),
        },
        bubbles: true,
        composed: true,
      }));
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
