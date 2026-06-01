// ds/components/hbd-combobox.js
// Here Be Dragons DS — <hbd-combobox> custom element (CLAUDE.md §7).
//
// Combobox / autocomplete: text input + filterable listbox suggestion panel.
// Three modes:
//   autocomplete — suggestions filter as user types, free text allowed
//   strict       — only listed values are valid; non-match reverts on blur
//   multi        — multiple selections rendered as chips inside the input
//
// Reuses <hbd-option> / <hbd-option-group> companion elements defined in
// hbd-select.js (no re-registration needed when both components ship).
//
// Shadow DOM. Styles via adopted stylesheets (../utils/shared-styles.js).
//
// Author API (dynamic / async options):
//   el.setOptions([{ value, label, disabled? }, ...])
// Author event (no-filter mode — server-side search):
//   el.addEventListener('hbd:search', (e) => { /* fetch then setOptions */ })
//
// aria-activedescendant pattern: DOM focus stays on the text input; the
// "active" option in the panel is identified by its id, set on the input's
// aria-activedescendant. This is the canonical APG combobox pattern.

import { adoptStyles } from '../utils/shared-styles.js';

// Ensure the companion elements exist even if hbd-select hasn't been imported.
if (!customElements.get('hbd-option')) {
  class HbdOption extends HTMLElement {
    static get observedAttributes() { return ['value', 'disabled', 'selected']; }
  }
  customElements.define('hbd-option', HbdOption);
}
if (!customElements.get('hbd-option-group')) {
  class HbdOptionGroup extends HTMLElement {
    static get observedAttributes() { return ['label']; }
  }
  customElements.define('hbd-option-group', HbdOptionGroup);
}

let uidCounter = 0;

