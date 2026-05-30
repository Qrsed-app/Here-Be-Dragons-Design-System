// ds/components/hbd-codeblock.js
// Here Be Dragons DS — <hbd-codeblock> custom element (CLAUDE.md §7).
// Display-only: dark code surface, optional filename/language header,
// optional line numbers, and a copy-to-clipboard button. Styles via adopted
// stylesheets (../utils/shared-styles.js) — no FOUC on re-render.

import { adoptStyles } from '../utils/shared-styles.js';

class HbdCodeblock extends HTMLElement {
  static get observedAttributes() {
    return ['language', 'filename', 'show-lines', 'no-copy'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._handleCopy = this._handleCopy.bind(this);
    this._copyTimer = null;
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/codeblock.css',
    ]);
    this._render();
    this._wireUp();
  }

  disconnectedCallback() {
    const btn = this.shadowRoot.querySelector('.hbd-codeblock__copy');
    if (btn) btn.removeEventListener('click', this._handleCopy);
    if (this._copyTimer) clearTimeout(this._copyTimer);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && this.isConnected) {
      this._render();
      this._wireUp();
    }
  }

  _slottedText() {
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    if (!slot) return this.textContent || '';
    return slot.assignedNodes().map((n) => n.textContent).join('');
  }

  _render() {
    const language = this.getAttribute('language');
    const filename = this.getAttribute('filename');
    const showLines = this.hasAttribute('show-lines');
    const noCopy = this.hasAttribute('no-copy');
    const hasHeader = !!(filename || language);

    const classes = ['hbd-codeblock'];
    if (hasHeader) classes.push('hbd-codeblock--with-header');
    if (showLines) classes.push('hbd-codeblock--with-lines');

    // Line numbers: count lines in the host's text content.
    let gutter = '';
    if (showLines) {
      const text = (this.textContent || '').replace(/\n$/, '');
      const count = text.split('\n').length;
      let spans = '';
      for (let i = 1; i <= count; i++) spans += `<span>${i}</span>`;
      gutter = `<div class="hbd-codeblock__line-numbers" aria-hidden="true">${spans}</div>`;
    }

    const header = hasHeader
      ? `<div class="hbd-codeblock__header">
           <span class="hbd-codeblock__filename">${filename || ''}</span>
           <span class="hbd-codeblock__language">${language || ''}</span>
         </div>`
      : '';

    const copyBtn = noCopy
      ? ''
      : `<button class="hbd-codeblock__copy" type="button" aria-label="Copy code">Copy</button>`;

    // role=region only when the block is a labelled landmark (has a header).
    const regionAttrs = hasHeader ? ' role="region" aria-label="Code block"' : '';

    // Stylesheets are adopted in connectedCallback (see adoptStyles).
    this.shadowRoot.innerHTML = `
      <div class="${classes.join(' ')}"${regionAttrs}>
        ${header}
        <div class="hbd-codeblock__body">
          ${gutter}
          <pre class="hbd-codeblock__pre"><code class="hbd-codeblock__code"><slot></slot></code></pre>
          ${copyBtn}
        </div>
      </div>
    `;
  }

  _wireUp() {
    const btn = this.shadowRoot.querySelector('.hbd-codeblock__copy');
    if (btn) btn.addEventListener('click', this._handleCopy);
  }

  _handleCopy() {
    const btn = this.shadowRoot.querySelector('.hbd-codeblock__copy');
    if (!btn) return;
    const text = this._slottedText();
    const reset = () => {
      btn.textContent = 'Copy';
      btn.classList.remove('is-copied');
      btn.setAttribute('aria-label', 'Copy code');
    };
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied';
      btn.classList.add('is-copied');
      btn.setAttribute('aria-label', 'Copied to clipboard');
      if (this._copyTimer) clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(reset, 2000);
    }).catch(() => {
      btn.textContent = 'Failed';
      btn.setAttribute('aria-label', 'Copy failed');
      if (this._copyTimer) clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(reset, 2000);
    });
  }
}

if (!customElements.get('hbd-codeblock')) {
  customElements.define('hbd-codeblock', HbdCodeblock);
}
