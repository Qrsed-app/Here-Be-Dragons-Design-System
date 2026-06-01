// ds/components/hbd-split-button.js
// Here Be Dragons DS — <hbd-split-button> custom element (CLAUDE.md §7).
//
// Two <hbd-button> elements joined visually: a wide PRIMARY ACTION on the
// left and a narrow CHEVRON TRIGGER on the right. Clicking the action
// dispatches hbd:action; clicking the chevron opens a dropdown menu of
// alternative actions read from <hbd-option> children. Selecting a menu
// item dispatches hbd:select and closes the panel.
//
// Shadow DOM. Styles via adopted stylesheets (../utils/shared-styles.js).
// The inner <hbd-button> elements are nested custom elements — they self-
// register and have their own shadow roots. hbd-button.js MUST appear
// before this file in ds/index.js (alphabetical order ensures it).

import { adoptStyles } from '../utils/shared-styles.js';

// Ensure the companion <hbd-option> exists (already defined by hbd-select
// and hbd-combobox, but guard for cases where this file is imported alone).
if (!customElements.get('hbd-option')) {
  class HbdOption extends HTMLElement {
    static get observedAttributes() { return ['value', 'disabled', 'selected']; }
  }
  customElements.define('hbd-option', HbdOption);
}

let uidCounter = 0;

class HbdSplitButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._uid = `hbd-split-button-${++uidCounter}`;
    this._isOpen = false;
    this._focusedItemIndex = -1;
    this._options = [];
    this._ready = false;
    this._mo = null;

    this._onActionClick = this._onActionClick.bind(this);
    this._onTriggerClick = this._onTriggerClick.bind(this);
    this._onPanelClick = this._onPanelClick.bind(this);
    this._onPanelKeydown = this._onPanelKeydown.bind(this);
    this._onDocPointer = this._onDocPointer.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/button.css',
      '/ds/styles/components/input.css',     // for .hbd-field__option styles
    ]);
    this._readOptions();
    this._ready = true;
    this._render();

    // Watch for added/removed <hbd-option> children.
    this._mo = new MutationObserver((muts) => {
      const childChanged = muts.some((m) => m.target !== this);
      if (!childChanged) return;
      this._readOptions();
      this._renderPanelOnly();
    });
    this._mo.observe(this, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['value', 'disabled'],
    });
  }

  disconnectedCallback() {
    if (this._mo) { this._mo.disconnect(); this._mo = null; }
    this._removeDocListeners();
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (this._ready && this.isConnected) this._render();
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _readOptions() {
    this._options = Array.from(this.querySelectorAll('hbd-option')).map((el, i) => ({
      value: el.getAttribute('value') || el.textContent.trim(),
      label: (el.getAttribute('label') || el.textContent.trim()),
      disabled: el.hasAttribute('disabled'),
      index: i,
    }));
  }

  _firstEnabledIndex() {
    return this._options.findIndex((o) => !o.disabled);
  }
  _lastEnabledIndex() {
    for (let i = this._options.length - 1; i >= 0; i--) {
      if (!this._options[i].disabled) return i;
    }
    return -1;
  }
  _nextEnabled(from, dir) {
    const n = this._options.length;
    if (n === 0) return -1;
    let i = from;
    for (let s = 0; s < n; s++) {
      i = (i + dir + n) % n;
      if (!this._options[i].disabled) return i;
    }
    return -1;
  }

  _removeListeners() {
    const action = this.shadowRoot.querySelector('.hbd-split-button__action');
    const trigger = this.shadowRoot.querySelector('.hbd-split-button__trigger');
    const panel = this.shadowRoot.querySelector('.hbd-split-button__panel');
    if (action) action.removeEventListener('click', this._onActionClick);
    if (trigger) trigger.removeEventListener('click', this._onTriggerClick);
    if (panel) {
      panel.removeEventListener('click', this._onPanelClick);
      panel.removeEventListener('keydown', this._onPanelKeydown);
    }
  }
  _addDocListeners() {
    document.addEventListener('pointerdown', this._onDocPointer, true);
  }
  _removeDocListeners() {
    document.removeEventListener('pointerdown', this._onDocPointer, true);
  }

  // ── Render ─────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const disabled = this.hasAttribute('disabled');
    const label = this.getAttribute('label') || '';

    const wrapperClasses = ['hbd-split-button', `hbd-split-button--variant-${variant}`];
    if (this._isOpen) wrapperClasses.push('hbd-split-button--open');
    if (disabled) wrapperClasses.push('hbd-split-button--disabled');

    this.shadowRoot.innerHTML = `
      <div class="${wrapperClasses.join(' ')}">

        <hbd-button class="hbd-split-button__action"
                    variant="${this._esc(variant)}"
                    size="${this._esc(size)}"
                    ${disabled ? 'disabled' : ''}>
          ${this._esc(label)}
        </hbd-button>

        <hbd-button class="hbd-split-button__trigger"
                    variant="${this._esc(variant)}"
                    size="${this._esc(size)}"
                    aria-haspopup="menu"
                    aria-expanded="${this._isOpen ? 'true' : 'false'}"
                    aria-label="More ${this._esc(label || 'options')} options"
                    aria-controls="panel-${uid}"
                    ${disabled ? 'disabled' : ''}>
          <span class="hbd-split-button__chevron" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </hbd-button>

        <ul class="hbd-split-button__panel"
            id="panel-${uid}"
            role="menu"
            aria-label="${this._esc(label || 'Options')} options"
            tabindex="-1">
          ${this._renderItems()}
        </ul>
      </div>
    `;

    this._wireListeners();
  }

  // Re-render only the panel <ul> contents (used on option mutations so
  // we don't churn the buttons or drop their focus state).
  _renderPanelOnly() {
    const panel = this.shadowRoot.querySelector('.hbd-split-button__panel');
    if (!panel) return;
    panel.innerHTML = this._renderItems();
  }

  _renderItems() {
    const uid = this._uid;
    return this._options.map((o, i) => {
      const isFocused = i === this._focusedItemIndex;
      const cls = [
        'hbd-field__option',
        o.disabled ? 'is-disabled' : '',
        isFocused ? 'is-focused' : '',
      ].filter(Boolean).join(' ');
      return `
        <li class="${cls}"
            role="menuitem"
            id="item-${uid}-${i}"
            tabindex="${isFocused ? '0' : '-1'}"
            data-index="${i}"
            data-value="${this._esc(o.value)}"
            ${o.disabled ? 'aria-disabled="true"' : ''}>
          <span>${this._esc(o.label)}</span>
        </li>`;
    }).join('');
  }

  _wireListeners() {
    const action = this.shadowRoot.querySelector('.hbd-split-button__action');
    const trigger = this.shadowRoot.querySelector('.hbd-split-button__trigger');
    const panel = this.shadowRoot.querySelector('.hbd-split-button__panel');
    if (action) action.addEventListener('click', this._onActionClick);
    if (trigger) trigger.addEventListener('click', this._onTriggerClick);
    if (panel) {
      panel.addEventListener('click', this._onPanelClick);
      panel.addEventListener('keydown', this._onPanelKeydown);
    }
  }

  // ── Open / close ───────────────────────────────────────────────────
  _setOpenClass(isOpen) {
    const wrap = this.shadowRoot.querySelector('.hbd-split-button');
    if (!wrap) return;
    wrap.classList.toggle('hbd-split-button--open', isOpen);
    const trigger = this.shadowRoot.querySelector('.hbd-split-button__trigger');
    if (trigger) trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  _openPanel() {
    if (this._isOpen || this.hasAttribute('disabled')) return;
    this._isOpen = true;
    this._focusedItemIndex = this._firstEnabledIndex();
    this._setOpenClass(true);
    this._addDocListeners();
    this._refreshItemFocus();
    this.dispatchEvent(new CustomEvent('hbd:open', { bubbles: true, composed: true }));
  }

  _closePanel(returnFocus = true) {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._focusedItemIndex = -1;
    this._removeDocListeners();
    this._setOpenClass(false);
    if (returnFocus) {
      const trigger = this.shadowRoot.querySelector('.hbd-split-button__trigger');
      if (trigger && typeof trigger.focus === 'function') {
        // The inner button is the actual focus target.
        const inner = trigger.shadowRoot && trigger.shadowRoot.querySelector('button');
        if (inner) inner.focus({ preventScroll: true });
      }
    }
    this.dispatchEvent(new CustomEvent('hbd:close', { bubbles: true, composed: true }));
  }

  _refreshItemFocus() {
    const panel = this.shadowRoot.querySelector('.hbd-split-button__panel');
    if (!panel) return;
    const items = panel.querySelectorAll('.hbd-field__option');
    items.forEach((el) => {
      const i = parseInt(el.getAttribute('data-index'), 10);
      const isFocused = i === this._focusedItemIndex;
      el.classList.toggle('is-focused', isFocused);
      el.setAttribute('tabindex', isFocused ? '0' : '-1');
      if (isFocused) {
        el.focus({ preventScroll: false });
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  // ── Events ─────────────────────────────────────────────────────────
  _onActionClick(e) {
    e.stopPropagation();
    if (this.hasAttribute('disabled')) return;
    this.dispatchEvent(new CustomEvent('hbd:action', {
      detail: { label: this.getAttribute('label') || '' },
      bubbles: true,
      composed: true,
    }));
  }

  _onTriggerClick(e) {
    e.stopPropagation();
    if (this.hasAttribute('disabled')) return;
    if (this._isOpen) this._closePanel(true);
    else this._openPanel();
  }

  _onPanelClick(e) {
    const item = e.target.closest('.hbd-field__option');
    if (!item) return;
    if (item.classList.contains('is-disabled')) return;
    e.stopPropagation();
    this._selectByIndex(parseInt(item.getAttribute('data-index'), 10));
  }

  _onPanelKeydown(e) {
    const k = e.key;
    switch (k) {
      case 'Escape':
        e.preventDefault();
        this._closePanel(true);
        return;
      case 'Tab':
        // Let Tab move focus naturally; just close the panel.
        this._closePanel(false);
        return;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        if (this._focusedItemIndex >= 0) this._selectByIndex(this._focusedItemIndex);
        return;
      case 'ArrowDown':
        e.preventDefault();
        this._moveFocus(1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        this._moveFocus(-1);
        return;
      case 'Home':
        e.preventDefault();
        this._focusedItemIndex = this._firstEnabledIndex();
        this._refreshItemFocus();
        return;
      case 'End':
        e.preventDefault();
        this._focusedItemIndex = this._lastEnabledIndex();
        this._refreshItemFocus();
        return;
      default:
        return;
    }
  }

  _moveFocus(dir) {
    const from = this._focusedItemIndex >= 0 ? this._focusedItemIndex : -1;
    const next = this._nextEnabled(from, dir);
    if (next < 0) return;
    this._focusedItemIndex = next;
    this._refreshItemFocus();
  }

  _onDocPointer(e) {
    if (!e.composedPath().includes(this)) this._closePanel(false);
  }

  // ── Selection ──────────────────────────────────────────────────────
  _selectByIndex(i) {
    const o = this._options[i];
    if (!o || o.disabled) return;
    this.dispatchEvent(new CustomEvent('hbd:select', {
      detail: { value: o.value, label: o.label },
      bubbles: true,
      composed: true,
    }));
    this._closePanel(true);
  }
}

if (!customElements.get('hbd-split-button')) {
  customElements.define('hbd-split-button', HbdSplitButton);
}