class HbdCombobox extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'value', 'values', 'placeholder', 'label', 'hint', 'error',
      'mode', 'disabled', 'required', 'name', 'min-chars', 'debounce',
      'no-filter',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-combobox-${++uidCounter}`;

    this._allOptions = [];        // [{ value, label, disabled, group? }]
    this._groups = [];            // [{ label, options: [...] }] — for render
    this._filtered = [];          // current filtered subset
    this._activeIndex = -1;       // pointer into _filtered
    this._open = false;
    this._loading = false;
    this._lastConfirmed = '';     // input value to revert to on Escape

    this._value = this.getAttribute('value') || '';
    this._selectedItems = this._parseValues();  // [{ value, label }] for multi

    this._ready = false;
    this._mo = null;
    this._debounceTimer = null;

    this._onWrapperClick = this._onWrapperClick.bind(this);
    this._onInputFocus = this._onInputFocus.bind(this);
    this._onInputBlur = this._onInputBlur.bind(this);
    this._onInputInput = this._onInputInput.bind(this);
    this._onInputKeydown = this._onInputKeydown.bind(this);
    this._onInputClick = this._onInputClick.bind(this);
    this._onPanelClick = this._onPanelClick.bind(this);
    this._onClearClick = this._onClearClick.bind(this);
    this._onChipRemoveClick = this._onChipRemoveClick.bind(this);
    this._onDocPointer = this._onDocPointer.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/foundations/accessibility.css',
      '/ds/styles/components/input.css',
    ]);

    this._readOptions();
    this._filtered = this._allOptions.slice();
    this._ready = true;
    this._render();
    this._syncFormValue();

    this._mo = new MutationObserver((muts) => {
      const optChanged = muts.some((m) => m.target !== this);
      if (!optChanged) return;
      this._readOptions();
      this._filtered = this._allOptions.slice();
      this._render();
    });
    this._mo.observe(this, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['value', 'disabled', 'selected', 'label'],
    });
  }

  disconnectedCallback() {
    if (this._mo) { this._mo.disconnect(); this._mo = null; }
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._removeDocListeners();
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value') this._value = newVal || '';
    if (name === 'values') this._selectedItems = this._parseValues();
    if (this._ready && this.isConnected) this._render();
  }

  // ── Public API ──────────────────────────────────────────────────────
  /** Replace the option set (dynamic / async). */
  setOptions(options) {
    if (!Array.isArray(options)) return;
    this._allOptions = options.map((o, i) => ({
      value: String(o.value ?? o.label ?? ''),
      label: String(o.label ?? o.value ?? ''),
      disabled: !!o.disabled,
      index: i,
    }));
    this._groups = [{ label: null, options: this._allOptions }];
    this._filtered = this._allOptions.slice();
    this._loading = false;
    this._activeIndex = this._firstEnabledFilteredIndex();
    this._renderPanel();
  }

  /** Current value (single/autocomplete/strict). */
  get value() { return this._value; }
  set value(v) {
    this._value = v == null ? '' : String(v);
    this.setAttribute('value', this._value);
  }

  /** Current selection list (multi). */
  get values() { return this._selectedItems.slice(); }

  // ── Helpers ─────────────────────────────────────────────────────────
  get _mode() {
    const m = (this.getAttribute('mode') || 'autocomplete').toLowerCase();
    return ['autocomplete', 'strict', 'multi'].includes(m) ? m : 'autocomplete';
  }
  get _isMulti() { return this._mode === 'multi'; }
  get _isStrict() { return this._mode === 'strict'; }
  get _minChars() {
    const n = parseInt(this.getAttribute('min-chars'), 10);
    return Number.isFinite(n) && n >= 0 ? n : 1;
  }
  get _debounceMs() {
    const n = parseInt(this.getAttribute('debounce'), 10);
    return Number.isFinite(n) && n >= 0 ? n : 200;
  }
  get _noFilter() { return this.hasAttribute('no-filter'); }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  _describedBy(ids) { return ids.filter(Boolean).join(' '); }

  _parseValues() {
    const raw = this.getAttribute('values');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((v) => (typeof v === 'string'
          ? { value: v, label: v }
          : { value: String(v.value ?? v.label ?? ''),
              label: String(v.label ?? v.value ?? '') }))
        .filter((v) => v.value);
    } catch {
      return [];
    }
  }

  _readOptions() {
    const groups = [];
    const flat = [];
    Array.from(this.children).forEach((child) => {
      const tag = child.tagName.toLowerCase();
      if (tag === 'hbd-option-group') {
        const grp = { label: child.getAttribute('label') || '', options: [] };
        Array.from(child.querySelectorAll('hbd-option')).forEach((opt) => {
          const e = this._optEntry(opt, flat.length);
          grp.options.push(e); flat.push(e);
        });
        groups.push(grp);
      } else if (tag === 'hbd-option') {
        const e = this._optEntry(child, flat.length);
        flat.push(e);
        groups.push({ label: null, options: [e] });
      }
    });
    this._groups = groups;
    this._allOptions = flat;
  }

  _optEntry(el, idx) {
    const value = el.getAttribute('value') || el.textContent.trim();
    return {
      value,
      label: el.textContent.trim(),
      disabled: el.hasAttribute('disabled'),
      index: idx,
    };
  }

  _firstEnabledFilteredIndex() {
    return this._filtered.findIndex((o) => !o.disabled);
  }
  _lastEnabledFilteredIndex() {
    for (let i = this._filtered.length - 1; i >= 0; i--) {
      if (!this._filtered[i].disabled) return i;
    }
    return -1;
  }
  _nextEnabledFiltered(from, dir) {
    const n = this._filtered.length;
    if (n === 0) return -1;
    let i = from;
    for (let s = 0; s < n; s++) {
      i = (i + dir + n) % n;
      if (!this._filtered[i].disabled) return i;
    }
    return -1;
  }

  _removeListeners() {
    const wrap = this.shadowRoot.querySelector('.hbd-combobox');
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');
    const panel = this.shadowRoot.querySelector('.hbd-combobox__panel');
    const clear = this.shadowRoot.querySelector('.hbd-combobox__clear');
    if (wrap) wrap.removeEventListener('mousedown', this._onWrapperClick);
    if (input) {
      input.removeEventListener('focus', this._onInputFocus);
      input.removeEventListener('blur', this._onInputBlur);
      input.removeEventListener('input', this._onInputInput);
      input.removeEventListener('keydown', this._onInputKeydown);
      input.removeEventListener('click', this._onInputClick);
    }
    if (panel) panel.removeEventListener('mousedown', this._onPanelClick);
    if (clear) clear.removeEventListener('click', this._onClearClick);
    const chipRemoves = this.shadowRoot.querySelectorAll('.hbd-combobox__chip-remove');
    chipRemoves.forEach((b) => b.removeEventListener('click', this._onChipRemoveClick));
  }

  _addDocListeners() {
    document.addEventListener('pointerdown', this._onDocPointer, true);
  }
  _removeDocListeners() {
    document.removeEventListener('pointerdown', this._onDocPointer, true);
  }

  _syncFormValue() {
    if (this._isMulti) {
      this._internals.setFormValue(JSON.stringify(this._selectedItems));
    } else {
      this._internals.setFormValue(this._value || null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint');
    const error = this.getAttribute('error');
    const placeholder = this.getAttribute('placeholder') || '';
    const required = this.hasAttribute('required');
    const disabled = this.hasAttribute('disabled');

    const hasError = error != null && error !== '';
    const hasHint = hint != null && hint !== '';

    const fieldClasses = ['hbd-field'];
    if (hasError) fieldClasses.push('hbd-field--error');
    if (disabled) fieldClasses.push('hbd-field--disabled');
    if (this._open) fieldClasses.push('hbd-field--open');

    const wrapperClasses = ['hbd-combobox'];
    if (this._isMulti) wrapperClasses.push('hbd-combobox--multi');
    if (this._hasAnyValue()) wrapperClasses.push('hbd-combobox--has-value');

    const describedBy = this._describedBy([
      hasHint ? `hint-${uid}` : '',
      hasError ? `error-${uid}` : '',
    ]);

    // Input's display value:
    //  - multi: always empty (chips carry the selection)
    //  - single/strict/autocomplete: the value attribute's label
    const inputValue = this._isMulti
      ? ''
      : (this._labelForValue(this._value) || this._value || '');

    const chipsHtml = this._isMulti
      ? this._selectedItems.map((item, i) => this._chipHtml(item, i)).join('')
      : '';

    this.shadowRoot.innerHTML = `
      <div class="${fieldClasses.join(' ')}">
        ${label ? `
        <label class="hbd-field__label" id="label-${uid}" for="input-${uid}">
          ${this._esc(label)}${required ? `<span class="hbd-field__label-required" aria-hidden="true">*</span>` : ''}
        </label>` : ''}

        <div class="hbd-combobox__shell">
          <div class="${wrapperClasses.join(' ')}"
               role="combobox"
               aria-expanded="${this._open ? 'true' : 'false'}"
               aria-haspopup="listbox"
               ${label ? `aria-labelledby="label-${uid}"` : ''}
               aria-owns="panel-${uid}">

            ${chipsHtml}

            <input class="hbd-combobox__input"
                   id="input-${uid}"
                   type="text"
                   autocomplete="off"
                   autocorrect="off"
                   spellcheck="false"
                   role="combobox"
                   aria-autocomplete="list"
                   aria-controls="panel-${uid}"
                   aria-expanded="${this._open ? 'true' : 'false'}"
                   ${describedBy ? `aria-describedby="${describedBy}"` : ''}
                   ${required ? 'aria-required="true"' : ''}
                   ${hasError ? 'aria-invalid="true"' : ''}
                   ${placeholder && !this._isMulti ? `placeholder="${this._esc(placeholder)}"` : ''}
                   ${placeholder && this._isMulti && this._selectedItems.length === 0 ? `placeholder="${this._esc(placeholder)}"` : ''}
                   value="${this._esc(inputValue)}"
                   ${disabled ? 'disabled' : ''}>

            <button type="button"
                    class="hbd-combobox__clear"
                    aria-label="Clear selection"
                    tabindex="-1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <ul class="hbd-field__select-panel hbd-combobox__panel"
              id="panel-${uid}"
              role="listbox"
              ${label ? `aria-labelledby="label-${uid}"` : ''}
              aria-multiselectable="${this._isMulti ? 'true' : 'false'}"></ul>
        </div>

        <div class="hbd-field__footer">
          ${hasHint ? `<span class="hbd-field__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
          ${hasError ? `<span class="hbd-field__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
        </div>
      </div>
    `;

    this._lastConfirmed = inputValue;
    this._renderPanel();

    // Wire listeners.
    const wrap = this.shadowRoot.querySelector('.hbd-combobox');
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');
    const panel = this.shadowRoot.querySelector('.hbd-combobox__panel');
    const clear = this.shadowRoot.querySelector('.hbd-combobox__clear');
    wrap.addEventListener('mousedown', this._onWrapperClick);
    input.addEventListener('focus', this._onInputFocus);
    input.addEventListener('blur', this._onInputBlur);
    input.addEventListener('input', this._onInputInput);
    input.addEventListener('keydown', this._onInputKeydown);
    input.addEventListener('click', this._onInputClick);
    panel.addEventListener('mousedown', this._onPanelClick);
    if (clear) clear.addEventListener('click', this._onClearClick);
    this.shadowRoot.querySelectorAll('.hbd-combobox__chip-remove')
      .forEach((b) => b.addEventListener('click', this._onChipRemoveClick));
  }

  _hasAnyValue() {
    if (this._isMulti) return this._selectedItems.length > 0;
    const input = this.shadowRoot && this.shadowRoot.querySelector('.hbd-combobox__input');
    return !!this._value || !!(input && input.value);
  }

  _labelForValue(value) {
    if (!value) return '';
    const hit = this._allOptions.find((o) => o.value === value);
    return hit ? hit.label : value;
  }

  _chipHtml(item, idx) {
    return `
      <span class="hbd-combobox__chip" data-chip-index="${idx}">
        <span class="hbd-combobox__chip-label">${this._esc(item.label)}</span>
        <button type="button"
                class="hbd-combobox__chip-remove"
                data-chip-index="${idx}"
                aria-label="Remove ${this._esc(item.label)}">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </span>`;
  }

  // ── Panel rendering ────────────────────────────────────────────────
  _renderPanel() {
    const panel = this.shadowRoot.querySelector('.hbd-combobox__panel');
    if (!panel) return;
    const uid = this._uid;

    if (this._loading) {
      panel.innerHTML = `
        <li class="hbd-combobox__loading-row" role="status" aria-live="polite">
          <span class="hbd-combobox__spinner" aria-hidden="true"></span>
          <span>Searching…</span>
        </li>`;
      this._updateActiveDescendant(null);
      return;
    }

    if (this._filtered.length === 0) {
      panel.innerHTML = `
        <li class="hbd-combobox__no-results" role="status" aria-live="polite">
          No results
        </li>`;
      this._updateActiveDescendant(null);
      return;
    }

    panel.innerHTML = this._filtered
      .map((o, i) => this._optionLi(o, i, uid))
      .join('');
    this._syncActiveOptionVisuals();
  }

  _optionLi(o, filteredIndex, uid) {
    const isSelected = this._isMulti
      ? this._selectedItems.some((s) => s.value === o.value)
      : o.value === this._value;
    const isActive = filteredIndex === this._activeIndex;
    const cls = [
      'hbd-field__option',
      isSelected ? 'is-selected' : '',
      o.disabled ? 'is-disabled' : '',
      isActive ? 'is-focused' : '',
    ].filter(Boolean).join(' ');
    return `
      <li class="${cls}"
          role="option"
          id="option-${uid}-${filteredIndex}"
          aria-selected="${isSelected ? 'true' : 'false'}"
          ${o.disabled ? 'aria-disabled="true"' : ''}
          data-value="${this._esc(o.value)}"
          data-filtered-index="${filteredIndex}">
        <span>${this._esc(o.label)}</span>
        <span class="hbd-field__option-check" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </li>`;
  }

  _syncActiveOptionVisuals() {
    const uid = this._uid;
    const panel = this.shadowRoot.querySelector('.hbd-combobox__panel');
    if (!panel) return;
    panel.querySelectorAll('.hbd-field__option').forEach((el) => {
      const idx = parseInt(el.getAttribute('data-filtered-index'), 10);
      el.classList.toggle('is-focused', idx === this._activeIndex);
    });
    const activeId = this._activeIndex >= 0
      ? `option-${uid}-${this._activeIndex}`
      : null;
    this._updateActiveDescendant(activeId);
    if (activeId) {
      const target = panel.querySelector(`#${activeId}`);
      if (target) target.scrollIntoView({ block: 'nearest' });
    }
  }

  _updateActiveDescendant(idOrNull) {
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');
    if (!input) return;
    if (idOrNull) input.setAttribute('aria-activedescendant', idOrNull);
    else input.removeAttribute('aria-activedescendant');
  }

  // ── Open / close ────────────────────────────────────────────────────
  _setOpenClass(isOpen) {
    const field = this.shadowRoot.querySelector('.hbd-field');
    const wrap = this.shadowRoot.querySelector('.hbd-combobox');
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');
    if (field) field.classList.toggle('hbd-field--open', isOpen);
    if (wrap) wrap.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (input) input.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  _openPanel() {
    if (this._open || this.hasAttribute('disabled')) return;
    this._open = true;
    if (this._activeIndex < 0) {
      this._activeIndex = this._firstEnabledFilteredIndex();
    }
    this._setOpenClass(true);
    this._addDocListeners();
    this._syncActiveOptionVisuals();
    this.dispatchEvent(new CustomEvent('hbd:open', { bubbles: true, composed: true }));
  }

  _closePanel({ revert = false } = {}) {
    if (!this._open) return;
    this._open = false;
    this._removeDocListeners();
    this._setOpenClass(false);
    this._updateActiveDescendant(null);
    this._activeIndex = -1;
    if (revert) {
      const input = this.shadowRoot.querySelector('.hbd-combobox__input');
      if (input) input.value = this._lastConfirmed || '';
    }
    this.dispatchEvent(new CustomEvent('hbd:close', { bubbles: true, composed: true }));
  }

  // ── Event handlers ──────────────────────────────────────────────────
  _onWrapperClick(e) {
    // Click anywhere in the wrapper (e.g. blank chip area) focuses the input.
    if (e.target.closest('.hbd-combobox__chip-remove')) return;
    if (e.target.closest('.hbd-combobox__clear')) return;
    if (e.target.closest('.hbd-combobox__input')) return;
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');
    if (input && !this.hasAttribute('disabled')) {
      e.preventDefault();
      input.focus();
    }
  }

  _onInputFocus() {
    if (this.hasAttribute('disabled')) return;
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');
    const q = input ? input.value : '';
    this._filterAndOpen(q);
  }

  // Open on every click into the input, including clicks after focus is
  // already on the input. Without this, a user who closes the panel via
  // Escape or by clicking outside can't re-open by clicking the input.
  _onInputClick() {
    if (this.hasAttribute('disabled')) return;
    if (this._open) return;
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');
    this._filterAndOpen(input ? input.value : '');
  }

  _onInputBlur() {
    // Strict mode: revert to last valid label if input no longer matches.
    if (this._isStrict) {
      const input = this.shadowRoot.querySelector('.hbd-combobox__input');
      const raw = input ? input.value.trim() : '';
      const match = this._allOptions.find((o) =>
        o.label.toLowerCase() === raw.toLowerCase());
      if (raw && !match) {
        this.dispatchEvent(new CustomEvent('hbd:invalid-input', {
          detail: { input: raw },
          bubbles: true,
          composed: true,
        }));
        // Clear back to the last confirmed value.
        if (input) input.value = this._labelForValue(this._value) || '';
      }
    }
    // Don't close on blur immediately — mousedown on an option fires before
    // blur. The document pointer listener (or selection handler) closes it.
  }

  _onInputInput(e) {
    let q = e.target.value;

    // Single-select: if the user edits the input away from the currently-
    // selected option's label (typically by Backspacing it), clear both
    // the selection AND the residual input text so the menu shows the
    // FULL option list (otherwise it would filter to a partial query
    // like "Fireba" matching only the just-deselected "Fireball"). Multi
    // mode is unaffected — chips carry the selection there.
    if (!this._isMulti && this._value) {
      const selectedLabel = this._labelForValue(this._value) || '';
      if (q !== selectedLabel) {
        this._value = '';
        this.removeAttribute('value');
        this._syncFormValue();
        e.target.value = '';
        q = '';
        this._lastConfirmed = '';
        this.dispatchEvent(new CustomEvent('hbd:change', {
          detail: { value: '', label: null },
          bubbles: true,
          composed: true,
        }));
      }
    }

    this._toggleHasValueClass();

    if (this._noFilter) {
      this._loading = true;
      this._renderPanel();
      if (!this._open) this._openPanel();
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        this.dispatchEvent(new CustomEvent('hbd:search', {
          detail: { query: q },
          bubbles: true,
          composed: true,
        }));
      }, this._debounceMs);
      return;
    }

    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._filterAndOpen(q);
    }, this._debounceMs);
  }

  _toggleHasValueClass() {
    const wrap = this.shadowRoot.querySelector('.hbd-combobox');
    if (!wrap) return;
    wrap.classList.toggle('hbd-combobox--has-value', this._hasAnyValue());
  }

  _filterAndOpen(query) {
    const q = (query || '').toLowerCase();
    // If the query is exactly the currently-selected option's label, show
    // ALL options so the user can pick a different one. Without this, the
    // panel would re-open filtered to just the already-selected item and
    // there'd be no way to switch by clicking another option.
    const selectedLabel = this._value
      ? (this._labelForValue(this._value) || '').toLowerCase()
      : '';
    const isJustSelectedLabel = !!selectedLabel && selectedLabel === q;

    if (q.length < this._minChars || isJustSelectedLabel) {
      this._filtered = this._allOptions.slice();
    } else {
      this._filtered = this._allOptions
        .filter((o) => o.label.toLowerCase().includes(q));
    }
    this._activeIndex = this._firstEnabledFilteredIndex();
    if (!this._open) this._openPanel();
    // Always re-render the panel so selection state (is-selected /
    // aria-selected) reflects the current _selectedItems / _value — needed
    // after Backspace removes a chip while the panel is closed and the
    // user re-opens.
    this._renderPanel();
  }

  _onInputKeydown(e) {
    if (this.hasAttribute('disabled')) return;
    const input = e.target;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this._open) {
          this._filterAndOpen(input.value);
        } else {
          this._activeIndex = this._nextEnabledFiltered(this._activeIndex, 1);
          this._syncActiveOptionVisuals();
        }
        return;
      case 'ArrowUp':
        e.preventDefault();
        if (!this._open) {
          this._filterAndOpen(input.value);
        } else {
          this._activeIndex = this._nextEnabledFiltered(this._activeIndex, -1);
          this._syncActiveOptionVisuals();
        }
        return;
      case 'Home':
        if (this._open) {
          e.preventDefault();
          this._activeIndex = this._firstEnabledFilteredIndex();
          this._syncActiveOptionVisuals();
        }
        return;
      case 'End':
        if (this._open) {
          e.preventDefault();
          this._activeIndex = this._lastEnabledFilteredIndex();
          this._syncActiveOptionVisuals();
        }
        return;
      case 'Enter':
        if (this._open && this._activeIndex >= 0) {
          e.preventDefault();
          this._selectFilteredIndex(this._activeIndex);
        }
        return;
      case 'Escape':
        if (this._open) {
          e.preventDefault();
          this._closePanel({ revert: true });
        }
        return;
      case 'Tab':
        if (this._open) this._closePanel();
        return;
      case 'Backspace':
        if (this._isMulti && input.value === '' && this._selectedItems.length > 0) {
          e.preventDefault();
          this._removeChipAt(this._selectedItems.length - 1);
        }
        return;
      default:
        return;
    }
  }

  _onPanelClick(e) {
    const li = e.target.closest('.hbd-field__option');
    if (!li) return;
    if (li.classList.contains('is-disabled')) return;
    e.preventDefault();           // prevent input blur on mousedown
    e.stopPropagation();
    const idx = parseInt(li.getAttribute('data-filtered-index'), 10);
    this._selectFilteredIndex(idx);
  }

  _onClearClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.hasAttribute('disabled')) return;
    if (this._isMulti) {
      this._selectedItems = [];
      this.removeAttribute('values');
    } else {
      this._value = '';
      this.removeAttribute('value');
    }
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');
    if (input) { input.value = ''; input.focus(); }
    this._syncFormValue();
    this._render();
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: this._isMulti ? { values: [] } : { value: '', label: null },
      bubbles: true,
      composed: true,
    }));
  }

  _onChipRemoveClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const idx = parseInt(e.currentTarget.getAttribute('data-chip-index'), 10);
    this._removeChipAt(idx);
  }

  _removeChipAt(idx) {
    if (idx < 0 || idx >= this._selectedItems.length) return;
    this._selectedItems.splice(idx, 1);
    this.setAttribute('values', JSON.stringify(this._selectedItems));
    this._syncFormValue();
    this._render();
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');
    if (input) input.focus();
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { values: this._selectedItems.slice() },
      bubbles: true,
      composed: true,
    }));
  }

  _onDocPointer(e) {
    if (!e.composedPath().includes(this)) {
      this._closePanel();
    }
  }

  // ── Selection ───────────────────────────────────────────────────────
  _selectFilteredIndex(i) {
    const opt = this._filtered[i];
    if (!opt || opt.disabled) return;
    const input = this.shadowRoot.querySelector('.hbd-combobox__input');

    if (this._isMulti) {
      // Toggle behaviour: if already selected, remove it; else add.
      const existing = this._selectedItems.findIndex((s) => s.value === opt.value);
      if (existing >= 0) {
        this._selectedItems.splice(existing, 1);
      } else {
        this._selectedItems.push({ value: opt.value, label: opt.label });
      }
      this.setAttribute('values', JSON.stringify(this._selectedItems));
      this._syncFormValue();
      // Clear input text but keep panel open for further picks.
      if (input) { input.value = ''; this._lastConfirmed = ''; }
      this._render();
      // Keep panel open after re-render.
      this._openPanel();
      this.dispatchEvent(new CustomEvent('hbd:change', {
        detail: { values: this._selectedItems.slice() },
        bubbles: true,
        composed: true,
      }));
      // Refocus the input after the re-render.
      const newInput = this.shadowRoot.querySelector('.hbd-combobox__input');
      if (newInput) newInput.focus();
      return;
    }

    // single / autocomplete / strict
    // Toggle-off: clicking the currently selected option clears it (parallels
    // the hbd-select toggle-off behaviour for visual consistency).
    if (this._value === opt.value) {
      this._value = '';
      this.removeAttribute('value');
      this._syncFormValue();
      if (input) {
        input.value = '';
        this._lastConfirmed = '';
      }
      this._toggleHasValueClass();
      this._closePanel();
      this.dispatchEvent(new CustomEvent('hbd:change', {
        detail: { value: '', label: null },
        bubbles: true,
        composed: true,
      }));
      return;
    }

    this._value = opt.value;
    this.setAttribute('value', opt.value);
    this._syncFormValue();
    if (input) {
      input.value = opt.label;
      this._lastConfirmed = opt.label;
    }
    this._toggleHasValueClass();
    this._closePanel();
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { value: opt.value, label: opt.label },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('hbd-combobox')) {
  customElements.define('hbd-combobox', HbdCombobox);
}
