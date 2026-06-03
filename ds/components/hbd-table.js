// ds/components/hbd-table.js
// Here Be Dragons DS — <hbd-table> custom element (CLAUDE.md §7).
//
// Light DOM. The table is rendered as a real <table> element so screen-
// reader table-nav commands (NVDA Ctrl+Alt+Arrows, JAWS T/F/G) work
// natively. Data is provided via JS PROPERTIES (`columns`, `rows`),
// not HTML children — the table is too dense to author declaratively.
//
// Authors write:
//   const t = document.querySelector('hbd-table');
//   t.columns = [
//     { key: 'name',  label: 'Name',  sortable: true,  width: '200px' },
//     { key: 'level', label: 'Level', sortable: true,  align: 'right',
//       sortType: 'number' },
//     { key: 'school',label: 'School',sortable: true },
//   ];
//   t.rows = [
//     { id: '1', name: 'Fireball',   level: 3, school: 'Evocation' },
//     …
//   ];
//
// Attributes:
//   size       — "sm" | "md" (default) | "lg"
//   selectable — boolean; renders the row-selection checkbox column
//   sortable   — boolean; convenience flag — when set, every column
//                with sortable !== false becomes sortable
//   bordered   — boolean
//   striped    — boolean
//   sticky-col — boolean; sticks the first data column to the left edge
//   empty-text — string shown when rows.length === 0 (default
//                "No data")
//   label      — accessible name for the table
//
// Events:
//   hbd:sort             — detail = { key, direction: 'asc'|'desc' }
//   hbd:selection-change — detail = { selected: [...rowIds] }
//
// Accessibility — role="grid" with the FULL ARIA grid keyboard
// pattern. Implemented via roving tabindex: the active cell has
// tabindex="0", everyone else has tabindex="-1". Cells track their
// (row, col) in data-attrs and the keyboard handler moves focus by
// computing the next coordinate.

let tableUidCounter = 0;

class HbdTable extends HTMLElement {
  static get observedAttributes() {
    return [
      'size', 'selectable', 'sortable', 'bordered',
      'striped', 'sticky-col', 'empty-text', 'label',
    ];
  }

  constructor() {
    super();
    this._uid = `hbd-table-${++tableUidCounter}`;
    this._columns = [];
    this._rows = [];
    this._sortKey = null;
    this._sortDir = 'asc';
    this._selected = new Set();
    this._activeCell = { row: 0, col: 0 };
    this._ready = false;
    this._onClick = this._onClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onCheckboxChange = this._onCheckboxChange.bind(this);
  }

