// ds/components/hbd-date-picker.js
// Here Be Dragons DS — <hbd-date-picker> custom element (CLAUDE.md §7).
//
// Three variants: "date" (single), "date-time" (single + time picker
// slotted into the panel footer), "date-range" (start + end). Uses native
// Intl.DateTimeFormat for locale-aware month/weekday/aria-label text and
// plain Date arithmetic for navigation. No external date library — the
// no-npm/no-bundler constraint precludes it; Temporal isn't broadly
// available enough to depend on.
//
// Shadow DOM. Styles via adopted stylesheets (../utils/shared-styles.js).
//
// Calendar grid follows the APG grid pattern: role="grid" with roving
// tabindex on cells. Arrows / Home / End / PageUp / PageDown navigate;
// Enter/Space selects; Escape closes. Only one cell carries tabindex=0
// at any moment; the others are -1 and reached via DOM focus moves.

import { adoptStyles } from '../utils/shared-styles.js';

let uidCounter = 0;

// ── Date helpers (no external library) ────────────────────────────────
function parseISODate(s) {
  if (!s || typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return Number.isNaN(d.getTime()) ? null : d;
}
// Local Y-M-D (not toISOString — which converts to UTC and can shift the day).
function toISODate(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function sameDay(a, b) {
  return !!a && !!b
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function addMonths(d, n) {
  const target = new Date(d); target.setDate(1);
  target.setMonth(target.getMonth() + n);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return target;
}
function clampToRange(d, min, max) {
  if (!d) return d;
  if (min && d < min) return new Date(min);
  if (max && d > max) return new Date(max);
  return d;
}
function diffDays(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ua - ub) / ms);
}

class HbdDatePicker extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'value', 'value-start', 'value-end', 'variant',
      'min', 'max', 'disabled', 'required',
      'label', 'hint', 'error', 'name', 'placeholder',
      'locale', 'first-day', 'format',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-date-picker-${++uidCounter}`;

    // Saved (committed) state — what the host form sees and what renders on
    // the trigger.
    this._value = parseISODate(this.getAttribute('value'));
    this._valueStart = parseISODate(this.getAttribute('value-start'));
    this._valueEnd = parseISODate(this.getAttribute('value-end'));
    this._time = null;                 // 'HH:MM' for date-time variant

    // Pending (open-panel) state — what the user is currently picking but
    // hasn't committed yet. Outside-click and Apply commit; Cancel discards.
    this._pendingValue = null;
    this._pendingStart = null;
    this._pendingEnd = null;
    this._pendingTime = null;

    this._isOpen = false;
    this._selectingEnd = false;
    this._hoveredDate = null;          // for range hover-preview while picking end
    this._currentMonth = startOfMonth(
      this._value || this._valueStart || new Date()
    );
    this._focusedDate = this._value || this._valueStart || new Date();
    this._ready = false;

    // Bound handlers.
    this._onTriggerClick = this._onTriggerClick.bind(this);
    this._onTriggerKeydown = this._onTriggerKeydown.bind(this);
    this._onPanelClick = this._onPanelClick.bind(this);
    this._onGridKeydown = this._onGridKeydown.bind(this);
    this._onGridMouseOver = this._onGridMouseOver.bind(this);
    this._onGridMouseLeave = this._onGridMouseLeave.bind(this);
    this._onPrevMonth = this._onPrevMonth.bind(this);
    this._onNextMonth = this._onNextMonth.bind(this);
    this._onTodayClick = this._onTodayClick.bind(this);
    this._onClearClick = this._onClearClick.bind(this);
    this._onCancelClick = this._onCancelClick.bind(this);
    this._onConfirmClick = this._onConfirmClick.bind(this);
    this._onTimeChange = this._onTimeChange.bind(this);
    this._onDocPointer = this._onDocPointer.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/foundations/accessibility.css',
      '/ds/styles/components/input.css',
      '/ds/styles/components/date-picker.css',
    ]);
    this._ready = true;
    this._render();
    this._syncFormValue();
  }

  disconnectedCallback() {
    this._removeDocListeners();
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value') this._value = parseISODate(newVal);
    if (name === 'value-start') this._valueStart = parseISODate(newVal);
    if (name === 'value-end') this._valueEnd = parseISODate(newVal);
    if (this._ready && this.isConnected) this._render();
  }

  // ── Public API ─────────────────────────────────────────────────────
  get value() { return this._value ? toISODate(this._value) : ''; }
  set value(v) { this.setAttribute('value', v == null ? '' : String(v)); }
  get valueStart() { return this._valueStart ? toISODate(this._valueStart) : ''; }
  set valueStart(v) { this.setAttribute('value-start', v == null ? '' : String(v)); }
  get valueEnd() { return this._valueEnd ? toISODate(this._valueEnd) : ''; }
  set valueEnd(v) { this.setAttribute('value-end', v == null ? '' : String(v)); }

  // ── Helpers ────────────────────────────────────────────────────────
  get _variant() {
    const v = (this.getAttribute('variant') || 'date').toLowerCase();
    return ['date', 'date-time', 'date-range'].includes(v) ? v : 'date';
  }
  get _isRange() { return this._variant === 'date-range'; }
  get _isDateTime() { return this._variant === 'date-time'; }

  get _locale() {
    return this.getAttribute('locale') || (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
  }
  get _firstDay() {
    const explicit = this.getAttribute('first-day');
    if (explicit !== null && explicit !== '') {
      const n = parseInt(explicit, 10);
      if (Number.isFinite(n) && n >= 0 && n <= 6) return n;
    }
    // Try Intl.Locale.weekInfo (Chromium-only at time of writing).
    try {
      const loc = new Intl.Locale(this._locale);
      const wi = loc.weekInfo || (typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : null);
      if (wi && Number.isFinite(wi.firstDay)) {
        // Intl returns 1–7 where 1=Mon, 7=Sun; convert to 0=Sun…6=Sat.
        return wi.firstDay === 7 ? 0 : wi.firstDay;
      }
    } catch { /* fall through */ }
    return 1; // Monday default
  }
  get _min() { return parseISODate(this.getAttribute('min')); }
  get _max() { return parseISODate(this.getAttribute('max')); }
  get _formatOptions() {
    const raw = this.getAttribute('format');
    if (raw) {
      try { return JSON.parse(raw); }
      catch { /* fall through */ }
    }
    return { year: 'numeric', month: 'long', day: 'numeric' };
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  _describedBy(ids) { return ids.filter(Boolean).join(' '); }

  _isDisabledDate(d) {
    if (!d) return false;
    const min = this._min, max = this._max;
    if (min && d < min) return true;
    if (max && d > max) return true;
    return false;
  }

  _formatDisplay(d) {
    if (!d) return '';
    return new Intl.DateTimeFormat(this._locale, this._formatOptions).format(d);
  }
  _formatMonthYear(d) {
    return new Intl.DateTimeFormat(this._locale, { year: 'numeric', month: 'long' }).format(d);
  }
  _formatCellLabel(d) {
    return new Intl.DateTimeFormat(this._locale, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(d);
  }
  _weekdayLabels() {
    // Pick a reference Sunday (2024-01-07 was a Sunday) and rotate to first-day.
    const base = new Date(2024, 0, 7);
    const labels = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(base, (this._firstDay + i) % 7);
      labels.push(new Intl.DateTimeFormat(this._locale, { weekday: 'short' }).format(d));
    }
    return labels;
  }

  _removeListeners() {
    const root = this.shadowRoot;
    const trig = root.querySelector('.hbd-date-picker__trigger');
    if (trig) {
      trig.removeEventListener('click', this._onTriggerClick);
      trig.removeEventListener('keydown', this._onTriggerKeydown);
    }
    const panel = root.querySelector('.hbd-date-picker__panel');
    if (panel) panel.removeEventListener('click', this._onPanelClick);
    const grid = root.querySelector('.hbd-date-picker__grid');
    if (grid) {
      grid.removeEventListener('keydown', this._onGridKeydown);
      grid.removeEventListener('mouseover', this._onGridMouseOver);
      grid.removeEventListener('mouseleave', this._onGridMouseLeave);
    }
    const prev = root.querySelector('[data-nav="prev"]');
    if (prev) prev.removeEventListener('click', this._onPrevMonth);
    const next = root.querySelector('[data-nav="next"]');
    if (next) next.removeEventListener('click', this._onNextMonth);
    const today = root.querySelector('[data-action="today"]');
    if (today) today.removeEventListener('click', this._onTodayClick);
    const clear = root.querySelector('[data-action="clear"]');
    if (clear) clear.removeEventListener('click', this._onClearClick);
    const cancel = root.querySelector('[data-action="cancel"]');
    if (cancel) cancel.removeEventListener('click', this._onCancelClick);
    const confirmBtn = root.querySelector('[data-action="confirm"]');
    if (confirmBtn) confirmBtn.removeEventListener('click', this._onConfirmClick);
    const time = root.querySelector('hbd-time-picker');
    if (time) time.removeEventListener('hbd:change', this._onTimeChange);
  }
  _addDocListeners() {
    document.addEventListener('pointerdown', this._onDocPointer, true);
  }
  _removeDocListeners() {
    document.removeEventListener('pointerdown', this._onDocPointer, true);
  }

  _syncFormValue() {
    if (this._isRange) {
      const payload = (this._valueStart || this._valueEnd) ? JSON.stringify({
        start: this._valueStart ? toISODate(this._valueStart) : null,
        end: this._valueEnd ? toISODate(this._valueEnd) : null,
      }) : null;
      this._internals.setFormValue(payload);
    } else if (this._isDateTime && this._value && this._time) {
      this._internals.setFormValue(`${toISODate(this._value)}T${this._time}`);
    } else {
      this._internals.setFormValue(this._value ? toISODate(this._value) : null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint');
    const error = this.getAttribute('error');
    const placeholder = this.getAttribute('placeholder') || 'Select a date';
    const required = this.hasAttribute('required');
    const disabled = this.hasAttribute('disabled');

    const hasError = error != null && error !== '';
    const hasHint = hint != null && hint !== '';

    const fieldClasses = ['hbd-field'];
    if (hasError) fieldClasses.push('hbd-field--error');
    if (disabled) fieldClasses.push('hbd-field--disabled');

    const dpClasses = ['hbd-date-picker'];
    if (this._isOpen) dpClasses.push('hbd-date-picker--open');
    if (disabled) dpClasses.push('hbd-date-picker--disabled');
    if (hasError) dpClasses.push('hbd-date-picker--error');
    if (this._isRange) dpClasses.push('hbd-date-picker--range');
    if (this._isDateTime) dpClasses.push('hbd-date-picker--datetime');

    const describedBy = this._describedBy([
      hasHint ? `hint-${uid}` : '',
      hasError ? `error-${uid}` : '',
    ]);

    const displayText = this._triggerDisplayText() || placeholder;
    const isPlaceholder = !this._triggerDisplayText();

    this.shadowRoot.innerHTML = `
      <div class="${fieldClasses.join(' ')}">
        ${label ? `
        <label class="hbd-field__label" id="label-${uid}" for="trigger-${uid}">
          ${this._esc(label)}${required ? `<span class="hbd-field__label-required" aria-hidden="true">*</span>` : ''}
        </label>` : ''}

        <div class="${dpClasses.join(' ')}">
          <button type="button"
                  id="trigger-${uid}"
                  class="hbd-date-picker__trigger"
                  ${label ? `aria-labelledby="label-${uid}"` : ''}
                  aria-haspopup="dialog"
                  aria-expanded="${this._isOpen ? 'true' : 'false'}"
                  aria-controls="panel-${uid}"
                  ${required ? 'aria-required="true"' : ''}
                  ${hasError ? 'aria-invalid="true"' : ''}
                  ${describedBy ? `aria-describedby="${describedBy}"` : ''}
                  ${disabled ? 'disabled' : ''}>
            <span class="hbd-date-picker__trigger-value${isPlaceholder ? ' hbd-date-picker__trigger-value--placeholder' : ''}">${this._esc(displayText)}</span>
            <span class="hbd-date-picker__trigger-icon" aria-hidden="true">${this._iconCalendar()}</span>
          </button>

          <div class="hbd-date-picker__panel"
               id="panel-${uid}"
               role="dialog"
               aria-modal="false"
               ${label ? `aria-labelledby="label-${uid}"` : ''}>
            ${this._panelHtml()}
          </div>
        </div>

        <div class="hbd-field__footer">
          ${hasHint ? `<span class="hbd-field__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
          ${hasError ? `<span class="hbd-field__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
        </div>
      </div>
    `;

    this._wireListeners();
    if (this._isOpen) this._focusFocusedCell();
  }

  _triggerDisplayText() {
    if (this._isRange) {
      const s = this._valueStart ? this._formatDisplay(this._valueStart) : '';
      const e = this._valueEnd ? this._formatDisplay(this._valueEnd) : '';
      if (!s && !e) return '';
      if (s && e) return `${s} – ${e}`;
      return s || e;
    }
    if (this._isDateTime && this._value && this._time) {
      return `${this._formatDisplay(this._value)} · ${this._time}`;
    }
    return this._value ? this._formatDisplay(this._value) : '';
  }

  _panelHtml() {
    const uid = this._uid;
    const monthLabel = this._formatMonthYear(this._currentMonth);
    const weekdays = this._weekdayLabels();
    const cells = this._buildGrid();

    const minNav = this._min ? new Date(this._min.getFullYear(), this._min.getMonth(), 1) : null;
    const maxNav = this._max ? new Date(this._max.getFullYear(), this._max.getMonth(), 1) : null;
    const prevDisabled = minNav && this._currentMonth <= minNav;
    const nextDisabled = maxNav && this._currentMonth >= maxNav;

    const weekdayCells = weekdays.map((w) =>
      `<div class="hbd-date-picker__weekday" role="columnheader" aria-label="${this._esc(w)}">${this._esc(w)}</div>`
    ).join('');

    const cellHtml = cells.map((c) => this._cellHtml(c, uid)).join('');

    const timeSlot = this._isDateTime ? `
      <div class="hbd-date-picker__time-slot">
        <hbd-time-picker
          ${this._time ? `value="${this._esc(this._time)}"` : ''}
          aria-label="Time of day"></hbd-time-picker>
      </div>` : '';

    return `
      <div class="hbd-date-picker__header">
        <button type="button" class="hbd-date-picker__nav-btn"
                data-nav="prev" aria-label="Previous month"
                ${prevDisabled ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="hbd-date-picker__month-label" id="month-label-${uid}" aria-live="polite">${this._esc(monthLabel)}</span>
        <button type="button" class="hbd-date-picker__nav-btn"
                data-nav="next" aria-label="Next month"
                ${nextDisabled ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="hbd-date-picker__weekdays" role="row">
        ${weekdayCells}
      </div>

      <div class="hbd-date-picker__grid" role="grid" aria-labelledby="month-label-${uid}">
        ${cellHtml}
      </div>

      <div class="hbd-date-picker__footer">
        <div class="hbd-date-picker__footer-group">
          <button type="button" class="hbd-date-picker__footer-btn hbd-date-picker__footer-btn--muted" data-action="today">Today</button>
          <button type="button" class="hbd-date-picker__footer-btn hbd-date-picker__footer-btn--muted" data-action="clear">Clear</button>
        </div>
        <div class="hbd-date-picker__footer-group">
          <button type="button" class="hbd-date-picker__footer-btn hbd-date-picker__footer-btn--muted" data-action="cancel">Cancel</button>
          <button type="button" class="hbd-date-picker__footer-btn" data-action="confirm">Confirm</button>
        </div>
      </div>

      ${timeSlot}
    `;
  }

  _buildGrid() {
    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const firstWeekday = first.getDay();          // 0–6 Sun..Sat
    const offset = (firstWeekday - this._firstDay + 7) % 7;
    const gridStart = addDays(first, -offset);

    const today = new Date();
    // While the panel is open the grid reflects PENDING state. While closed
    // it reflects the committed (saved) value.
    const valSingle = this._isOpen ? this._pendingValue : this._value;
    let rangeStart = this._isOpen ? this._pendingStart : this._valueStart;
    let rangeEnd = this._isOpen ? this._pendingEnd : this._valueEnd;
    // Range hover preview — while picking the end, treat the hovered date
    // as a provisional end so the in-range run renders dynamically.
    let previewEnd = null;
    if (this._isRange && this._isOpen && this._selectingEnd
        && rangeStart && this._hoveredDate
        && !sameDay(this._hoveredDate, rangeStart)) {
      previewEnd = this._hoveredDate;
    }
    // For hover preview, normalise so start < end (auto-swap visual).
    let effStart = rangeStart;
    let effEnd = rangeEnd || previewEnd;
    if (effStart && effEnd && effEnd < effStart) {
      const t = effStart; effStart = effEnd; effEnd = t;
    }

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
      const isRangeStart = this._isRange && sameDay(d, effStart);
      const isRangeEnd = this._isRange && sameDay(d, effEnd);
      const inRange = this._isRange && effStart && effEnd
        && d > effStart && d < effEnd;
      const isPreviewEnd = !!previewEnd && sameDay(d, previewEnd);
      const isSelected = this._isRange
        ? (isRangeStart || isRangeEnd)
        : sameDay(d, valSingle);

      cells.push({
        date: d,
        isOutsideMonth: d.getMonth() !== month,
        isToday: sameDay(d, today),
        isDisabled: this._isDisabledDate(d),
        isSelected,
        isRangeStart,
        isRangeEnd,
        isInRange: inRange,
        isPreviewEnd,
        isFocused: sameDay(d, this._focusedDate),
      });
    }
    return cells;
  }

  _cellHtml(c, uid) {
    const iso = toISODate(c.date);
    const cls = ['hbd-date-picker__cell'];
    if (c.isToday) cls.push('is-today');
    if (c.isSelected) cls.push('is-selected');
    if (c.isOutsideMonth) cls.push('is-outside-month');
    if (c.isDisabled) cls.push('is-disabled');
    if (c.isInRange) cls.push('is-in-range');
    if (c.isRangeStart) cls.push('is-range-start');
    if (c.isRangeEnd) cls.push('is-range-end');
    if (c.isFocused) cls.push('is-focused');

    const ariaSelected = c.isSelected ? 'true' : 'false';
    const ariaCurrent = c.isToday ? 'date' : '';
    const baseLabel = this._formatCellLabel(c.date);
    let ariaLabel = baseLabel;
    if (this._isRange) {
      if (c.isRangeStart) ariaLabel = `Start: ${baseLabel}`;
      else if (c.isRangeEnd) ariaLabel = `End: ${baseLabel}`;
      else if (this._selectingEnd) ariaLabel = `End date, ${baseLabel}`;
      else ariaLabel = `Start date, ${baseLabel}`;
    }
    const tabindex = c.isFocused ? '0' : '-1';

    return `
      <div class="${cls.join(' ')}"
           role="gridcell"
           aria-selected="${ariaSelected}"
           ${ariaCurrent ? `aria-current="${ariaCurrent}"` : ''}
           ${c.isDisabled ? 'aria-disabled="true"' : ''}>
        <button type="button"
                class="hbd-date-picker__cell-inner"
                tabindex="${tabindex}"
                data-date="${iso}"
                aria-label="${this._esc(ariaLabel)}"
                ${c.isDisabled ? 'disabled' : ''}>
          ${c.date.getDate()}
        </button>
      </div>
    `;
  }

  _wireListeners() {
    const root = this.shadowRoot;
    const trig = root.querySelector('.hbd-date-picker__trigger');
    trig.addEventListener('click', this._onTriggerClick);
    trig.addEventListener('keydown', this._onTriggerKeydown);

    const panel = root.querySelector('.hbd-date-picker__panel');
    if (panel) panel.addEventListener('click', this._onPanelClick);

    const grid = root.querySelector('.hbd-date-picker__grid');
    if (grid) {
      grid.addEventListener('keydown', this._onGridKeydown);
      grid.addEventListener('mouseover', this._onGridMouseOver);
      grid.addEventListener('mouseleave', this._onGridMouseLeave);
    }

    const prev = root.querySelector('[data-nav="prev"]');
    if (prev) prev.addEventListener('click', this._onPrevMonth);
    const next = root.querySelector('[data-nav="next"]');
    if (next) next.addEventListener('click', this._onNextMonth);
    const today = root.querySelector('[data-action="today"]');
    if (today) today.addEventListener('click', this._onTodayClick);
    const clear = root.querySelector('[data-action="clear"]');
    if (clear) clear.addEventListener('click', this._onClearClick);
    const cancel = root.querySelector('[data-action="cancel"]');
    if (cancel) cancel.addEventListener('click', this._onCancelClick);
    const confirmBtn = root.querySelector('[data-action="confirm"]');
    if (confirmBtn) confirmBtn.addEventListener('click', this._onConfirmClick);

    const time = root.querySelector('hbd-time-picker');
    if (time) time.addEventListener('hbd:change', this._onTimeChange);
  }

  // ── Open / close / commit / discard ───────────────────────────────
  _openPanel() {
    if (this._isOpen || this.hasAttribute('disabled')) return;
    this._isOpen = true;
    // Snapshot saved state into pending. Subsequent cell clicks mutate
    // pending only; outside-click / Apply commits back; Cancel discards.
    this._pendingValue = this._value ? new Date(this._value) : null;
    this._pendingStart = this._valueStart ? new Date(this._valueStart) : null;
    this._pendingEnd = this._valueEnd ? new Date(this._valueEnd) : null;
    this._pendingTime = this._time;
    this._selectingEnd = this._isRange && !!this._pendingStart && !this._pendingEnd;
    this._hoveredDate = null;
    const anchor = this._value || this._valueStart || new Date();
    this._focusedDate = clampToRange(new Date(anchor), this._min, this._max);
    this._currentMonth = startOfMonth(this._focusedDate);
    this._render();
    this._addDocListeners();
    this._focusFocusedCell();
    this.dispatchEvent(new CustomEvent('hbd:open', { bubbles: true, composed: true }));
  }

  // Commit pending → saved and (optionally) close. Fires hbd:change only
  // when the saved state actually changed.
  _commitAndClose(returnFocus = true) {
    if (!this._isOpen) return;
    const changed = this._commitPending();
    this._finishClose(returnFocus);
    if (changed) this._dispatchChange();
  }

  // Discard pending and close (Cancel).
  _discardAndClose(returnFocus = true) {
    if (!this._isOpen) return;
    this._finishClose(returnFocus);
  }

  // Returns true if anything actually changed.
  _commitPending() {
    let changed = false;
    if (this._isRange) {
      const ns = this._pendingStart ? toISODate(this._pendingStart) : '';
      const ne = this._pendingEnd ? toISODate(this._pendingEnd) : '';
      const os = this._valueStart ? toISODate(this._valueStart) : '';
      const oe = this._valueEnd ? toISODate(this._valueEnd) : '';
      if (ns !== os || ne !== oe) {
        this._valueStart = this._pendingStart ? new Date(this._pendingStart) : null;
        this._valueEnd = this._pendingEnd ? new Date(this._pendingEnd) : null;
        if (this._valueStart) this.setAttribute('value-start', toISODate(this._valueStart));
        else this.removeAttribute('value-start');
        if (this._valueEnd) this.setAttribute('value-end', toISODate(this._valueEnd));
        else this.removeAttribute('value-end');
        changed = true;
      }
    } else {
      const nv = this._pendingValue ? toISODate(this._pendingValue) : '';
      const ov = this._value ? toISODate(this._value) : '';
      if (nv !== ov) {
        this._value = this._pendingValue ? new Date(this._pendingValue) : null;
        if (this._value) this.setAttribute('value', toISODate(this._value));
        else this.removeAttribute('value');
        changed = true;
      }
      if (this._isDateTime && this._pendingTime !== this._time) {
        this._time = this._pendingTime;
        changed = true;
      }
    }
    if (changed) this._syncFormValue();
    return changed;
  }

  _finishClose(returnFocus) {
    this._isOpen = false;
    this._selectingEnd = false;
    this._hoveredDate = null;
    this._pendingValue = null;
    this._pendingStart = null;
    this._pendingEnd = null;
    this._removeDocListeners();
    this._render();
    if (returnFocus) {
      const trig = this.shadowRoot.querySelector('.hbd-date-picker__trigger');
      if (trig) trig.focus({ preventScroll: true });
    }
    this.dispatchEvent(new CustomEvent('hbd:close', { bubbles: true, composed: true }));
  }

  _dispatchChange() {
    const detail = this._isRange
      ? {
          start: this._valueStart ? toISODate(this._valueStart) : null,
          end: this._valueEnd ? toISODate(this._valueEnd) : null,
        }
      : {
          value: this._value
            ? (this._isDateTime && this._time
                ? `${toISODate(this._value)}T${this._time}`
                : toISODate(this._value))
            : null,
        };
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail, bubbles: true, composed: true,
    }));
  }

  // Back-compat shim: any internal caller asking to "close" gets the
  // discard-on-close behaviour. Outside-click, Cancel, and Escape all
  // discard; only Confirm commits.
  _closePanel(returnFocus = true) {
    this._discardAndClose(returnFocus);
  }

  _focusFocusedCell() {
    const iso = toISODate(this._focusedDate);
    const btn = this.shadowRoot.querySelector(`.hbd-date-picker__cell-inner[data-date="${iso}"]`);
    if (btn) {
      btn.setAttribute('tabindex', '0');
      btn.focus({ preventScroll: true });
    }
  }

  // ── Events ────────────────────────────────────────────────────────
  _onTriggerClick(e) {
    e.stopPropagation();
    if (this._isOpen) this._closePanel();
    else this._openPanel();
  }
  _onTriggerKeydown(e) {
    if (this.hasAttribute('disabled')) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      this._openPanel();
    }
  }
  _onPanelClick(e) {
    e.stopPropagation();
    const btn = e.target.closest('.hbd-date-picker__cell-inner');
    if (!btn) return;
    if (btn.disabled) return;
    const iso = btn.getAttribute('data-date');
    const d = parseISODate(iso);
    if (d) this._selectDate(d);
  }
  _onGridKeydown(e) {
    const k = e.key;
    let nextDate = null;
    switch (k) {
      case 'ArrowRight': nextDate = addDays(this._focusedDate, 1); break;
      case 'ArrowLeft':  nextDate = addDays(this._focusedDate, -1); break;
      case 'ArrowDown':  nextDate = addDays(this._focusedDate, 7); break;
      case 'ArrowUp':    nextDate = addDays(this._focusedDate, -7); break;
      case 'Home': {
        const wd = (this._focusedDate.getDay() - this._firstDay + 7) % 7;
        nextDate = addDays(this._focusedDate, -wd);
        break;
      }
      case 'End': {
        const wd = (this._focusedDate.getDay() - this._firstDay + 7) % 7;
        nextDate = addDays(this._focusedDate, 6 - wd);
        break;
      }
      case 'PageDown':
        nextDate = addMonths(this._focusedDate, e.shiftKey ? 12 : 1);
        break;
      case 'PageUp':
        nextDate = addMonths(this._focusedDate, e.shiftKey ? -12 : -1);
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        if (!this._isDisabledDate(this._focusedDate)) {
          this._selectDate(this._focusedDate);
        }
        return;
      case 'Escape':
        e.preventDefault();
        this._discardAndClose(true);
        return;
      default:
        return;
    }
    if (!nextDate) return;
    e.preventDefault();
    nextDate = clampToRange(nextDate, this._min, this._max);
    const monthChanged = nextDate.getMonth() !== this._currentMonth.getMonth()
      || nextDate.getFullYear() !== this._currentMonth.getFullYear();
    this._focusedDate = nextDate;
    if (monthChanged) {
      this._currentMonth = startOfMonth(nextDate);
      this._render();
      this._focusFocusedCell();
    } else {
      this._refreshGridFocus();
    }
  }
  _refreshGridFocus() {
    const iso = toISODate(this._focusedDate);
    const all = this.shadowRoot.querySelectorAll('.hbd-date-picker__cell-inner');
    all.forEach((b) => {
      const match = b.getAttribute('data-date') === iso;
      b.setAttribute('tabindex', match ? '0' : '-1');
      b.parentElement.classList.toggle('is-focused', match);
    });
    const btn = this.shadowRoot.querySelector(`.hbd-date-picker__cell-inner[data-date="${iso}"]`);
    if (btn) btn.focus({ preventScroll: true });
  }

  _onPrevMonth(e) {
    e.stopPropagation();
    this._currentMonth = addMonths(this._currentMonth, -1);
    this._render();
  }
  _onNextMonth(e) {
    e.stopPropagation();
    this._currentMonth = addMonths(this._currentMonth, 1);
    this._render();
  }

  _onTodayClick(e) {
    e.stopPropagation();
    // Navigate to the current month and focus today's cell. Per spec the
    // Today button selects today as a pending value but does NOT close the
    // panel — the user still has to Apply (or click outside) to commit.
    const t = new Date();
    this._currentMonth = startOfMonth(t);
    this._focusedDate = clampToRange(new Date(t), this._min, this._max);
    if (!this._isDisabledDate(t)) {
      if (this._isRange) {
        // Start a new pending range at today (acts like clicking today's cell).
        this._pendingStart = new Date(t);
        this._pendingEnd = null;
        this._selectingEnd = true;
      } else {
        this._pendingValue = new Date(t);
      }
    }
    this._render();
    this._focusFocusedCell();
  }

  _onClearClick(e) {
    e.stopPropagation();
    // Clear PENDING only — commit happens on Apply / outside-click. This
    // way the user can hit Clear → Cancel to back out without losing the
    // previously-saved selection.
    if (this._isRange) {
      this._pendingStart = null;
      this._pendingEnd = null;
      this._selectingEnd = false;
    } else {
      this._pendingValue = null;
      this._pendingTime = null;
    }
    this._render();
    this._focusFocusedCell();
  }
  _onCancelClick(e) {
    e.stopPropagation();
    this._discardAndClose(true);
  }
  _onConfirmClick(e) {
    e.stopPropagation();
    this._commitAndClose(true);
  }

  _onTimeChange(e) {
    const v = e.detail && e.detail.value;
    if (typeof v !== 'string') return;
    // Mutate pending only — commit happens on Apply / outside-click.
    this._pendingTime = v;
  }

  _onDocPointer(e) {
    // Outside-click DISCARDS the pending selection (same as Cancel /
    // Escape) and closes the panel. The previously-saved value is kept.
    // focus is not yanked back to the trigger because the user is
    // interacting elsewhere.
    if (!e.composedPath().includes(this)) this._discardAndClose(false);
  }

  // Hover-preview support for range mode: while picking the end date,
  // hovering a cell renders a provisional in-range run via _buildGrid.
  _onGridMouseOver(e) {
    if (!this._isRange || !this._selectingEnd) return;
    const btn = e.target.closest('.hbd-date-picker__cell-inner');
    if (!btn) return;
    const iso = btn.getAttribute('data-date');
    const d = parseISODate(iso);
    if (!d) return;
    if (this._hoveredDate && sameDay(this._hoveredDate, d)) return;
    this._hoveredDate = d;
    this._refreshGridRangeClasses();
  }
  _onGridMouseLeave() {
    if (!this._isRange || !this._selectingEnd) return;
    if (!this._hoveredDate) return;
    this._hoveredDate = null;
    this._refreshGridRangeClasses();
  }
  // Mutate just the range-related classes on existing cell nodes (no
  // innerHTML rebuild) so the hover preview updates smoothly without
  // dropping focus.
  _refreshGridRangeClasses() {
    const cells = this._buildGrid();
    const nodes = this.shadowRoot.querySelectorAll('.hbd-date-picker__cell');
    if (nodes.length !== cells.length) return;
    nodes.forEach((node, i) => {
      const c = cells[i];
      node.classList.toggle('is-in-range', !!c.isInRange);
      node.classList.toggle('is-range-start', !!c.isRangeStart);
      node.classList.toggle('is-range-end', !!c.isRangeEnd);
      node.classList.toggle('is-selected', !!c.isSelected);
    });
  }

  // ── Selection (mutates PENDING state only — commit happens on Apply
  // or outside-click; Cancel discards). The panel stays open. ──────────
  _selectDate(d) {
    if (this._isRange) {
      // Start a new range if none in flight, or if both endpoints exist
      // (i.e. user clicking after a complete range picks a fresh start).
      if (!this._pendingStart || (this._pendingStart && this._pendingEnd)) {
        this._pendingStart = new Date(d);
        this._pendingEnd = null;
        this._selectingEnd = true;
        this._focusedDate = new Date(d);
        this._render();
        this._focusFocusedCell();
        return;
      }
      // Completing the range — auto-swap if end picked before start.
      let start = this._pendingStart;
      let end = new Date(d);
      if (end < start) { const t = start; start = end; end = t; }
      this._pendingStart = start;
      this._pendingEnd = end;
      this._selectingEnd = false;
      this._focusedDate = new Date(d);
      this._render();
      this._focusFocusedCell();
      return;
    }

    // Single / date-time — mutate pending only.
    this._pendingValue = new Date(d);
    this._focusedDate = new Date(d);
    this._render();
    this._focusFocusedCell();
  }

  _iconCalendar() {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
      <path d="M2 6h12" stroke="currentColor" stroke-width="1.4"/>
      <path d="M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;
  }
}

if (!customElements.get('hbd-date-picker')) {
  customElements.define('hbd-date-picker', HbdDatePicker);
}
