// ds/components/hbd-select.js
// Here Be Dragons DS — <hbd-select> custom element (CLAUDE.md §7).
//
// A fully-accessible custom select. Native <select> cannot be consistently
// styled across browsers while meeting the HBD visual requirements, so this
// builds a combobox + listbox pattern from scratch and keeps a hidden native
// <select> in the Shadow DOM as a form-submission fallback (ElementInternals
// handles the canonical value).
//
// PARALLEL TO hbd-input.js / hbd-textarea.js — same .hbd-field wrapper,
// per-instance uid, dynamic aria-describedby, formAssociated + uid counter.
// Options are authored as Light-DOM <hbd-option> / <hbd-option-group> children
// and are mirrored into the Shadow-DOM panel (and into the hidden native
// select). A MutationObserver re-reads the options if children change at
// runtime.
//
// Styles are loaded via adopted stylesheets (see ../utils/shared-styles.js),
// NOT via per-render <link> tags. This eliminates the FOUC "blink" that
// occurs when innerHTML replacement re-fetches/re-resolves linked CSS.

import { adoptStyles } from '../utils/shared-styles.js';

let uidCounter = 0;

// ── Companion elements: data carriers only. No Shadow DOM, no styles,
// no behaviour. hbd-select reads their attributes + textContent. ──────────
class HbdOption extends HTMLElement {
  static get observedAttributes() { return ['value', 'disabled', 'selected']; }
}
if (!customElements.get('hbd-option')) {
  customElements.define('hbd-option', HbdOption);
}

class HbdOptionGroup extends HTMLElement {
  static get observedAttributes() { return ['label']; }
}
if (!customElements.get('hbd-option-group')) {
  customElements.define('hbd-option-group', HbdOptionGroup);
}

