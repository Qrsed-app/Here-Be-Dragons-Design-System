// ds/components/hbd-radio-group.js
// Here Be Dragons DS — <hbd-radio-group> + <hbd-radio> custom elements.
//
// The radio GROUP is the primary unit (CLAUDE.md §7 / ARIA radiogroup
// pattern). A lone <hbd-radio> is invalid. Authors write:
//
//   <hbd-radio-group name="…" label="…" value="x">
//     <hbd-radio value="x" label="X"></hbd-radio>
//     <hbd-radio value="y" label="Y"></hbd-radio>
//   </hbd-radio-group>
//
// <hbd-radio> is a Light-DOM data carrier (parallel to <hbd-option> inside
// hbd-select.js): no Shadow DOM, no styles, no behaviour. The group reads
// its children and renders the visible radios into its own shadow root.
//
// Styles: adopted stylesheets (../utils/shared-styles.js) — input.css + the
// checkbox.css label/hint rules (shared selector). No <link> tags, no FOUC
// on re-render.
//
// Keyboard model: ARIA roving tabindex.
//   - Exactly one radio is tabbable at a time (the checked one, or the
//     first enabled one if nothing is checked).
//   - ArrowDown/Right → next enabled radio + immediate selection.
//   - ArrowUp/Left    → previous enabled radio + immediate selection.
//   - Home/End        → first/last enabled radio + selection.
//   - Tab is NOT intercepted — it moves focus out of the group.

import { adoptStyles } from '../utils/shared-styles.js';

let uidCounter = 0;

// ── Companion element — data carrier only. ───────────────────────────
class HbdRadio extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'label', 'hint', 'disabled', 'checked'];
  }
}
if (!customElements.get('hbd-radio')) {
  customElements.define('hbd-radio', HbdRadio);
}

