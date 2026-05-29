// ds/components/hbd-time-picker.js
// Here Be Dragons DS — <hbd-time-picker> custom element (CLAUDE.md §7).
//
// Fully keyboard-accessible time picker (replaces the legacy infinite
// drum-roll). Plain scrollable hour / minute / AM·PM columns with a roving
// tabindex: arrows move focus, Enter/Space select, Home/End jump, Left/Right
// (and Tab) move between columns, Escape closes. A click-to-type hour header
// gives fast numeric entry. Value commits to the HH:MM (24h) `value` attribute
// on Confirm; Clear emits null.

class HbdTimePicker extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['value', 'format', 'minute-step', 'disabled', 'name', 'error', 'placeholder', 'aria-label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._open = false;
    this._h24 = null;
    this._minute = null;
    this._ampm = 'AM';
    this._onDocMouseDown = this._onDocMouseDown.bind(this);
    this._onDocKeydown = this._onDocKeydown.bind(this);
    this._onPanelClick = this._onPanelClick.bind(this);
    this._onPanelKeydown = this._onPanelKeydown.bind(this);
  }

  connectedCallback() {
    this._parseValue();
    this._render();
    this._internals.setFormValue(this._committedValue());
  }

  disconnectedCallback() {
    document.removeEventListener('mousedown', this._onDocMouseDown);
    document.removeEventListener('keydown', this._onDocKeydown);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value') this._parseValue();
    if (this.isConnected) this._render();
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  get _is12() { return (this.getAttribute('format') || '24') === '12'; }
  get _minuteStep() { return parseInt(this.getAttribute('minute-step'), 10) || 1; }
  _toDisp12(h) { return (h % 12) || 12; }
  _toH24(disp, ap) { return ap === 'AM' ? (disp === 12 ? 0 : disp) : (disp === 12 ? 12 : disp + 12); }

  _parseValue() {
    const v = this.getAttribute('value');
    const m = v && /^(\d{1,2}):(\d{2})$/.exec(v);
    if (!m) { this._h24 = null; this._minute = null; return; }
    const h = parseInt(m[1], 10), mn = parseInt(m[2], 10);
    if (h > 23 || mn > 59) { this._h24 = null; this._minute = null; return; }
    this._h24 = h;
    this._minute = mn;
    this._ampm = h >= 12 ? 'PM' : 'AM';
  }

  _hours() {
    return this._is12
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      : Array.from({ length: 24 }, (_, i) => i);
  }
  _minutes() {
    const arr = [];
    for (let m = 0; m < 60; m += this._minuteStep) arr.push(m);
    return arr;
  }
  _committedValue() {
    if (this._h24 === null || this._minute === null) return null;
    return `${String(this._h24).padStart(2, '0')}:${String(this._minute).padStart(2, '0')}`;
  }
  _displayStr() {
    if (this._h24 === null || this._minute === null) return null;
    const mm = String(this._minute).padStart(2, '0');
    if (!this._is12) return `${String(this._h24).padStart(2, '0')}:${mm}`;
    return `${this._toDisp12(this._h24)}:${mm} ${this._h24 >= 12 ? 'PM' : 'AM'}`;
  }
  _selDispHr() {
    if (this._h24 === null) return null;
    return this._is12 ? this._toDisp12(this._h24) : this._h24;
  }

  // ── Render ────────────────────────────────────────────────────────────
  _render() {
    const disabled = this.hasAttribute('disabled');
    const error = this.getAttribute('error');
    const placeholder = this.getAttribute('placeholder') || 'Select the hour…';
    const label = this.getAttribute('aria-label') || 'Time picker';
    const display = this._displayStr();
    const is12 = this._is12;

    const classes = ['hbd-time-picker'];
    if (this._open) classes.push('hbd-time-picker--open');
    if (disabled) classes.push('hbd-time-picker--disabled');
    if (error) classes.push('hbd-time-picker--error');

    const selHr = this._selDispHr();
    const curAmpm = this._h24 !== null ? (this._h24 >= 12 ? 'PM' : 'AM') : this._ampm;
    const headerH = this._h24 !== null ? String(selHr).padStart(2, '0') : '––';
    const headerM = this._minute !== null ? String(this._minute).padStart(2, '0') : '––';

    // Roving tabindex: the selected cell (or the first) is the column's tab stop.
    const hours = this._hours();
    const minutes = this._minutes();
    const hrFocusVal = selHr !== null ? selHr : hours[0];
    const mnFocusVal = this._minute !== null ? this._minute : minutes[0];

    const cell = (val, sel, focusable, type) => `
      <div role="option" aria-selected="${sel}" tabindex="${focusable ? 0 : -1}"
           class="hbd-time-picker__cell${sel ? ' is-selected' : ''}"
           data-type="${type}" data-val="${val}">${String(val).padStart(2, '0')}</div>`;

    const hourCells = hours.map((hr) =>
      cell(hr, selHr === hr, hr === hrFocusVal, 'hour')).join('');
    const minCells = minutes.map((mn) =>
      cell(mn, this._minute === mn, mn === mnFocusVal, 'minute')).join('');

    const ampmCol = is12 ? `
      <div class="hbd-time-picker__divider"></div>
      <div class="hbd-time-picker__ampm">
        <div class="hbd-time-picker__column-label" aria-hidden="true">AM·PM</div>
        <div class="hbd-time-picker__ampm-wrap" role="listbox" aria-label="AM or PM">
          <button type="button" role="option" aria-selected="${curAmpm === 'AM'}" data-ampm="AM"
                  class="hbd-time-picker__ampm-btn${curAmpm === 'AM' ? ' is-active' : ''}">AM</button>
          <button type="button" role="option" aria-selected="${curAmpm === 'PM'}" data-ampm="PM"
                  class="hbd-time-picker__ampm-btn${curAmpm === 'PM' ? ' is-active' : ''}">PM</button>
        </div>
      </div>` : '';

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/tokens/tokens.css">
      <link rel="stylesheet" href="/ds/styles/components/time-picker.css">
      <div class="${classes.join(' ')}">
        <button type="button" class="hbd-time-picker__trigger"
                aria-haspopup="dialog" aria-expanded="${this._open}"
                aria-label="${label}${display ? `, current value ${display}` : ''}"
                ${disabled ? 'disabled' : ''}>
          <span class="hbd-time-picker__trigger-label${display ? '' : ' hbd-time-picker__trigger-label--placeholder'}">${display || placeholder}</span>
          <span class="hbd-time-picker__caret" aria-hidden="true"></span>
        </button>

        <div class="hbd-time-picker__panel" role="dialog" aria-label="${label}" aria-modal="false">
          <div class="hbd-time-picker__header">
            <span class="hbd-time-picker__display-num hbd-time-picker__display-num--editable"
                  role="button" tabindex="0"
                  aria-label="Hour ${headerH}, activate to type" data-edit-hour>${headerH}</span>
            <span class="hbd-time-picker__display-sep" aria-hidden="true">:</span>
            <span class="hbd-time-picker__display-num" aria-label="Minute ${headerM}">${headerM}</span>
            ${is12 ? `<span class="hbd-time-picker__display-ampm">${curAmpm}</span>` : ''}
          </div>

          <div class="hbd-time-picker__columns">
            <div class="hbd-time-picker__column">
              <div class="hbd-time-picker__column-label" id="tp-hr-lbl-${this._uid()}" aria-hidden="true">${is12 ? 'Hour' : 'Hour (24)'}</div>
              <div class="hbd-time-picker__scroll" data-scroll="hour" role="listbox" aria-label="Select hour">${hourCells}</div>
            </div>
            <div class="hbd-time-picker__divider"></div>
            <div class="hbd-time-picker__column">
              <div class="hbd-time-picker__column-label" aria-hidden="true">Min</div>
              <div class="hbd-time-picker__scroll" data-scroll="minute" role="listbox" aria-label="Select minute">${minCells}</div>
            </div>
            ${ampmCol}
          </div>

          <div class="hbd-time-picker__footer">
            <button type="button" class="hbd-time-picker__clear">Clear</button>
            <button type="button" class="hbd-time-picker__confirm">Confirm</button>
          </div>
        </div>

        ${error ? `<span class="hbd-time-picker__error-message" role="alert">${error}</span>` : ''}
      </div>
    `;

    const trigger = this.shadowRoot.querySelector('.hbd-time-picker__trigger');
    trigger.addEventListener('click', () => { if (!disabled) this._openPanel(); });

    if (this._open) {
      const panel = this.shadowRoot.querySelector('.hbd-time-picker__panel');
      panel.addEventListener('click', this._onPanelClick);
      panel.addEventListener('keydown', this._onPanelKeydown);
      // Scroll the active cells into view and move focus into the hour column.
      this._scrollActiveIntoView();
      const firstStop = this.shadowRoot.querySelector('[data-scroll="hour"] .hbd-time-picker__cell[tabindex="0"]');
      if (firstStop) firstStop.focus({ preventScroll: false });
    }
  }

  _uid() {
    if (!this.__uid) this.__uid = Math.random().toString(36).slice(2, 8);
    return this.__uid;
  }

  _scrollActiveIntoView() {
    ['hour', 'minute'].forEach((type) => {
      const col = this.shadowRoot.querySelector(`[data-scroll="${type}"]`);
      if (!col) return;
      const active = col.querySelector('.is-selected') || col.querySelector('.hbd-time-picker__cell[tabindex="0"]');
      if (active) active.scrollIntoView({ block: 'center' });
    });
  }

  // ── Open / close ──────────────────────────────────────────────────────
  _openPanel() {
    if (this._open) return;
    this._open = true;
    this._render();
    // Remove first to guarantee a single registration even if state drifted.
    document.removeEventListener('mousedown', this._onDocMouseDown);
    document.removeEventListener('keydown', this._onDocKeydown);
    document.addEventListener('mousedown', this._onDocMouseDown);
    document.addEventListener('keydown', this._onDocKeydown);
    this.dispatchEvent(new CustomEvent('hbd:open', { bubbles: true, composed: true }));
  }
  _closePanel() {
    // Guard: if already closed, do nothing. Without this, a stray call would
    // re-run the body and yank focus to the trigger.
    if (!this._open) return;

    // Only return focus to the trigger if focus is currently inside this
    // picker (closed via Escape / by clicking away while focused in the panel).
    // If the user clicked an unrelated element, leave focus where they put it.
    const focusWasInside = this.contains(document.activeElement) ||
      (this.shadowRoot.activeElement != null);

    this._open = false;
    document.removeEventListener('mousedown', this._onDocMouseDown);
    document.removeEventListener('keydown', this._onDocKeydown);
    this._render();

    if (focusWasInside) {
      const trigger = this.shadowRoot.querySelector('.hbd-time-picker__trigger');
      if (trigger) trigger.focus({ preventScroll: true });
    }
    this.dispatchEvent(new CustomEvent('hbd:close', { bubbles: true, composed: true }));
  }

  _onDocMouseDown(e) {
    if (!e.composedPath().includes(this)) this._closePanel();
  }
  _onDocKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); this._closePanel(); }
  }

  // ── Roving-tabindex keyboard navigation inside the panel ───────────────
  _onPanelKeydown(e) {
    const cell = e.target.closest('.hbd-time-picker__cell');
    if (!cell) return; // header input / buttons handle their own keys
    const col = cell.parentElement;
    const cells = Array.from(col.querySelectorAll('.hbd-time-picker__cell'));
    const i = cells.indexOf(cell);

    const moveTo = (next) => {
      if (!next) return;
      cells.forEach((c) => c.setAttribute('tabindex', '-1'));
      next.setAttribute('tabindex', '0');
      next.focus();
      next.scrollIntoView({ block: 'nearest' });
    };
    const moveColumn = (dir) => {
      const scrolls = Array.from(this.shadowRoot.querySelectorAll('[data-scroll]'));
      const colIdx = scrolls.indexOf(col);
      const target = scrolls[colIdx + dir];
      if (!target) return;
      const stop = target.querySelector('.hbd-time-picker__cell[tabindex="0"]') ||
                   target.querySelector('.hbd-time-picker__cell');
      if (stop) { stop.focus(); stop.scrollIntoView({ block: 'nearest' }); }
    };

    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); moveTo(cells[Math.min(i + 1, cells.length - 1)]); break;
      case 'ArrowUp':   e.preventDefault(); moveTo(cells[Math.max(i - 1, 0)]); break;
      case 'Home':      e.preventDefault(); moveTo(cells[0]); break;
      case 'End':       e.preventDefault(); moveTo(cells[cells.length - 1]); break;
      case 'ArrowRight': e.preventDefault(); moveColumn(1); break;
      case 'ArrowLeft':  e.preventDefault(); moveColumn(-1); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._selectCell(cell);
        break;
      default: break;
    }
  }

  // ── Selection ───────────────────────────────────────────────────────────
  _onPanelClick(e) {
    const cell = e.target.closest('.hbd-time-picker__cell');
    if (cell) { this._selectCell(cell); return; }
    const ampm = e.target.closest('.hbd-time-picker__ampm-btn');
    if (ampm) { this._selectAmpm(ampm.getAttribute('data-ampm')); return; }
    if (e.target.closest('.hbd-time-picker__clear')) { this._clear(); return; }
    if (e.target.closest('.hbd-time-picker__confirm')) { this._confirm(); return; }
    if (e.target.closest('[data-edit-hour]')) { this._editHour(); return; }
  }

  _selectCell(cell) {
    const val = parseInt(cell.getAttribute('data-val'), 10);
    const type = cell.getAttribute('data-type');
    if (type === 'hour') this._selectHour(val);
    else this._selectMinute(val);
  }

  _selectHour(v) {
    this._h24 = this._is12 ? this._toH24(v, this._ampm) : v;
    this._render();
    this._refocus('hour', v);
  }
  _selectMinute(v) {
    this._minute = v;
    this._render();
    this._refocus('minute', v);
  }
  _selectAmpm(ap) {
    this._ampm = ap;
    if (this._h24 !== null) this._h24 = this._toH24(this._toDisp12(this._h24), ap);
    this._render();
    const btn = this.shadowRoot.querySelector(`.hbd-time-picker__ampm-btn[data-ampm="${ap}"]`);
    if (btn) btn.focus();
  }

  // Re-focus the cell for `val` after a re-render (keeps keyboard position).
  _refocus(type, val) {
    const sel = `[data-scroll="${type}"] .hbd-time-picker__cell[data-val="${val}"]`;
    const el = this.shadowRoot.querySelector(sel);
    if (el) {
      const col = el.parentElement;
      col.querySelectorAll('.hbd-time-picker__cell').forEach((c) => c.setAttribute('tabindex', '-1'));
      el.setAttribute('tabindex', '0');
      el.focus();
    }
  }

  _editHour() {
    const headerNum = this.shadowRoot.querySelector('[data-edit-hour]');
    if (!headerNum) return;
    const cur = this._selDispHr() !== null ? this._selDispHr() : '';
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 2;
    input.value = String(cur);
    input.className = 'hbd-time-picker__header-input';
    input.setAttribute('aria-label', `Type hour, ${this._is12 ? '1 to 12' : '0 to 23'}`);
    headerNum.replaceWith(input);
    input.focus();
    input.select();
    const commit = () => this._commitHrDraft(input.value);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.stopPropagation(); commit(); }
      if (e.key === 'Escape') { e.stopPropagation(); this._render(); }
    });
    input.addEventListener('blur', commit);
  }

  _commitHrDraft(raw) {
    const n = parseInt((raw || '').trim(), 10);
    if (isNaN(n)) { this._render(); return; }
    if (this._is12) {
      if (n < 1 || n > 12) { this._render(); return; }
      this._h24 = this._toH24(n, this._ampm);
    } else {
      if (n < 0 || n > 23) { this._render(); return; }
      this._h24 = n;
    }
    this._render();
  }

  _confirm() {
    const val = this._committedValue();
    if (val !== null) {
      this.setAttribute('value', val);
      this._internals.setFormValue(val);
      this.dispatchEvent(new CustomEvent('hbd:change', {
        detail: { value: val }, bubbles: true, composed: true,
      }));
    }
    this._closePanel();
  }

  _clear() {
    this._h24 = null;
    this._minute = null;
    this._ampm = 'AM';
    this.removeAttribute('value');
    this._internals.setFormValue(null);
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { value: null }, bubbles: true, composed: true,
    }));
    this._closePanel();
  }
}

if (!customElements.get('hbd-time-picker')) {
  customElements.define('hbd-time-picker', HbdTimePicker);
}