class HbdSelect extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'name', 'value', 'placeholder', 'label', 'hint', 'error',
      'required', 'disabled', 'size',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-select-${++uidCounter}`;
    this._value = this.getAttribute('value') || '';
    this._open = false;
    this._options = [];     // flat list of {value, label, disabled, group?}
    this._focusedIndex = -1;
    this._typeBuffer = '';
    this._typeTimer = null;
    this._ready = false;
    this._mo = null;
    this._onTriggerClick = this._onTriggerClick.bind(this);
    this._onTriggerKeydown = this._onTriggerKeydown.bind(this);
    this._onPanelClick = this._onPanelClick.bind(this);
    this._onPanelKeydown = this._onPanelKeydown.bind(this);
    this._onClearClick = this._onClearClick.bind(this);
    this._onClearKeydown = this._onClearKeydown.bind(this);
    this._onDocPointer = this._onDocPointer.bind(this);
  }

  connectedCallback() {
    // Adopt shared stylesheets once. Cached by shared-styles.js — subsequent
    // calls (or other instances) reuse the same parsed CSSStyleSheet objects
    // without refetching. Persists across innerHTML replacements, eliminating
    // the per-render <link>-reparse flash that caused the select to blink on
    // select/unselect.
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/foundations/accessibility.css',
      '/ds/styles/components/input.css',
    ]);

    // Mirror the spell-card / stat-block fix: do the first read here, after
    // children exist, then mark ready so attributeChangedCallback can render.
    this._readOptions();
    this._ready = true;
    this._render();
    this._internals.setFormValue(this._value || null);

    // Watch for added/removed/changed hbd-option(-group) children. Ignore
    // mutations on the host element itself (those go through
    // attributeChangedCallback) to avoid double-rendering.
    this._mo = new MutationObserver((muts) => {
      const optionChanged = muts.some((m) => m.target !== this);
      if (!optionChanged) return;
      this._readOptions();
      this._render();
    });
    this._mo.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['value', 'disabled', 'selected', 'label'] });
  }

  disconnectedCallback() {
    if (this._mo) { this._mo.disconnect(); this._mo = null; }
    this._removeDocListeners();
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value') this._value = newVal || '';
    if (this._ready && this.isConnected) this._render();
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

  // Flatten <hbd-option> / <hbd-option-group> children into a uniform list,
  // keeping a parallel groups array for rendering structure.
  _readOptions() {
    const groups = [];   // {label, options: [...]}
    const flat = [];     // flat order for keyboard nav + native <select>

    Array.from(this.children).forEach((child) => {
      const tag = child.tagName.toLowerCase();
      if (tag === 'hbd-option-group') {
        const grp = {
          label: child.getAttribute('label') || '',
          options: [],
        };
        Array.from(child.querySelectorAll('hbd-option')).forEach((opt) => {
          const entry = this._optionEntry(opt, flat.length);
          grp.options.push(entry);
          flat.push(entry);
        });
        groups.push(grp);
      } else if (tag === 'hbd-option') {
        const entry = this._optionEntry(child, flat.length);
        flat.push(entry);
        groups.push({ label: null, options: [entry] });
      }
    });

    this._groups = groups;
    this._options = flat;
  }

  _optionEntry(el, flatIndex) {
    const value = el.getAttribute('value') || el.textContent.trim();
    return {
      value,
      label: el.textContent.trim(),
      disabled: el.hasAttribute('disabled'),
      index: flatIndex,
    };
  }

  _selectedOption() {
    return this._options.find((o) => o.value === this._value) || null;
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
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n;
      if (!this._options[i].disabled) return i;
    }
    return -1;
  }

  _describedBy(ids) { return ids.filter(Boolean).join(' '); }

  _removeListeners() {
    const trigger = this.shadowRoot.querySelector('.hbd-field__select-trigger');
    const panel = this.shadowRoot.querySelector('.hbd-field__select-panel');
    const clear = this.shadowRoot.querySelector('.hbd-field__select-chip-clear');
    if (trigger) {
      trigger.removeEventListener('click', this._onTriggerClick);
      trigger.removeEventListener('keydown', this._onTriggerKeydown);
    }
    if (panel) {
      panel.removeEventListener('click', this._onPanelClick);
      panel.removeEventListener('keydown', this._onPanelKeydown);
    }
    if (clear) {
      clear.removeEventListener('pointerdown', this._onClearClick);
      clear.removeEventListener('click', this._onClearClick);
      clear.removeEventListener('keydown', this._onClearKeydown);
    }
  }

  _addDocListeners() {
    document.addEventListener('pointerdown', this._onDocPointer, true);
  }
  _removeDocListeners() {
    document.removeEventListener('pointerdown', this._onDocPointer, true);
  }

  // ── Render ──────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const name = this.getAttribute('name');
    const placeholder = this.getAttribute('placeholder') || '';
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint');
    const error = this.getAttribute('error');
    const required = this.hasAttribute('required');
    const disabled = this.hasAttribute('disabled');

    const hasError = error != null && error !== '';
    const hasHint = hint != null && hint !== '';

    const classes = ['hbd-field', `hbd-field--${this._size}`];
    if (hasError) classes.push('hbd-field--error');
    if (disabled) classes.push('hbd-field--disabled');
    if (this._open) classes.push('hbd-field--open');

    const describedBy = this._describedBy([
      hasHint ? `hint-${uid}` : '',
      hasError ? `error-${uid}` : '',
    ]);

    const selected = this._selectedOption();
    const displayText = selected ? selected.label : (placeholder || ' ');
    // Chip styling when a value is selected; muted placeholder text otherwise.
    const valueClass = selected
      ? 'hbd-field__select-value hbd-field__select-value--chip'
      : 'hbd-field__select-value hbd-field__select-value--placeholder';

    // Build panel + native option HTML in parallel from the same groups.
    let panelHtml = '';
    let nativeHtml = '';
    if (placeholder && !selected) {
      nativeHtml += `<option value="" disabled selected hidden>${this._esc(placeholder)}</option>`;
    }
    this._groups.forEach((grp, gi) => {
      if (grp.label) {
        const grpId = `group-${uid}-${gi}`;
        panelHtml += `
          <li class="hbd-field__option-group" role="presentation">
            <span class="hbd-field__option-group-label" id="${grpId}">${this._esc(grp.label)}</span>
            <ul role="group" aria-labelledby="${grpId}">
              ${grp.options.map((o) => this._optionLi(o, uid)).join('')}
            </ul>
          </li>`;
        nativeHtml += `<optgroup label="${this._esc(grp.label)}">${
          grp.options.map((o) => this._nativeOption(o)).join('')
        }</optgroup>`;
      } else {
        panelHtml += grp.options.map((o) => this._optionLi(o, uid)).join('');
        nativeHtml += grp.options.map((o) => this._nativeOption(o)).join('');
      }
    });

    // Stylesheets are adopted in connectedCallback (see adoptStyles); the
    // shadow root only contains the structural markup below.
    this.shadowRoot.innerHTML = `
      <div class="${classes.join(' ')}"
           role="combobox"
           aria-expanded="${this._open ? 'true' : 'false'}"
           aria-haspopup="listbox"
           aria-labelledby="label-${uid}">

        ${label ? `
        <label class="hbd-field__label" id="label-${uid}" for="trigger-${uid}">
          ${this._esc(label)}${required ? `<span class="hbd-field__label-required" aria-hidden="true">*</span>` : ''}
        </label>` : ''}

        <div class="hbd-field__input-wrapper">
          <button class="hbd-field__select-trigger"
                  id="trigger-${uid}"
                  type="button"
                  aria-controls="panel-${uid}"
                  aria-haspopup="listbox"
                  aria-expanded="${this._open ? 'true' : 'false'}"
                  ${required ? 'aria-required="true"' : ''}
                  ${hasError ? 'aria-invalid="true"' : ''}
                  ${describedBy ? `aria-describedby="${describedBy}"` : ''}
                  ${disabled ? 'disabled' : ''}>
            <span class="${valueClass}">
              ${selected ? `<span class="hbd-field__select-chip-label">${this._esc(displayText)}</span>` : this._esc(displayText)}
              ${(selected && !disabled) ? `
              <!-- role="button" span (not <button>): HTML disallows nesting a
                   <button> inside the trigger <button>, so this is a focusable
                   span with explicit keyboard handling (_onClearKeydown). -->
              <span role="button"
                    tabindex="0"
                    class="hbd-field__select-chip-clear"
                    aria-label="Clear selection, currently ${this._esc(selected.label)}">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>` : ''}
            </span>
            <span class="hbd-field__select-chevron" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>

          <ul class="hbd-field__select-panel"
              id="panel-${uid}"
              role="listbox"
              aria-labelledby="label-${uid}"
              aria-multiselectable="false">
            ${panelHtml}
          </ul>
        </div>

        <select class="hbd-field__select-native hbd-sr-only"
                ${name ? `name="${this._esc(name)}"` : ''}
                aria-hidden="true"
                tabindex="-1"
                ${required ? 'required' : ''}
                ${disabled ? 'disabled' : ''}>
          ${nativeHtml}
        </select>

        ${(hasHint || hasError) ? `
        <div class="hbd-field__footer">
          ${hasHint ? `<span class="hbd-field__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
          ${hasError ? `<span class="hbd-field__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
        </div>` : ''}
      </div>
    `;

    // Sync native select value.
    const native = this.shadowRoot.querySelector('.hbd-field__select-native');
    if (native && selected) native.value = selected.value;

    // Wire listeners on the freshly-rendered nodes.
    const trigger = this.shadowRoot.querySelector('.hbd-field__select-trigger');
    const panel = this.shadowRoot.querySelector('.hbd-field__select-panel');
    const clear = this.shadowRoot.querySelector('.hbd-field__select-chip-clear');
    trigger.addEventListener('click', this._onTriggerClick);
    trigger.addEventListener('keydown', this._onTriggerKeydown);
    panel.addEventListener('click', this._onPanelClick);
    panel.addEventListener('keydown', this._onPanelKeydown);
    if (clear) {
      // pointerdown beats the document outside-click and beats trigger click —
      // both could otherwise interfere with clearing while the panel is open.
      // Enter/Space on the focused chip-clear also clears (role="button"
      // span has no native keyboard activation).
      clear.addEventListener('pointerdown', this._onClearClick);
      clear.addEventListener('click', this._onClearClick);
      clear.addEventListener('keydown', this._onClearKeydown);
    }

    // If panel just (re)rendered while open, move focus to the active option.
    if (this._open) this._focusActiveOption();
  }

  _optionLi(o, uid) {
    const isSelected = o.value === this._value;
    const isFocused = o.index === this._focusedIndex;
    const cls = [
      'hbd-field__option',
      isSelected ? 'is-selected' : '',
      o.disabled ? 'is-disabled' : '',
      isFocused ? 'is-focused' : '',
    ].filter(Boolean).join(' ');
    return `
      <li class="${cls}"
          role="option"
          id="option-${uid}-${o.index}"
          aria-selected="${isSelected ? 'true' : 'false'}"
          ${o.disabled ? 'aria-disabled="true"' : ''}
          tabindex="${(isFocused || (this._focusedIndex === -1 && o.index === this._firstEnabledIndex())) ? '0' : '-1'}"
          data-value="${this._esc(o.value)}"
          data-index="${o.index}">
        <span>${this._esc(o.label)}</span>
        <span class="hbd-field__option-check" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </li>`;
  }

  _nativeOption(o) {
    const sel = o.value === this._value ? ' selected' : '';
    const dis = o.disabled ? ' disabled' : '';
    return `<option value="${this._esc(o.value)}"${sel}${dis}>${this._esc(o.label)}</option>`;
  }

  _focusActiveOption() {
    if (!this._open) return;
    const idx = this._focusedIndex >= 0
      ? this._focusedIndex
      : (this._options.findIndex((o) => o.value === this._value && !o.disabled));
    const target = idx >= 0 ? idx : this._firstEnabledIndex();
    if (target < 0) return;
    this._focusedIndex = target;
    const el = this.shadowRoot.querySelector(`#option-${this._uid}-${target}`);
    if (el) {
      el.setAttribute('tabindex', '0');
      el.focus({ preventScroll: false });
      el.scrollIntoView({ block: 'nearest' });
    }
  }

  // ── Open / close ────────────────────────────────────────────────────
  // Toggling open/closed mutates the existing wrapper's class + aria —
  // it does NOT call _render(). Re-rendering would destroy and recreate
  // the panel <ul> node, which would prevent the CSS transition from
  // running (transitions require a continuous element to interpolate).
  // Full _render() is reserved for cases that actually change content
  // (selection, options, attributes).
  _setOpenClass(isOpen) {
    const wrapper = this.shadowRoot.querySelector('.hbd-field');
    if (!wrapper) return;
    wrapper.classList.toggle('hbd-field--open', isOpen);
    wrapper.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const trigger = wrapper.querySelector('.hbd-field__select-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  _openPanel(focusFirstInstead) {
    if (this._open || this.hasAttribute('disabled')) return;
    this._open = true;
    this._focusedIndex = focusFirstInstead
      ? this._firstEnabledIndex()
      : (this._options.findIndex((o) => o.value === this._value && !o.disabled));
    if (this._focusedIndex < 0) this._focusedIndex = this._firstEnabledIndex();
    this._setOpenClass(true);
    this._addDocListeners();
    // Move focus into the active option without rebuilding the panel.
    this._focusActiveOption();
    this.dispatchEvent(new CustomEvent('hbd:open', { bubbles: true, composed: true }));
  }

  _closePanel(returnFocus = true) {
    if (!this._open) return;
    this._open = false;
    this._removeDocListeners();
    this._setOpenClass(false);
    if (returnFocus) {
      const trigger = this.shadowRoot.querySelector('.hbd-field__select-trigger');
      if (trigger) trigger.focus({ preventScroll: true });
    }
    this.dispatchEvent(new CustomEvent('hbd:close', { bubbles: true, composed: true }));
  }

  // ── Events ──────────────────────────────────────────────────────────
  _onTriggerClick(e) {
    e.stopPropagation();
    if (this._open) this._closePanel();
    else this._openPanel(false);
  }

  _onTriggerKeydown(e) {
    if (this.hasAttribute('disabled')) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        this._openPanel(false);
        break;
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        this._openPanel(false);
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        this._openPanel(false);
        break;
      default: break;
    }
  }

  _onPanelClick(e) {
    const li = e.target.closest('.hbd-field__option');
    if (!li) return;
    if (li.classList.contains('is-disabled')) return;
    e.stopPropagation();
    this._selectByIndex(parseInt(li.getAttribute('data-index'), 10));
  }

  _onPanelKeydown(e) {
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); this._closePanel(true); return; }
    if (k === 'Tab')    { this._closePanel(false); return; } // let Tab propagate
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      if (this._focusedIndex >= 0) this._selectByIndex(this._focusedIndex);
      return;
    }
    if (k === 'ArrowDown' || k === 'Down') {
      e.preventDefault();
      this._moveFocus(1);
      return;
    }
    if (k === 'ArrowUp' || k === 'Up') {
      e.preventDefault();
      this._moveFocus(-1);
      return;
    }
    if (k === 'Home') {
      e.preventDefault();
      this._setFocusedIndex(this._firstEnabledIndex());
      return;
    }
    if (k === 'End') {
      e.preventDefault();
      this._setFocusedIndex(this._lastEnabledIndex());
      return;
    }
    // Type-to-search: single printable character.
    if (k.length === 1 && /\S/.test(k)) {
      this._typeBuffer += k.toLowerCase();
      if (this._typeTimer) clearTimeout(this._typeTimer);
      this._typeTimer = setTimeout(() => { this._typeBuffer = ''; }, 500);
      const start = (this._focusedIndex + 1) % this._options.length;
      for (let step = 0; step < this._options.length; step++) {
        const i = (start + step) % this._options.length;
        const o = this._options[i];
        if (!o.disabled && o.label.toLowerCase().startsWith(this._typeBuffer)) {
          this._setFocusedIndex(i);
          return;
        }
      }
    }
  }

  _moveFocus(dir) {
    const from = this._focusedIndex >= 0 ? this._focusedIndex : -1;
    const next = this._nextEnabled(from, dir);
    if (next >= 0) this._setFocusedIndex(next);
  }

  _setFocusedIndex(i) {
    if (i < 0) return;
    this._focusedIndex = i;
    // Mutate the existing option <li> nodes in place instead of re-rendering.
    // Re-render would destroy the panel <ul> and abort the open-slide
    // transition AND drop focus mid-keypress.
    const allOptions = this.shadowRoot.querySelectorAll('.hbd-field__option');
    allOptions.forEach((el) => {
      const idx = parseInt(el.getAttribute('data-index'), 10);
      const isFocused = idx === i;
      el.classList.toggle('is-focused', isFocused);
      el.setAttribute('tabindex', isFocused ? '0' : '-1');
    });
    const target = this.shadowRoot.querySelector(`#option-${this._uid}-${i}`);
    if (target) {
      target.focus({ preventScroll: false });
      target.scrollIntoView({ block: 'nearest' });
    }
  }

  // ── Selection ───────────────────────────────────────────────────────
  _selectByIndex(i) {
    const o = this._options[i];
    if (!o || o.disabled) return;
    // Toggle-off: clicking / selecting the already-selected option clears it.
    if (o.value === this._value) {
      this._clearSelection();
      return;
    }
    this._value = o.value;
    this.setAttribute('value', o.value);
    this._internals.setFormValue(o.value);
    // Update only the parts that depend on the new value (trigger chip +
    // native select + each option's aria-selected/is-selected). The panel
    // <ul> node itself is preserved so the close-slide transition runs.
    this._syncTriggerAndOptions(o);
    this._closePanel(true);
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { value: o.value, label: o.label },
      bubbles: true,
      composed: true,
    }));
  }

  // Imperative update for trigger + native select + per-option aria/class
  // when the selection changes. Avoids a full _render() so transitions on
  // the panel can run uninterrupted.
  _syncTriggerAndOptions(selected) {
    const root = this.shadowRoot;
    // 1) Native select (for form submission).
    const native = root.querySelector('.hbd-field__select-native');
    if (native) native.value = selected ? selected.value : '';
    // 2) Each option's aria-selected + .is-selected class.
    root.querySelectorAll('.hbd-field__option').forEach((li) => {
      const matches = selected && li.getAttribute('data-value') === String(selected.value);
      li.classList.toggle('is-selected', !!matches);
      li.setAttribute('aria-selected', matches ? 'true' : 'false');
    });
    // 3) Trigger chip / placeholder. The simplest correct approach is to
    // re-render only the trigger <button>'s inner content (everything from
    // the value span through the chevron). The panel <ul> below it is left
    // untouched, so its slide transition still runs.
    this._rerenderTriggerOnly();
  }

  // Rebuild only the trigger button's inner content + chip-clear handlers,
  // without touching the panel or its children.
  _rerenderTriggerOnly() {
    const trigger = this.shadowRoot.querySelector('.hbd-field__select-trigger');
    if (!trigger) return;
    const selected = this._selectedOption();
    const placeholder = this.getAttribute('placeholder') || '';
    const disabled = this.hasAttribute('disabled');
    const displayText = selected ? selected.label : (placeholder || ' ');
    const valueClass = selected
      ? 'hbd-field__select-value hbd-field__select-value--chip'
      : 'hbd-field__select-value hbd-field__select-value--placeholder';

    const chipHtml = selected
      ? `<span class="hbd-field__select-chip-label">${this._esc(displayText)}</span>`
      : this._esc(displayText);
    const clearHtml = (selected && !disabled) ? `
      <span role="button"
            tabindex="0"
            class="hbd-field__select-chip-clear"
            aria-label="Clear selection, currently ${this._esc(selected.label)}">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </span>` : '';

    trigger.innerHTML = `
      <span class="${valueClass}">${chipHtml}${clearHtml}</span>
      <span class="hbd-field__select-chevron" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    `;

    // Re-wire the chip clear (the span node was just replaced).
    const clear = trigger.querySelector('.hbd-field__select-chip-clear');
    if (clear) {
      clear.addEventListener('pointerdown', this._onClearClick);
      clear.addEventListener('click', this._onClearClick);
      clear.addEventListener('keydown', this._onClearKeydown);
    }
  }

  // Click-outside (uses pointerdown so it fires before the click resolves
  // and before focus moves into the clicked element).
  _onDocPointer(e) {
    if (!e.composedPath().includes(this)) this._closePanel(false);
  }

  // Clear (×) inside chip: clears the value back to the placeholder state.
  // Stops propagation so the pointerdown/click doesn't bubble to the trigger
  // (which would toggle the panel) or to the document outside-click handler.
  _onClearClick(e) {
    e.stopPropagation();
    e.preventDefault();
    this._clearSelection();
  }
  // Keyboard activation for the role="button" chip-clear span.
  _onClearKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    e.preventDefault();
    e.stopPropagation();
    this._clearSelection();
  }

  // Shared clearing path used by the chip × button AND by re-clicking the
  // already-selected option in the open panel (toggle-off behaviour).
  _clearSelection() {
    if (this.hasAttribute('disabled')) return;
    if (this._value === '') return;
    this._value = '';
    this.removeAttribute('value');
    this._internals.setFormValue(null);
    const wasOpen = this._open;
    // Imperative updates only — preserve the panel <ul> so the close-slide
    // transition runs even when clearing.
    this._syncTriggerAndOptions(null);
    if (wasOpen) {
      this._open = false;
      this._removeDocListeners();
      this._setOpenClass(false);
    }
    const trigger = this.shadowRoot.querySelector('.hbd-field__select-trigger');
    if (trigger) trigger.focus({ preventScroll: true });
    if (wasOpen) {
      this.dispatchEvent(new CustomEvent('hbd:close', { bubbles: true, composed: true }));
    }
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { value: '', label: null },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('hbd-select')) {
  customElements.define('hbd-select', HbdSelect);
}
