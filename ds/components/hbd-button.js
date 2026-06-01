// ds/components/hbd-button.js
// Here Be Dragons DS — <hbd-button> custom element (CLAUDE.md §7).
// Styles via adopted stylesheets (../utils/shared-styles.js) to avoid FOUC
// on re-render when attributes like `disabled` / `loading` change.

import { adoptStyles } from '../utils/shared-styles.js';

class HbdButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading', 'type', 'icon-only', 'aria-label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._handleClick = this._handleClick.bind(this);
    this._onTooltipKeydown = this._onTooltipKeydown.bind(this);
    this._onTooltipMouseLeave = this._onTooltipMouseLeave.bind(this);
    this._onTooltipBlur = this._onTooltipBlur.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/button.css',
    ]);
    this._render();
    this._upgradeAccessibility();
    this.shadowRoot.addEventListener('click', this._handleClick);
    this._wireTooltipListeners();
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._handleClick);
    this._unwireTooltipListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      // aria-label change doesn't need a structural re-render; just propagate
      // to the inner <button> so the CSS tooltip's attr() picks it up.
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
      // Re-wire tooltip listeners on the freshly-rendered inner button.
      this._wireTooltipListeners();
    }
  }

  _render() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const type = this.getAttribute('type') || 'button';
    const isLoading = this.hasAttribute('loading');
    const isDisabled = this.hasAttribute('disabled');
    const isIconOnly = this.hasAttribute('icon-only');
    const ariaLabel = this.getAttribute('aria-label');

    const classes = ['hbd-button', `hbd-button--${variant}`, `hbd-button--${size}`];
    if (isIconOnly) classes.push('hbd-button--icon-only');
    if (isLoading) classes.push('is-loading');
    if (isDisabled) classes.push('is-disabled');

    // Icon-only: the inner button carries the aria-label so the CSS tooltip's
    // attr(aria-label) reads from the same node the user is interacting with.
    // The default slot is enough — text labels are not rendered in icon-only,
    // but the slot still lights up so SVG children show.
    const slots = isIconOnly
      ? '<slot></slot>'
      : '<slot name="icon-left"></slot><slot></slot><slot name="icon-right"></slot>';

    // Stylesheets are adopted in connectedCallback (see adoptStyles).
    this.shadowRoot.innerHTML = `
      <button
        class="${classes.join(' ')}"
        type="${type}"
        ${isDisabled ? 'disabled' : ''}
        ${isLoading ? 'aria-busy="true"' : ''}
        ${ariaLabel ? `aria-label="${this._escapeAttr(ariaLabel)}"` : ''}
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
    this.dispatchEvent(new CustomEvent('hbd:click', {
      bubbles: true,
      composed: true,
    }));
  }

  // ── Tooltip dismissal (SC 1.4.13) ─────────────────────────────────────
  // The CSS tooltip on icon-only buttons must be dismissible without
  // moving focus. Escape adds .tooltip-dismissed which forces the bubble
  // to opacity 0 even while the button is hovered/focused. The class is
  // cleared on the next blur/mouseleave so the tooltip can reappear on
  // the user's next interaction.
  _wireTooltipListeners() {
    if (!this.hasAttribute('icon-only')) return;
    const btn = this.shadowRoot.querySelector('button.hbd-button--icon-only');
    if (!btn) return;
    // Re-wire is idempotent because we use named handlers; remove first.
    btn.removeEventListener('keydown', this._onTooltipKeydown);
    btn.removeEventListener('mouseleave', this._onTooltipMouseLeave);
    btn.removeEventListener('blur', this._onTooltipBlur);
    btn.addEventListener('keydown', this._onTooltipKeydown);
    btn.addEventListener('mouseleave', this._onTooltipMouseLeave);
    btn.addEventListener('blur', this._onTooltipBlur);
  }
  _unwireTooltipListeners() {
    const btn = this.shadowRoot && this.shadowRoot.querySelector('button.hbd-button--icon-only');
    if (!btn) return;
    btn.removeEventListener('keydown', this._onTooltipKeydown);
    btn.removeEventListener('mouseleave', this._onTooltipMouseLeave);
    btn.removeEventListener('blur', this._onTooltipBlur);
  }
  _onTooltipKeydown(e) {
    if (e.key !== 'Escape') return;
    const btn = e.currentTarget;
    if (btn) btn.classList.add('tooltip-dismissed');
    // Do not preventDefault — the user may legitimately want Escape to
    // bubble further (e.g. close a parent dialog). The tooltip just hides.
  }
  _onTooltipMouseLeave(e) {
    const btn = e.currentTarget;
    if (btn) btn.classList.remove('tooltip-dismissed');
  }
  _onTooltipBlur(e) {
    const btn = e.currentTarget;
    if (btn) btn.classList.remove('tooltip-dismissed');
  }
}

if (!customElements.get('hbd-button')) {
  customElements.define('hbd-button', HbdButton);
}
