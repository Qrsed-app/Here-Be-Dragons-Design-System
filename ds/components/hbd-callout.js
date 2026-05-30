// ds/components/hbd-callout.js
// Here Be Dragons DS — <hbd-callout> custom element (CLAUDE.md §7).
// Styles via adopted stylesheets (../utils/shared-styles.js) — no FOUC on
// re-render when attributes change.

import { adoptStyles } from '../utils/shared-styles.js';

let hbdCalloutUid = 0;

const DEFAULT_ICON = {
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
  success: '✓',
  'sage-advice': 'ℹ',
};

// info/success/sage-advice are non-urgent (note); error is assertive (alert);
// warning is polite (status).
const VARIANT_ROLE = {
  info: 'note',
  success: 'note',
  'sage-advice': 'note',
  warning: 'status',
  error: 'alert',
};

class HbdCallout extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'title', 'dismissible'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._uid = ++hbdCalloutUid;
    this._handleDismissClick = this._handleDismissClick.bind(this);
    this._handleTransitionEnd = this._handleTransitionEnd.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/callout.css',
    ]);
    this._render();
    this.shadowRoot.addEventListener('click', this._handleDismissClick);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._handleDismissClick);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) this._render();
  }

  _render() {
    const variant = this.getAttribute('variant') || 'info';
    const title = this.getAttribute('title');
    const dismissible = this.hasAttribute('dismissible');
    const role = VARIANT_ROLE[variant] || 'note';
    const titleId = `callout-title-${this._uid}`;

    const classes = ['hbd-callout', `hbd-callout--${variant}`];
    if (dismissible) classes.push('hbd-callout--dismissible');

    const dismissBtn = dismissible
      ? `<button class="hbd-callout__dismiss" type="button" aria-label="Dismiss ${variant} message">✕</button>`
      : '';

    // Stylesheets are adopted in connectedCallback (see adoptStyles).
    this.shadowRoot.innerHTML = `
      <div
        class="${classes.join(' ')}"
        role="${role}"
        ${title ? `aria-labelledby="${titleId}"` : ''}
      >
        <span class="hbd-callout__icon" aria-hidden="true">
          <slot name="icon">${DEFAULT_ICON[variant] || DEFAULT_ICON.info}</slot>
        </span>
        <div class="hbd-callout__body">
          ${title ? `<div class="hbd-callout__title" id="${titleId}">${title}</div>` : ''}
          <div class="hbd-callout__content"><slot></slot></div>
        </div>
        ${dismissBtn}
      </div>
    `;
  }

  _handleDismissClick(e) {
    const btn = e.target.closest('.hbd-callout__dismiss');
    if (!btn) return;
    const wrapper = this.shadowRoot.querySelector('.hbd-callout');
    if (!wrapper) return;
    wrapper.addEventListener('transitionend', this._handleTransitionEnd, { once: true });
    wrapper.classList.add('is-dismissed');
  }

  _handleTransitionEnd() {
    this.dispatchEvent(new CustomEvent('hbd:dismiss', {
      bubbles: true,
      composed: true,
      detail: { variant: this.getAttribute('variant') || 'info' },
    }));
    this.remove();
  }
}

if (!customElements.get('hbd-callout')) {
  customElements.define('hbd-callout', HbdCallout);
}