class HbdRadioGroup extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'name', 'value', 'label', 'hint', 'error',
      'required', 'disabled', 'orientation',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-radio-group-${++uidCounter}`;
    this._value = this.getAttribute('value') || '';
    this._options = [];
    this._ready = false;
    this._mo = null;
    this._onChange = this._onChange.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/foundations/accessibility.css',
      '/ds/styles/components/checkbox.css',   // shared label/hint selectors
      '/ds/styles/components/input.css',
    ]);

    this._readOptions();
    // If no value attr but one child is marked checked, adopt it.
    if (!this._value) {
      const initial = this._options.find((o) => o.checked && !o.disabled);
      if (initial) this._value = initial.value;
    }
    this._ready = true;
    this._render();
    this._internals.setFormValue(this._value || null);

    // Watch for added/removed/changed <hbd-radio> children. Ignore mutations
    // on the host itself (host attribute changes go through
    // attributeChangedCallback and would otherwise double-render).
    this._mo = new MutationObserver((muts) => {
      const childChanged = muts.some((m) => m.target !== this);
      if (!childChanged) return;
      this._readOptions();
      this._render();
    });
    this._mo.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value', 'label', 'hint', 'disabled', 'checked'],
    });
  }

  disconnectedCallback() {
    if (this._mo) { this._mo.disconnect(); this._mo = null; }
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value') this._value = newVal || '';
    if (this._ready && this.isConnected) this._render();
  }

  // ── Public reflection ───────────────────────────────────────────────
  get value() { return this._value; }
  set value(v) {
    this._value = v == null ? '' : String(v);
    this.setAttribute('value', this._value);
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _readOptions() {
    this._options = Array.from(this.querySelectorAll('hbd-radio')).map((el, i) => ({
      value: el.getAttribute('value') || el.textContent.trim(),
      label: el.getAttribute('label') || el.textContent.trim(),
      hint: el.getAttribute('hint') || '',
      disabled: el.hasAttribute('disabled'),
      checked: el.hasAttribute('checked'),
      index: i,
    }));
  }

  _enabledOptions() {
    return this._options.filter((o) => !o.disabled);
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
  // dir: +1 or -1, wraps. Returns index of next enabled radio after `from`.
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
  _indexOfValue(v) {
    return this._options.findIndex((o) => o.value === v);
  }
  // The radio that should hold tabindex=0: the currently selected enabled
  // option, or — if nothing selected / selected is disabled — the first
  // enabled option. Returns -1 if there are no enabled radios.
  _tabbableIndex() {
    const sel = this._indexOfValue(this._value);
    if (sel >= 0 && !this._options[sel].disabled) return sel;
    return this._firstEnabledIndex();
  }

  _removeListeners() {
    const options = this.shadowRoot.querySelector('.hbd-radio-group__options');
    if (options) {
      options.removeEventListener('change', this._onChange);
      options.removeEventListener('keydown', this._onKeydown);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const name = this.getAttribute('name') || uid;
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint');
    const error = this.getAttribute('error');
    const required = this.hasAttribute('required');
    const disabled = this.hasAttribute('disabled');
    const horizontal = this.getAttribute('orientation') === 'horizontal';

    const hasError = error != null && error !== '';
    const hasHint = hint != null && hint !== '';

    const fieldsetClasses = ['hbd-radio-group'];
    if (hasError) fieldsetClasses.push('hbd-radio-group--error');

    const optionsClasses = ['hbd-radio-group__options'];
    if (horizontal) optionsClasses.push('hbd-radio-group__options--horizontal');

    const tabbable = this._tabbableIndex();

    const radiosHtml = this._options.map((o) => {
      const inputId = `radio-${uid}-${o.index}`;
      const hintId = `radio-hint-${uid}-${o.index}`;
      const isChecked = o.value === this._value;
      const isDisabled = disabled || o.disabled;
      const labelClasses = ['hbd-radio'];
      if (isChecked) labelClasses.push('hbd-radio--checked');
      if (isDisabled) labelClasses.push('hbd-radio--disabled');
      // tabindex: only the currently-tabbable enabled radio gets 0.
      const tabindex = (o.index === tabbable) ? '0' : '-1';
      return `
        <label class="${labelClasses.join(' ')}">
          <input
            class="hbd-radio__input"
            type="radio"
            name="${this._esc(name)}"
            value="${this._esc(o.value)}"
            id="${inputId}"
            data-index="${o.index}"
            tabindex="${tabindex}"
            ${o.hint ? `aria-describedby="${hintId}"` : ''}
            ${isChecked ? 'checked' : ''}
            ${isDisabled ? 'disabled' : ''}
            ${required ? 'aria-required="true"' : ''}>
          <span class="hbd-radio__control" aria-hidden="true"></span>
          <span class="hbd-radio__label-wrap">
            <span class="hbd-radio__label">${this._esc(o.label)}</span>
            ${o.hint ? `<span class="hbd-radio__hint" id="${hintId}">${this._esc(o.hint)}</span>` : ''}
          </span>
        </label>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <fieldset class="${fieldsetClasses.join(' ')}" ${disabled ? 'disabled' : ''}>
        ${label ? `<legend class="hbd-radio-group__legend" id="legend-${uid}">${this._esc(label)}${required ? ' <span aria-hidden="true">*</span>' : ''}</legend>` : ''}
        <div class="${optionsClasses.join(' ')}"
             role="radiogroup"
             id="options-${uid}"
             ${label ? `aria-labelledby="legend-${uid}"` : ''}
             ${required ? 'aria-required="true"' : ''}
             ${hasError ? 'aria-invalid="true"' : ''}>
          ${radiosHtml}
        </div>
        ${(hasHint || hasError) ? `
          ${hasHint ? `<span class="hbd-radio-group__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
          ${hasError ? `<span class="hbd-radio-group__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
        ` : ''}
      </fieldset>
    `;

    // Wire listeners.
    const options = this.shadowRoot.querySelector('.hbd-radio-group__options');
    if (options) {
      options.addEventListener('change', this._onChange);
      options.addEventListener('keydown', this._onKeydown);
    }
  }

  // ── Events ──────────────────────────────────────────────────────────
  // Native change event (click / Space activation) — picks the input that fired.
  _onChange(e) {
    const input = e.target.closest('input[type="radio"]');
    if (!input || input.disabled) return;
    const idx = parseInt(input.getAttribute('data-index'), 10);
    if (Number.isNaN(idx)) return;
    this._selectIndex(idx, false); // focus stays where the click landed
  }

  // Arrow / Home / End on the options container — roving tabindex.
  _onKeydown(e) {
    // Only handle keys when focus is on one of our radio inputs.
    const target = e.target.closest('.hbd-radio__input');
    if (!target) return;
    const currentIdx = parseInt(target.getAttribute('data-index'), 10);
    if (Number.isNaN(currentIdx)) return;

    let nextIdx = -1;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIdx = this._nextEnabled(currentIdx, 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIdx = this._nextEnabled(currentIdx, -1);
        break;
      case 'Home':
        e.preventDefault();
        nextIdx = this._firstEnabledIndex();
        break;
      case 'End':
        e.preventDefault();
        nextIdx = this._lastEnabledIndex();
        break;
      default:
        return;
    }
    if (nextIdx >= 0 && nextIdx !== currentIdx) {
      this._selectIndex(nextIdx, true);
    }
  }

  // Commit selection + sync DOM in place (no full _render) so focus stays
  // where the user put it and there's no flicker.
  // moveFocus=true → move browser focus to the newly-selected input.
  _selectIndex(idx, moveFocus) {
    const o = this._options[idx];
    if (!o || o.disabled || this.hasAttribute('disabled')) return;

    this._value = o.value;
    this.setAttribute('value', o.value);
    this._internals.setFormValue(o.value);

    const root = this.shadowRoot;
    const inputs = root.querySelectorAll('.hbd-radio__input');
    inputs.forEach((input) => {
      const i = parseInt(input.getAttribute('data-index'), 10);
      const isChecked = i === idx;
      input.checked = isChecked;
      input.setAttribute('tabindex', isChecked ? '0' : '-1');
      // Toggle modifier class on the parent <label> for visual state.
      const label = input.closest('.hbd-radio');
      if (label) label.classList.toggle('hbd-radio--checked', isChecked);
    });

    if (moveFocus) {
      const target = root.querySelector(`input[data-index="${idx}"]`);
      if (target) target.focus({ preventScroll: false });
    }

    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { value: o.value, name: this.getAttribute('name') },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('hbd-radio-group')) {
  customElements.define('hbd-radio-group', HbdRadioGroup);
}