  connectedCallback() {
    // Upgrade rescue — if the page assigned `.columns` / `.rows` BEFORE
    // the custom element class was registered, those writes landed on
    // the bare HTMLElement as own-properties and SHADOW the prototype
    // setters. Capture them, delete the own-properties, then re-assign
    // so the real setters fire. (Standard custom-element lazy-upgrade
    // pattern.)
    this._upgradeProperty('columns');
    this._upgradeProperty('rows');
    this._ready = true;
    this._render();
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeydown);
    // Selection lives on <hbd-checkbox>, which fires hbd:change (not
    // the native `change` event from its inner input — that's
    // retargeted at the Shadow DOM boundary).
    this.addEventListener('hbd:change', this._onCheckboxChange);
  }

  _upgradeProperty(name) {
    if (Object.prototype.hasOwnProperty.call(this, name)) {
      const value = this[name];
      delete this[name];
      this[name] = value;
    }
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeydown);
    this.removeEventListener('hbd:change', this._onCheckboxChange);
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  // ─── Public API ─────────────────────────────────────────────────
  set columns(val) {
    this._columns = Array.isArray(val) ? val : [];
    this._activeCell = { row: 0, col: 0 };
    if (this._ready) this._render();
  }
  get columns() { return this._columns; }

  set rows(val) {
    this._rows = Array.isArray(val) ? val.slice() : [];
    // Drop any selections for rows that are no longer present.
    if (this._selected.size > 0) {
      const ids = new Set(this._rows.map((r) => String(r.id)));
      this._selected = new Set([...this._selected].filter((id) => ids.has(id)));
    }
    if (this._ready) this._render();
  }
  get rows() { return this._rows; }

  getSelectedRows() {
    return this._rows.filter((r) => this._selected.has(String(r.id)));
  }

  clearSelection() {
    if (this._selected.size === 0) return;
    this._selected = new Set();
    this._render();
    this._fireSelectionChange();
  }

  // ─── Attribute readers ──────────────────────────────────────────
  get _size() {
    const s = (this.getAttribute('size') || 'md').toLowerCase();
    return ['sm', 'md', 'lg'].includes(s) ? s : 'md';
  }
  get _isSelectable() { return this.hasAttribute('selectable'); }
  get _isStickyCol()  { return this.hasAttribute('sticky-col'); }

  // ─── Render ─────────────────────────────────────────────────────
  _render() {
    if (!this._ready) return;

    const cols = this._columns;
    const rows = this._sortedRows();
    const selectable = this._isSelectable;
    const stickyCol = this._isStickyCol;
    const size = this._size;

    // Wrapper classes.
    const wrapClasses = ['hbd-table-wrap'];
    if (size !== 'md') wrapClasses.push(`hbd-table-wrap--${size}`);
    if (this.hasAttribute('bordered')) wrapClasses.push('hbd-table-wrap--bordered');
    if (this.hasAttribute('striped'))  wrapClasses.push('hbd-table-wrap--striped');

    const label = this.getAttribute('label') || 'Data table';
    const emptyText = this.getAttribute('empty-text') || 'No data';

    // Header.
    const allSelected = rows.length > 0
      && rows.every((r) => this._selected.has(String(r.id)));
    const someSelected = !allSelected
      && rows.some((r) => this._selected.has(String(r.id)));

    const headerCells = [];
    if (selectable) {
      const indeterminateAttr = someSelected ? ' indeterminate' : '';
      const checkedAttr = allSelected ? ' checked' : '';
      headerCells.push(
        `<th class="hbd-table__header hbd-table__check"
              scope="col"
              role="columnheader"
              data-grid-col="0"
              tabindex="-1">
           <hbd-checkbox data-select-all
                         aria-label="Select all rows"
                         ${checkedAttr}${indeterminateAttr}></hbd-checkbox>
         </th>`
      );
    }
    cols.forEach((c, ci) => {
      const colIndex = ci + (selectable ? 1 : 0);
      // Column is sortable when either:
      //   • the table-wide `sortable` attribute is set AND the column
      //     hasn't opted out via { sortable: false }, OR
      //   • the column explicitly opts in via { sortable: true }.
      const isSortable =
        (this.hasAttribute('sortable') && c.sortable !== false)
        || c.sortable === true;
      const isActiveSort = this._sortKey === c.key;
      const ariaSort = isActiveSort
        ? (this._sortDir === 'asc' ? 'ascending' : 'descending')
        : (isSortable ? 'none' : null);
      const classes = ['hbd-table__header'];
      if (isSortable) classes.push('hbd-table__header--sortable');
      if (isActiveSort) {
        classes.push(this._sortDir === 'asc'
          ? 'hbd-table__header--sorted-asc'
          : 'hbd-table__header--sorted-desc');
      }
      if (stickyCol && ci === 0) classes.push('hbd-table__header--sticky');
      if (c.align === 'right')  classes.push('hbd-table__header--align-right');
      if (c.align === 'center') classes.push('hbd-table__header--align-center');
      const style = c.width ? ` style="width:${escapeAttr(c.width)};"` : '';
      const ariaSortAttr = ariaSort ? ` aria-sort="${ariaSort}"` : '';
      const sortIcon = isSortable
        ? `<span class="hbd-table__sort-icon" aria-hidden="true">
             ${isActiveSort
               ? sortTriangleSvg()
               : sortBothSvg()}
           </span>`
        : '';
      headerCells.push(
        `<th class="${classes.join(' ')}"
              scope="col"
              role="columnheader"
              data-grid-col="${colIndex}"
              data-col-key="${escapeAttr(c.key)}"
              tabindex="-1"${ariaSortAttr}${style}>
           ${escapeText(c.label || '')}${sortIcon}
         </th>`
      );
    });

    // Body.
    let bodyHtml;
    if (rows.length === 0) {
      const totalCols = cols.length + (selectable ? 1 : 0);
      bodyHtml = `
        <tr class="hbd-table__empty" role="row">
          <td colspan="${totalCols}">${escapeText(emptyText)}</td>
        </tr>`;
    } else {
      bodyHtml = rows.map((r, ri) => {
        const rowId = String(r.id);
        const isSel = this._selected.has(rowId);
        const rowClasses = ['hbd-table__row'];
        if (isSel) rowClasses.push('hbd-table__row--selected', 'is-selected');
        if (r.disabled) rowClasses.push('hbd-table__row--disabled');
        // aria-rowindex is 1-based and includes the header row, so the
        // first data row is rowindex=2.
        const ariaRowIndex = ri + 2;
        const gridRow = ri + 1; // header occupies row 0

        const cells = [];
        if (selectable) {
          cells.push(
            `<td class="hbd-table__cell hbd-table__check"
                  role="gridcell"
                  data-grid-row="${gridRow}"
                  data-grid-col="0"
                  tabindex="-1">
               <hbd-checkbox data-row-id="${escapeAttr(rowId)}"
                             aria-label="Select row ${escapeAttr(rowId)}"
                             ${isSel ? 'checked' : ''}></hbd-checkbox>
             </td>`
          );
        }
        cols.forEach((c, ci) => {
          const colIndex = ci + (selectable ? 1 : 0);
          const classes = ['hbd-table__cell'];
          if (stickyCol && ci === 0) classes.push('hbd-table__cell--sticky');
          if (c.align === 'right')  classes.push('hbd-table__cell--align-right');
          if (c.align === 'center') classes.push('hbd-table__cell--align-center');
          const raw = r[c.key];
          const display = raw == null ? '' : String(raw);
          cells.push(
            `<td class="${classes.join(' ')}"
                  role="gridcell"
                  data-grid-row="${gridRow}"
                  data-grid-col="${colIndex}"
                  data-label="${escapeAttr(c.label || '')}"
                  tabindex="-1"
                  title="${escapeAttr(display)}">${escapeText(display)}</td>`
          );
        });

        return `
          <tr class="${rowClasses.join(' ')}"
              role="row"
              data-row-id="${escapeAttr(rowId)}"
              aria-rowindex="${ariaRowIndex}"
              aria-selected="${isSel ? 'true' : 'false'}">
            ${cells.join('')}
          </tr>`;
      }).join('');
    }

    const totalRows = rows.length + 1; // header counted
    const ariaMulti = selectable ? ' aria-multiselectable="true"' : '';

    this.innerHTML = `
      <div class="${wrapClasses.join(' ')}">
        <table class="hbd-table"
               role="grid"
               aria-label="${escapeAttr(label)}"
               aria-rowcount="${totalRows}"
               aria-colcount="${cols.length + (selectable ? 1 : 0)}"${ariaMulti}>
          <thead class="hbd-table__head">
            <tr class="hbd-table__row" role="row" aria-rowindex="1">
              ${headerCells.join('')}
            </tr>
          </thead>
          <tbody class="hbd-table__body">
            ${bodyHtml}
          </tbody>
        </table>
      </div>`;


    // Roving tabindex — put tabindex=0 on the currently-active cell so
    // Tab into the grid lands on a single, predictable focus target.
    this._applyRovingTabindex();
  }

  // ─── Sorting ────────────────────────────────────────────────────
  _sortedRows() {
    if (!this._sortKey) return this._rows.slice();
    const key = this._sortKey;
    const dir = this._sortDir === 'desc' ? -1 : 1;
    const col = this._columns.find((c) => c.key === key);
    const sortType = col && col.sortType;
    return this._rows.slice().sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      // null/undefined sort to the end regardless of direction.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (sortType === 'number'
          || (typeof av === 'number' && typeof bv === 'number')) {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv), undefined, {
        numeric: true, sensitivity: 'base',
      }) * dir;
    });
  }

  _sort(key) {
    if (this._sortKey === key) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortKey = key;
      this._sortDir = 'asc';
    }
    this._render();
    this.dispatchEvent(new CustomEvent('hbd:sort', {
      detail: { key: this._sortKey, direction: this._sortDir },
      bubbles: true, composed: true,
    }));
  }

  // ─── Selection ──────────────────────────────────────────────────
  _toggleRow(rowId) {
    const id = String(rowId);
    if (this._selected.has(id)) this._selected.delete(id);
    else this._selected.add(id);
    this._render();
    this._fireSelectionChange();
  }

  _toggleAll(checked) {
    if (checked) {
      this._selected = new Set(this._rows.map((r) => String(r.id)));
    } else {
      this._selected = new Set();
    }
    this._render();
    this._fireSelectionChange();
  }

  _fireSelectionChange() {
    this.dispatchEvent(new CustomEvent('hbd:selection-change', {
      detail: { selected: [...this._selected] },
      bubbles: true, composed: true,
    }));
  }

  // ─── Event handlers ─────────────────────────────────────────────
  _onClick(e) {
    // Header click → sort.
    const header = e.target && e.target.closest
      ? e.target.closest('.hbd-table__header--sortable')
      : null;
    if (header && this.contains(header)) {
      // If the click originated inside an hbd-checkbox (the select-all
      // control sometimes lives in a sortable column), ignore — the
      // hbd:change handler owns it.
      if (e.target.closest && e.target.closest('hbd-checkbox')) return;
      const key = header.getAttribute('data-col-key');
      if (key) this._sort(key);
    }
  }

  _onCheckboxChange(e) {
    // hbd:change is dispatched by <hbd-checkbox>; the host carries the
    // data-* attributes, and detail.checked holds the new state.
    const target = e.target;
    if (!target || target.tagName !== 'HBD-CHECKBOX') return;
    const checked = !!(e.detail && e.detail.checked);
    if (target.hasAttribute('data-select-all')) {
      this._toggleAll(checked);
      return;
    }
    if (target.hasAttribute('data-row-id')) {
      this._toggleRow(target.getAttribute('data-row-id'));
    }
  }

  // ─── Grid keyboard navigation ───────────────────────────────────
  _onKeydown(e) {
    // Sortable header activation — Enter / Space toggle the sort.
    const header = e.target && e.target.closest
      ? e.target.closest('.hbd-table__header--sortable')
      : null;
    if (header && this.contains(header)
        && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')
        && !(e.target.closest && e.target.closest('hbd-checkbox'))) {
      e.preventDefault();
      const key = header.getAttribute('data-col-key');
      if (key) this._sort(key);
      return;
    }

    // Grid navigation. Only fire for arrow / Home / End keys when a
    // cell or header inside the table holds focus.
    const cell = e.target && e.target.closest
      ? e.target.closest('[data-grid-row], [data-grid-col]')
      : null;
    if (!cell || !this.contains(cell)) return;
    if (cell.matches('input, button, a, select, textarea')) {
      // Focus is on an interactive child — let it handle its own keys.
      // The grid pattern lets arrow keys still navigate from the cell;
      // we already left tab keys alone, so this is a no-op fall-through.
      if (e.key === 'Tab') return;
    }

    let row = parseInt(cell.getAttribute('data-grid-row') || '0', 10);
    let col = parseInt(cell.getAttribute('data-grid-col') || '0', 10);
    if (cell.tagName === 'TH') row = 0;

    const maxRow = this._rows.length;          // 0 = header, 1..N data
    const maxCol = this._columns.length
      + (this._isSelectable ? 1 : 0) - 1;

    let nextRow = row;
    let nextCol = col;
    let handled = false;

    switch (e.key) {
      case 'ArrowRight': nextCol = Math.min(col + 1, maxCol); handled = true; break;
      case 'ArrowLeft':  nextCol = Math.max(col - 1, 0);      handled = true; break;
      case 'ArrowDown':  nextRow = Math.min(row + 1, maxRow); handled = true; break;
      case 'ArrowUp':    nextRow = Math.max(row - 1, 0);      handled = true; break;
      case 'Home':
        if (e.ctrlKey) { nextRow = 0; nextCol = 0; }
        else nextCol = 0;
        handled = true; break;
      case 'End':
        if (e.ctrlKey) { nextRow = maxRow; nextCol = maxCol; }
        else nextCol = maxCol;
        handled = true; break;
      default: break;
    }
    if (!handled) return;
    if (nextRow === row && nextCol === col) return;

    e.preventDefault();
    this._activeCell = { row: nextRow, col: nextCol };
    this._applyRovingTabindex();
    const next = this._cellAt(nextRow, nextCol);
    if (next) next.focus({ preventScroll: false });
  }

  _cellAt(row, col) {
    const table = this.querySelector('table.hbd-table');
    if (!table) return null;
    if (row === 0) {
      return table.querySelector(
        `.hbd-table__head [data-grid-col="${col}"]`
      );
    }
    return table.querySelector(
      `.hbd-table__body [data-grid-row="${row}"][data-grid-col="${col}"]`
    );
  }

  _applyRovingTabindex() {
    const table = this.querySelector('table.hbd-table');
    if (!table) return;
    table.querySelectorAll('[data-grid-row], [data-grid-col]')
      .forEach((el) => el.setAttribute('tabindex', '-1'));
    const { row, col } = this._activeCell;
    const target = this._cellAt(row, col);
    if (target) {
      target.setAttribute('tabindex', '0');
    } else {
      // Active cell vanished after a sort/selection change — reset
      // to the first header so Tab still has a landing spot.
      const fallback = this._cellAt(0, 0);
      if (fallback) {
        this._activeCell = { row: 0, col: 0 };
        fallback.setAttribute('tabindex', '0');
      }
    }
  }
}

// ─── SVG glyphs ──────────────────────────────────────────────────────
function sortTriangleSvg() {
  // Up-pointing triangle. The --sorted-desc class rotates it.
  return `
    <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"
         aria-hidden="true">
      <polygon points="6 3 10 9 2 9"/>
    </svg>`;
}
function sortBothSvg() {
  // Neutral double-arrow for unsorted columns.
  return `
    <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"
         aria-hidden="true">
      <polygon points="6 2 9 5 3 5"/>
      <polygon points="6 10 3 7 9 7"/>
    </svg>`;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!customElements.get('hbd-table')) {
  customElements.define('hbd-table', HbdTable);
}
