// ds/components/hbd-otp-input.js
// Here Be Dragons DS — <hbd-otp-input> custom element (CLAUDE.md §7).
//
// One-time password / verification code input: a row of single-character
// cells that auto-advance on entry, accept paste from the clipboard
// (splitting across cells), and support arrow + backspace navigation.
// 4 or 6 digit lengths; numeric or alphanumeric.
//
// Shadow DOM. Styles via adopted stylesheets (../utils/shared-styles.js).
//
// Form association: the joined string of cell values is written via
// ElementInternals.setFormValue on every change.

import { adoptStyles } from '../utils/shared-styles.js';

let uidCounter = 0;

class HbdOtpInput extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'length', 'type', 'label', 'hint', 'error', 'success',
      'disabled', 'autocomplete', 'name', 'separator', 'autofocus',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-otp-${++uidCounter}`;
    this._values = [];        // string[] — one char per cell, '' for empty
    this._ready = false;

    this._onKeydown = this._onKeydown.bind(this);
    this._onInput = this._onInput.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onPaste = this._onPaste.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/input.css',
    ]);
    this._ready = true;
    this._values = new Array(this._length).fill('');
    this._render();
    this._syncFormValue();

    if (this.hasAttribute('autofocus') && !this.hasAttribute('disabled')) {
      const first = this._cellAt(0);
      if (first) first.focus();
    }
  }

  disconnectedCallback() {
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'length') {
      const newLen = this._lengthFromAttr(newVal);
      const next = new Array(newLen).fill('');
      // Preserve overlapping cells when length changes.
      for (let i = 0; i < Math.min(this._values.length, newLen); i++) {
        next[i] = this._values[i] || '';
      }
      this._values = next;
    }
    if (this._ready && this.isConnected) {
      this._render();
      this._syncFormValue();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────
  getValue() {
    return this._values.map((v) => v || '').join('');
  }
  setValue(str) {
    const s = this._sanitize(String(str ?? ''));
    const next = new Array(this._length).fill('');
    for (let i = 0; i < Math.min(s.length, this._length); i++) next[i] = s[i];
    this._values = next;
    this._render();
    this._syncFormValue();
    this._fireChange();
    if (this._isFull()) this._fireComplete();
  }
  clear() {
    this._values = new Array(this._length).fill('');
    this._render();
    this._syncFormValue();
    this._fireChange();
    const first = this._cellAt(0);
    if (first) first.focus();
  }
  setError(message) {
    this.setAttribute('error', message == null ? '' : String(message));
  }
  clearError() {
    this.removeAttribute('error');
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  _lengthFromAttr(raw) {
    const n = parseInt(raw, 10);
    return n === 4 ? 4 : 6;
  }
  get _length() { return this._lengthFromAttr(this.getAttribute('length')); }
  get _type() {
    const t = (this.getAttribute('type') || 'numeric').toLowerCase();
    return t === 'alphanumeric' ? 'alphanumeric' : 'numeric';
  }
  get _isNumeric() { return this._type === 'numeric'; }

  _sanitize(s) {
    if (this._isNumeric) return s.replace(/\D/g, '');
    return s.replace(/[^A-Za-z0-9]/g, '');
  }
  _allowedChar(ch) {
    if (this._isNumeric) return /\d/.test(ch);
    return /[A-Za-z0-9]/.test(ch);
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  _describedBy(ids) { return ids.filter(Boolean).join(' '); }

  _cellAt(i) {
    return this.shadowRoot.querySelector(`.hbd-otp__cell[data-index="${i}"]`);
  }
  _isFull() { return this._values.every((v) => v && v.length > 0); }

  _removeListeners() {
    const cells = this.shadowRoot.querySelectorAll('.hbd-otp__cell');
    cells.forEach((c) => {
      c.removeEventListener('keydown', this._onKeydown);
      c.removeEventListener('input', this._onInput);
      c.removeEventListener('focus', this._onFocus);
      c.removeEventListener('paste', this._onPaste);
    });
  }

  _syncFormValue() {
    this._internals.setFormValue(this.getValue());
  }

  // ── Render ─────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const len = this._length;
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint');
    const error = this.getAttribute('error');
    const disabled = this.hasAttribute('disabled');
    const autoComplete = this.getAttribute('autocomplete') || '';
    const showSeparator = this.hasAttribute('separator') && len === 6;

    const hasError = error != null && error !== '';
    const hasHint = hint != null && hint !== '';

    const fieldClasses = ['hbd-field', 'hbd-otp-field'];
    if (hasError) fieldClasses.push('hbd-otp-field--error', 'hbd-field--error');
    if (disabled) fieldClasses.push('hbd-otp-field--disabled', 'hbd-field--disabled');
    if (this.hasAttribute('success') || this.hasAttribute('data-success')) {
      fieldClasses.push('hbd-otp-field--success');
    }

    const describedBy = this._describedBy([
      hasHint ? `hint-${uid}` : '',
      hasError ? `error-${uid}` : '',
    ]);

    const cellsHtml = [];
    for (let i = 0; i < len; i++) {
      const value = this._values[i] || '';
      const filled = value !== '';
      const inputMode = this._isNumeric ? 'numeric' : 'text';
      const pattern = this._isNumeric ? '[0-9]' : '[a-zA-Z0-9]';
      const ac = i === 0 ? (autoComplete || 'off') : 'off';
      const ariaLabel = `${label || 'Code'} digit ${i + 1} of ${len}`;

      cellsHtml.push(`
        <input class="hbd-otp__cell${filled ? ' is-filled' : ''}"
               id="otp-cell-${uid}-${i}"
               data-index="${i}"
               type="text"
               inputmode="${inputMode}"
               pattern="${pattern}"
               maxlength="1"
               autocomplete="${this._esc(ac)}"
               aria-label="${this._esc(ariaLabel)}"
               ${hasError ? 'aria-invalid="true"' : ''}
               value="${this._esc(value)}"
               ${disabled ? 'disabled' : ''}>
      `);

      if (showSeparator && i === 2) {
        cellsHtml.push(`<span class="hbd-otp__separator" aria-hidden="true">–</span>`);
      }
    }

    this.shadowRoot.innerHTML = `
      <div class="${fieldClasses.join(' ')}">
        ${label ? `
        <label class="hbd-field__label" id="label-${uid}" for="otp-cell-${uid}-0">
          ${this._esc(label)}
        </label>` : ''}

        <div class="hbd-otp__cells"
             role="group"
             ${label ? `aria-labelledby="label-${uid}"` : ''}
             ${describedBy ? `aria-describedby="${describedBy}"` : ''}>
          ${cellsHtml.join('')}
        </div>

        <div class="hbd-field__footer">
          ${hasHint ? `<span class="hbd-field__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
          ${hasError ? `<span class="hbd-field__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
        </div>
      </div>
    `;

    const cells = this.shadowRoot.querySelectorAll('.hbd-otp__cell');
    cells.forEach((c) => {
      c.addEventListener('keydown', this._onKeydown);
      c.addEventListener('input', this._onInput);
      c.addEventListener('focus', this._onFocus);
      c.addEventListener('paste', this._onPaste);
    });
  }

  // ── Event handlers ─────────────────────────────────────────────────
  _onFocus(e) {
    // Selecting on focus lets the user overwrite an existing character
    // with a single keystroke (the `input` handler treats the typed char
    // as a fresh value, not as appended to the existing one).
    e.target.select();
  }

  _onKeydown(e) {
    const idx = parseInt(e.target.getAttribute('data-index'), 10);
    const cell = e.target;

    switch (e.key) {
      case 'Backspace':
        if (cell.value === '') {
          // Empty cell: jump back, clear that cell's value.
          const prev = this._cellAt(idx - 1);
          if (prev) {
            e.preventDefault();
            prev.focus();
            prev.select();
            this._values[idx - 1] = '';
            prev.value = '';
            prev.classList.remove('is-filled');
            this._syncFormValue();
            this._fireChange();
          }
        }
        // If the cell has a value, let native Backspace clear it; the
        // `input` event will then update _values and class state.
        return;
      case 'ArrowLeft': {
        e.preventDefault();
        const prev = this._cellAt(idx - 1);
        if (prev) { prev.focus(); prev.select(); }
        return;
      }
      case 'ArrowRight': {
        e.preventDefault();
        const next = this._cellAt(idx + 1);
        if (next) { next.focus(); next.select(); }
        return;
      }
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault();
        return;
      case 'Home': {
        e.preventDefault();
        const first = this._cellAt(0);
        if (first) { first.focus(); first.select(); }
        return;
      }
      case 'End': {
        e.preventDefault();
        const last = this._cellAt(this._length - 1);
        if (last) { last.focus(); last.select(); }
        return;
      }
      default:
        return;
    }
  }

  _onInput(e) {
    const idx = parseInt(e.target.getAttribute('data-index'), 10);
    const cell = e.target;
    const raw = cell.value;
    const cleaned = this._sanitize(raw);

    if (!cleaned) {
      // Disallowed character or pure deletion.
      cell.value = '';
      this._values[idx] = '';
      cell.classList.remove('is-filled');
      this._syncFormValue();
      this._fireChange();
      return;
    }

    // If multiple characters landed in the cell (e.g. mobile autofill of the
    // whole code, or pasted text that bypassed the paste handler), spread
    // them across cells starting from this index.
    if (cleaned.length > 1) {
      this._distributeFromIndex(idx, cleaned);
      return;
    }

    // Single character.
    const ch = cleaned[0];
    cell.value = ch;
    this._values[idx] = ch;
    cell.classList.add('is-filled');

    this._syncFormValue();
    this._fireChange();

    if (idx < this._length - 1) {
      const next = this._cellAt(idx + 1);
      if (next) { next.focus(); next.select(); }
    } else if (this._isFull()) {
      this._fireComplete();
    }
  }

  _onPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData || {}).getData
      ? e.clipboardData.getData('text')
      : '';
    if (!text) return;
    const idx = parseInt(e.target.getAttribute('data-index'), 10);
    // Find the first empty cell (or use the focused cell if it's empty),
    // else fall back to the focused cell — that's the natural insert point.
    let startIdx = idx;
    if (this._values[idx]) {
      const firstEmpty = this._values.findIndex((v) => !v);
      startIdx = firstEmpty === -1 ? idx : firstEmpty;
    }
    this._distributeFromIndex(startIdx, text);
  }

  _distributeFromIndex(startIdx, rawText) {
    const cleaned = this._sanitize(String(rawText)).slice(0, this._length - startIdx);
    if (!cleaned) return;

    for (let i = 0; i < cleaned.length; i++) {
      const cellIdx = startIdx + i;
      const cell = this._cellAt(cellIdx);
      if (!cell) break;
      const ch = cleaned[i];
      this._values[cellIdx] = ch;
      cell.value = ch;
      cell.classList.add('is-filled');
    }

    this._syncFormValue();
    this._fireChange();

    // Focus the first remaining empty cell, or the last cell when full.
    const nextEmpty = this._values.findIndex((v) => !v);
    const focusIdx = nextEmpty === -1 ? this._length - 1 : nextEmpty;
    const target = this._cellAt(focusIdx);
    if (target) { target.focus(); target.select(); }

    if (this._isFull()) this._fireComplete();
  }

  // ── Events ─────────────────────────────────────────────────────────
  _fireChange() {
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { value: this.getValue() },
      bubbles: true,
      composed: true,
    }));
  }
  _fireComplete() {
    this.dispatchEvent(new CustomEvent('hbd:complete', {
      detail: { value: this.getValue() },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('hbd-otp-input')) {
  customElements.define('hbd-otp-input', HbdOtpInput);
}
