// ds/components/hbd-textarea.js
// Here Be Dragons DS — <hbd-textarea> custom element (CLAUDE.md §7).
//
// Multiline form field that extends the .hbd-field wrapper pattern from
// hbd-input. Adds: native <textarea>, optional auto-resize, manual vertical
// resize handle, footer row with hint/message + char-count, and tri-state
// counter (default → warning ≥80% → over ≥100%).
//
// PARALLEL TO hbd-input.js — same shadow-DOM structure, formAssociated,
// per-instance uid, dynamic aria-describedby, and value/validity sync. Web
// Components do not support clean cross-element class inheritance, so the
// shared logic is copied rather than imported.

let uidCounter = 0;

class HbdTextarea extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'name', 'value', 'placeholder', 'label', 'hint', 'error', 'success',
      'required', 'disabled', 'readonly', 'maxlength', 'rows', 'autoresize',
      'size',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-textarea-${++uidCounter}`;
    this._value = this.getAttribute('value') || '';
    this._onInput = this._onInput.bind(this);
    this._onChange = this._onChange.bind(this);
  }

  connectedCallback() {
    this._render();
    this._internals.setFormValue(this._value);
    if (this.hasAttribute('autoresize')) this._autoResize();
  }

  disconnectedCallback() {
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value') this._value = newVal || '';
    if (this.isConnected) {
      this._render();
      if (name === 'value' && this.hasAttribute('autoresize')) this._autoResize();
    }
  }

  // ── Public value reflection ─────────────────────────────────────────
  get value() { return this._value; }
  set value(v) {
    this._value = v == null ? '' : String(v);
    this.setAttribute('value', this._value);
  }

  // ── Helpers ─────────────────────────────────────────────────────────
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
    const t = this.shadowRoot.querySelector('.hbd-field__textarea');
    if (t) {
      t.removeEventListener('input', this._onInput);
      t.removeEventListener('change', this._onChange);
    }
  }

  // Build aria-describedby from only the non-empty message elements (3b).
  _describedBy(ids) {
    return ids.filter(Boolean).join(' ');
  }

  // ── Render ──────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
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
    const rows = this.getAttribute('rows') || '4';
    const autoresize = this.hasAttribute('autoresize');

    const hasError = error != null && error !== '';
    const hasSuccess = !hasError && success != null && success !== '';
    const hasHint = hint != null && hint !== '';

    const classes = ['hbd-field', `hbd-field--${this._size}`];
    if (hasError) classes.push('hbd-field--error');
    if (hasSuccess) classes.push('hbd-field--success');
    if (disabled) classes.push('hbd-field--disabled');
    if (readonly) classes.push('hbd-field--readonly');
    if (autoresize) classes.push('hbd-field--autoresize');

    const describedBy = this._describedBy([
      hasHint ? `hint-${uid}` : '',
      hasError ? `error-${uid}` : '',
      hasSuccess ? `success-${uid}` : '',
      maxlength ? `count-${uid}` : '',
    ]);

    const currentLen = this._value.length;
    const countClass = this._countClass(currentLen, maxlength);

    const hasFooter = hasHint || hasError || hasSuccess || maxlength;

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/tokens/tokens.css">
      <link rel="stylesheet" href="/ds/styles/components/input.css">
      <div class="${classes.join(' ')}">
        ${label ? `
        <label class="hbd-field__label" for="${uid}">
          ${this._esc(label)}${required ? `<span class="hbd-field__label-required" aria-hidden="true">*</span>` : ''}
        </label>` : ''}

        <div class="hbd-field__input-wrapper">
          <textarea
            class="hbd-field__textarea"
            id="${uid}"
            ${name ? `name="${this._esc(name)}"` : ''}
            ${placeholder != null ? `placeholder="${this._esc(placeholder)}"` : ''}
            rows="${this._esc(rows)}"
            ${describedBy ? `aria-describedby="${describedBy}"` : ''}
            ${required ? 'aria-required="true" required' : ''}
            ${hasError ? 'aria-invalid="true"' : ''}
            ${disabled ? 'disabled' : ''}
            ${readonly ? 'readonly' : ''}
            ${maxlength ? `maxlength="${this._esc(maxlength)}"` : ''}
          >${this._esc(this._value)}</textarea>
        </div>

        ${hasFooter ? `
        <div class="hbd-field__footer">
          ${hasHint ? `<span class="hbd-field__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
          ${hasError ? `<span class="hbd-field__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
          ${hasSuccess ? `<span class="hbd-field__success" id="success-${uid}">${this._esc(success)}</span>` : ''}
          ${maxlength ? `<span class="hbd-field__char-count${countClass}" id="count-${uid}" aria-live="polite" aria-atomic="true">${currentLen}/${this._esc(maxlength)}</span>` : ''}
        </div>` : ''}
      </div>
    `;

    // Wire listeners on the freshly-rendered nodes.
    const textarea = this.shadowRoot.querySelector('.hbd-field__textarea');
    textarea.addEventListener('input', this._onInput);
    textarea.addEventListener('change', this._onChange);

    this._syncValidity(textarea);
  }

  _countClass(len, max) {
    if (!max) return '';
    const m = parseInt(max, 10);
    if (len >= m) return ' hbd-field__char-count--over';
    if (len >= m * 0.8) return ' hbd-field__char-count--warning';
    return '';
  }

  _syncValidity(textarea) {
    if (textarea.validity.valid) {
      this._internals.setValidity({});
    } else {
      this._internals.setValidity(
        textarea.validity,
        textarea.validationMessage,
        textarea,
      );
    }
  }

  // 3c — Auto-resize. Inline style.height is the ONE permitted use of inline
  // style in this DS: auto-resize cannot be achieved with CSS alone (the
  // textarea has no intrinsic content-height in flow layout). Reset to 'auto'
  // first so scrollHeight reflects the new content rather than the old size.
  _autoResize() {
    const t = this.shadowRoot.querySelector('.hbd-field__textarea');
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${t.scrollHeight}px`;
  }

  // ── Events ──────────────────────────────────────────────────────────
  _onInput(e) {
    this._value = e.target.value;
    this._internals.setFormValue(this._value);
    this._syncValidity(e.target);

    // Char counter update (3d) — toggle warning / over classes per length.
    const maxlength = this.getAttribute('maxlength');
    if (maxlength) {
      const count = this.shadowRoot.querySelector('.hbd-field__char-count');
      if (count) {
        const m = parseInt(maxlength, 10);
        const len = this._value.length;
        count.textContent = `${len}/${maxlength}`;
        count.classList.toggle('hbd-field__char-count--over', len >= m);
        count.classList.toggle('hbd-field__char-count--warning', len >= m * 0.8 && len < m);
      }
    }

    if (this.hasAttribute('autoresize')) this._autoResize();

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
}

if (!customElements.get('hbd-textarea')) {
  customElements.define('hbd-textarea', HbdTextarea);
}
