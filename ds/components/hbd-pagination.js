// ds/components/hbd-pagination.js
// Here Be Dragons DS — <hbd-pagination> custom element (CLAUDE.md §7).
//
// Light DOM (NOT Shadow DOM) so the <nav> is a real landmark visible to
// SR landmark navigation and the page can style descendants directly.
// Three variants:
//   full     — numbered pages with prev/next + ellipsis (default)
//   compact  — prev/next + "Page N of M" live label
//   simple   — arrow-only prev/next
//
// Two render modes:
//   button   — items are <button>s; clicks fire hbd:change and update
//              the `page` attribute (default)
//   link     — items are <a href> when the `href-prefix` attribute is
//              set; the current page renders as <span aria-current="page">
//
// Disabled prev/next at boundaries are kept FOCUSABLE with
// aria-disabled="true" so keyboard users discover the boundary
// (per SC 2.1.1 awareness). Native `disabled` is not used in that case
// — JS no-ops the click instead.

let uidCounter = 0;

class HbdPagination extends HTMLElement {
  static get observedAttributes() {
    return [
      'page', 'total', 'siblings', 'variant', 'href-prefix',
      'show-first-last', 'show-goto',
      'total-records', 'page-size', 'page-size-options',
    ];
  }

  constructor() {
    super();
    this._uid = `hbd-pagination-${++uidCounter}`;
    this._ready = false;
    this._pendingFocusPage = null;
    this._onClick = this._onClick.bind(this);
    this._onGotoKeydown = this._onGotoKeydown.bind(this);
    this._onPageSizeChange = this._onPageSizeChange.bind(this);
  }

  connectedCallback() {
    this._ready = true;
    this._render();
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onGotoKeydown);
    // <hbd-select> fires hbd:change with detail.value. The listener
    // is on the host and uses event delegation since the inner DOM
    // re-renders.
    this.addEventListener('hbd:change', this._onPageSizeChange);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onGotoKeydown);
    this.removeEventListener('hbd:change', this._onPageSizeChange);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  // ── Helpers ───────────────────────────────────────────────────────
  get _page() {
    const n = parseInt(this.getAttribute('page'), 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  get _total() {
    const n = parseInt(this.getAttribute('total'), 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  get _siblings() {
    const n = parseInt(this.getAttribute('siblings'), 10);
    return Number.isFinite(n) && n >= 0 ? n : 1;
  }
  get _variant() {
    const v = (this.getAttribute('variant') || 'full').toLowerCase();
    return ['full', 'compact', 'simple'].includes(v) ? v : 'full';
  }
  get _hrefPrefix() { return this.getAttribute('href-prefix'); }
  get _isLink() { return this._hrefPrefix != null; }
  get _showFirstLast() { return this.hasAttribute('show-first-last'); }
  get _showGoto() { return this.hasAttribute('show-goto'); }
  get _totalRecords() {
    const n = parseInt(this.getAttribute('total-records'), 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  get _pageSize() {
    const n = parseInt(this.getAttribute('page-size'), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  get _pageSizeOptions() {
    const raw = this.getAttribute('page-size-options');
    if (!raw) return null;
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return null;
      const cleaned = arr
        .map((v) => parseInt(v, 10))
        .filter((v) => Number.isFinite(v) && v > 0);
      return cleaned.length ? cleaned : null;
    } catch { return null; }
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Page-range algorithm ──────────────────────────────────────────
  // Always show: 1, total, current, ±siblings around current.
  // Fill gaps with '…' when gap > 1.
  _getPageRange() {
    const page = Math.max(1, Math.min(this._page, this._total));
    const total = this._total;
    const siblings = this._siblings;

    if (total <= 1) return [1];

    const range = [];
    const left = Math.max(2, page - siblings);
    const right = Math.min(total - 1, page + siblings);

    range.push(1);
    if (left > 2) range.push('…');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push('…');
    if (total > 1) range.push(total);
    return range;
  }

  // ── Render ────────────────────────────────────────────────────────
  _render() {
    const variant = this._variant;
    const variantClass = variant === 'full' ? '' : ` hbd-pagination--${variant}`;

    let inner;
    if (variant === 'compact') inner = this._renderCompact();
    else if (variant === 'simple') inner = this._renderSimple();
    else inner = this._renderFull();

    // The host IS the <nav> landmark — set the class + ARIA on the host.
    // The .hbd-pagination--has-toolbar marker flips the host's display
    // mode (inline-flex → block) so the inner three-column toolbar can
    // use full-width layout.
    const hasToolbar = variant === 'full' && (
      this._showGoto
      || this._totalRecords != null
      || (this._pageSize != null && this._pageSizeOptions)
    );
    this.className = `hbd-pagination${variantClass}${hasToolbar ? ' hbd-pagination--has-toolbar' : ''}`;
    this.setAttribute('role', 'navigation');
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', 'Pagination');
    }
    this.innerHTML = inner;

    // Defer focus restore until the new DOM is in place.
    if (this._pendingFocusPage != null) {
      const target = this._pendingFocusPage;
      this._pendingFocusPage = null;
      requestAnimationFrame(() => this._focusPageButton(target));
    }

    // Page-change animation — only fire when a direction was queued by
    // _navigate (initial render and external attribute mutations don't
    // animate). The keyframe + .is-just-activated highlight clear
    // themselves via animationend so the classes don't linger.
    if (this._pendingDirection) {
      const dir = this._pendingDirection;
      this._pendingDirection = null;
      this._applyPagingAnimation(dir);
    }
  }

  _applyPagingAnimation(direction) {
    const dirClass = direction === 'backward'
      ? 'is-paging-backward'
      : 'is-paging-forward';
    this.classList.add(dirClass);
    // Spotlight pop on the new current page button (button mode) or the
    // active span (link mode).
    const active = this.querySelector('.hbd-pagination__link.is-active, .hbd-pagination__link[aria-current="page"]');
    if (active) {
      active.classList.add('is-just-activated');
      active.addEventListener('animationend', () => {
        active.classList.remove('is-just-activated');
      }, { once: true });
    }
    // Clear the host class once the page-carousel slide finishes.
    const pages = this.querySelector('.hbd-pagination__pages');
    if (pages) {
      pages.addEventListener('animationend', () => {
        this.classList.remove('is-paging-forward', 'is-paging-backward');
      }, { once: true });
    } else {
      // Safety: clear after a fixed timeout if the animation didn't fire
      // (e.g. prefers-reduced-motion collapsed it to ~0ms, or the
      // variant has no .hbd-pagination__pages — compact/simple).
      setTimeout(() => {
        this.classList.remove('is-paging-forward', 'is-paging-backward');
      }, 600);
    }
  }

  _renderFull() {
    const page = this._page;
    const total = this._total;
    const range = this._getPageRange();
    const items = range.map((entry) => this._renderRangeItem(entry, page)).join('');
    const widthStyle = this._pagesWidthStyle();
    const first = this._showFirstLast ? this._renderFirst() : '';
    const last = this._showFirstLast ? this._renderLast() : '';
    const navList = `
      <ol class="hbd-pagination__list">
        ${first}
        ${this._renderPrev()}
        <li class="hbd-pagination__item hbd-pagination__pages-wrap" style="${widthStyle}">
          <ol class="hbd-pagination__pages">
            ${items}
          </ol>
        </li>
        ${this._renderNext()}
        ${last}
      </ol>
    `;
    // Toolbar extras. Layout when any extra is present:
    //   [ info + page-size cluster ]  [ nav ]  [ goto ]
    // The info + page-size cluster sits on the LEFT (per spec), the
    // pagination nav stays centred-ish via flex-grow, and the goto
    // sits on the RIGHT. When an extra is absent we still render its
    // slot so the row's three-column flex layout doesn't reflow.
    const hasExtras = this._showGoto
      || this._totalRecords != null
      || (this._pageSize != null && this._pageSizeOptions);
    if (!hasExtras) return navList;

    // Combine "Showing X–Y of Z" with "Show N per page" into one
    // grouped paragraph: "Showing 1–10 of 240 · Show [select] per page".
    const infoPageSizeHtml = this._renderInfoPageSize();
    return `
      <div class="hbd-pagination__toolbar">
        <div class="hbd-pagination__toolbar-start">
          ${infoPageSizeHtml}
        </div>
        <div class="hbd-pagination__toolbar-center">
          ${navList}
        </div>
        <div class="hbd-pagination__toolbar-end">
          ${this._renderGoto()}
        </div>
      </div>
    `;
  }

  // Compute the widest possible page-cells row for the current
  // total/siblings settings and expose it as --_pages-width. The
  // formula matches what _getPageRange could produce at the widest:
  //   maxCells = min(total, 2*siblings + 5)
  //     2*siblings + 5 covers: first + left-ellipsis + (siblings*2+1)
  //     cells around current + right-ellipsis + last
  // Width = maxCells * item-size + (maxCells - 1) * gap.
  _pagesWidthStyle() {
    const siblings = this._siblings;
    const total = this._total;
    const maxCells = Math.max(1, Math.min(total, 2 * siblings + 5));
    // Express in CSS calc() so the values stay tied to the tokens —
    // theme overrides of --hbd-pagination-item-size or --hbd-space-1
    // propagate without re-running this JS.
    const w = `calc(${maxCells} * var(--hbd-pagination-item-size) `
      + `+ ${Math.max(0, maxCells - 1)} * var(--hbd-space-1))`;
    return `--_pages-width: ${w};`;
  }

  _renderCompact() {
    const page = this._page;
    const total = this._total;
    return `
      <ol class="hbd-pagination__list">
        ${this._renderPrev()}
      </ol>
      <span class="hbd-pagination__label"
            aria-live="polite"
            aria-atomic="true">Page ${page} of ${total}</span>
      <ol class="hbd-pagination__list">
        ${this._renderNext()}
      </ol>
    `;
  }

  _renderSimple() {
    return `
      <ol class="hbd-pagination__list">
        ${this._renderPrev()}
        ${this._renderNext()}
      </ol>
    `;
  }

  _renderRangeItem(entry, currentPage) {
    if (entry === '…') {
      return `
        <li class="hbd-pagination__item">
          <span class="hbd-pagination__ellipsis" aria-hidden="true">…</span>
        </li>`;
    }
    const isActive = entry === currentPage;
    const cls = ['hbd-pagination__link'];
    if (isActive) cls.push('is-active');

    // Link mode: current page is a <span aria-current>, others are <a>.
    if (this._isLink) {
      if (isActive) {
        return `
          <li class="hbd-pagination__item">
            <span class="${cls.join(' ')}" aria-current="page" aria-label="Page ${entry}, current page">${entry}</span>
          </li>`;
      }
      return `
        <li class="hbd-pagination__item">
          <a class="${cls.join(' ')}"
             href="${this._esc(this._hrefPrefix + entry)}"
             aria-label="Go to page ${entry}">${entry}</a>
        </li>`;
    }

    // Button mode: real <button>; current page button has aria-current
    // and is rendered non-interactive via the .is-active CSS rule.
    return `
      <li class="hbd-pagination__item">
        <button type="button"
                class="${cls.join(' ')}"
                data-page="${entry}"
                aria-label="${isActive ? `Page ${entry}, current page` : `Go to page ${entry}`}"
                ${isActive ? 'aria-current="page"' : ''}>${entry}</button>
      </li>`;
  }

  _renderPrev() {
    const page = this._page;
    const isFirst = page <= 1;
    // Prev/Next/First/Last are icon-only across all variants — only the
    // chevron is rendered; the accessible name lives in aria-label.
    const cls = ['hbd-pagination__prev'];
    if (isFirst) cls.push('is-disabled');
    const arrow = `
      <span class="hbd-pagination__icon" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 2L4 6l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>`;
    const text = '';
    const ariaLabel = 'Previous page';

    if (this._isLink) {
      if (isFirst) {
        return `
          <li class="hbd-pagination__item">
            <span class="${cls.join(' ')}" aria-label="${ariaLabel}" aria-disabled="true">${arrow}${text}</span>
          </li>`;
      }
      return `
        <li class="hbd-pagination__item">
          <a class="${cls.join(' ')}"
             href="${this._esc(this._hrefPrefix + (page - 1))}"
             aria-label="${ariaLabel}">${arrow}${text}</a>
        </li>`;
    }

    return `
      <li class="hbd-pagination__item">
        <button type="button"
                class="${cls.join(' ')}"
                data-nav="prev"
                aria-label="${ariaLabel}"
                aria-disabled="${isFirst ? 'true' : 'false'}">
          ${arrow}${text}
        </button>
      </li>`;
  }

  _renderNext() {
    const page = this._page;
    const total = this._total;
    const isLast = page >= total;
    const cls = ['hbd-pagination__next'];
    if (isLast) cls.push('is-disabled');
    const arrow = `
      <span class="hbd-pagination__icon" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>`;
    const text = '';
    const ariaLabel = 'Next page';

    if (this._isLink) {
      if (isLast) {
        return `
          <li class="hbd-pagination__item">
            <span class="${cls.join(' ')}" aria-label="${ariaLabel}" aria-disabled="true">${text}${arrow}</span>
          </li>`;
      }
      return `
        <li class="hbd-pagination__item">
          <a class="${cls.join(' ')}"
             href="${this._esc(this._hrefPrefix + (page + 1))}"
             aria-label="${ariaLabel}">${text}${arrow}</a>
        </li>`;
    }

    return `
      <li class="hbd-pagination__item">
        <button type="button"
                class="${cls.join(' ')}"
                data-nav="next"
                aria-label="${ariaLabel}"
                aria-disabled="${isLast ? 'true' : 'false'}">
          ${text}${arrow}
        </button>
      </li>`;
  }

  _renderFirst() {
    const page = this._page;
    const isFirst = page <= 1;
    const cls = ['hbd-pagination__prev', 'hbd-pagination__first'];
    if (isFirst) cls.push('is-disabled');
    const arrow = `
      <span class="hbd-pagination__icon" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M10 2L6 6l4 4M5 2L1 6l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>`;
    const text = '';
    const ariaLabel = 'First page';
    if (this._isLink) {
      if (isFirst) {
        return `
          <li class="hbd-pagination__item">
            <span class="${cls.join(' ')}" aria-label="${ariaLabel}" aria-disabled="true">${arrow}${text}</span>
          </li>`;
      }
      return `
        <li class="hbd-pagination__item">
          <a class="${cls.join(' ')}"
             href="${this._esc(this._hrefPrefix + 1)}"
             aria-label="${ariaLabel}">${arrow}${text}</a>
        </li>`;
    }
    return `
      <li class="hbd-pagination__item">
        <button type="button"
                class="${cls.join(' ')}"
                data-nav="first"
                aria-label="${ariaLabel}"
                aria-disabled="${isFirst ? 'true' : 'false'}">
          ${arrow}${text}
        </button>
      </li>`;
  }

  _renderLast() {
    const page = this._page;
    const total = this._total;
    const isLast = page >= total;
    const cls = ['hbd-pagination__next', 'hbd-pagination__last'];
    if (isLast) cls.push('is-disabled');
    const arrow = `
      <span class="hbd-pagination__icon" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l4 4-4 4M7 2l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>`;
    const text = '';
    const ariaLabel = 'Last page';
    if (this._isLink) {
      if (isLast) {
        return `
          <li class="hbd-pagination__item">
            <span class="${cls.join(' ')}" aria-label="${ariaLabel}" aria-disabled="true">${text}${arrow}</span>
          </li>`;
      }
      return `
        <li class="hbd-pagination__item">
          <a class="${cls.join(' ')}"
             href="${this._esc(this._hrefPrefix + total)}"
             aria-label="${ariaLabel}">${text}${arrow}</a>
        </li>`;
    }
    return `
      <li class="hbd-pagination__item">
        <button type="button"
                class="${cls.join(' ')}"
                data-nav="last"
                aria-label="${ariaLabel}"
                aria-disabled="${isLast ? 'true' : 'false'}">
          ${text}${arrow}
        </button>
      </li>`;
  }

  // "Showing 21–30 of 240" — derived from total-records + page-size +
  // current page. Skipped when total-records isn't set. The fixed-
  // width slot prevents layout shift as digit counts change.
  _renderInfo() {
    const tr = this._totalRecords;
    if (tr == null) return '';
    const ps = this._pageSize;
    if (ps == null || ps <= 0) {
      return `<span class="hbd-pagination__info" aria-live="polite">${tr} records</span>`;
    }
    const page = this._page;
    const from = tr === 0 ? 0 : (page - 1) * ps + 1;
    const to = Math.min(tr, page * ps);
    return `<span class="hbd-pagination__info" aria-live="polite">Showing ${from}–${to} of ${tr}</span>`;
  }

  // Combined info + page-size segment. Renders one or the other or
  // both, separated by a thin dot when both are present. Wraps in a
  // fixed-width container so changing page (and therefore the digit
  // counts) doesn't shift surrounding content.
  _renderInfoPageSize() {
    const infoHtml = this._renderInfo();
    const psHtml = this._renderPageSize();
    if (!infoHtml && !psHtml) return '';
    const sep = (infoHtml && psHtml)
      ? '<span class="hbd-pagination__sep" aria-hidden="true">·</span>'
      : '';
    return `
      <div class="hbd-pagination__info-group">
        ${infoHtml}
        ${sep}
        ${psHtml}
      </div>
    `;
  }

  // "Page [input] Go" — submits on Enter or Go-button click. The
  // visible label is short ("Page") to keep the goto cluster compact;
  // the input's aria-label carries the full "Go to page number"
  // accessible name for SR users.
  _renderGoto() {
    if (!this._showGoto) return '';
    const total = this._total;
    return `
      <span class="hbd-pagination__goto">
        <label class="hbd-pagination__goto-label" for="goto-${this._uid}">Page</label>
        <input type="number"
               id="goto-${this._uid}"
               class="hbd-pagination__goto-input"
               min="1" max="${total}"
               inputmode="numeric"
               data-goto-input
               aria-label="Go to page number">
        <button type="button"
                class="hbd-pagination__prev hbd-pagination__goto-go"
                data-nav="go"
                aria-label="Go to page">Go</button>
      </span>`;
  }

  // "Show [select] per page" — page-size dropdown built from the DS's
  // <hbd-select>. The .hbd-select--flat class suppresses the chip-pill
  // treatment that hbd-select normally gives a selected value, so the
  // select reads as a plain inline dropdown rather than a tag.
  _renderPageSize() {
    const current = this._pageSize;
    const options = this._pageSizeOptions;
    if (current == null || !options) return '';
    return `
      <span class="hbd-pagination__page-size">
        <span class="hbd-pagination__page-size-label">Show</span>
        <hbd-select size="sm"
                    class="hbd-select--flat"
                    value="${current}"
                    data-page-size-select
                    aria-label="Items per page">
          ${options.map((n) =>
            `<hbd-option value="${n}">${n}</hbd-option>`).join('')}
        </hbd-select>
        <span>per page</span>
      </span>`;
  }

  // ── Event handling (button mode) ──────────────────────────────────
  _onClick(e) {
    // "Go" button submits the goto-input value.
    const goBtn = e.target.closest('button.hbd-pagination__goto-go');
    if (goBtn) {
      e.preventDefault();
      this._submitGoto();
      return;
    }
    if (this._isLink) return;   // native <a> navigation handles itself
    const target = e.target.closest('button.hbd-pagination__link, button.hbd-pagination__prev, button.hbd-pagination__next');
    if (!target) return;
    // Swallow clicks on aria-disabled boundaries.
    if (target.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      return;
    }
    const page = this._page;
    const total = this._total;
    const nav = target.getAttribute('data-nav');
    let next;
    if (nav === 'first') next = 1;
    else if (nav === 'last') next = total;
    else if (nav === 'prev') next = page - 1;
    else if (nav === 'next') next = page + 1;
    else {
      const n = parseInt(target.getAttribute('data-page'), 10);
      if (!Number.isFinite(n)) return;
      next = n;
    }
    next = Math.max(1, Math.min(next, total));
    if (next === page) return;
    this._navigate(next);
  }

  _submitGoto() {
    const input = this.querySelector('[data-goto-input]');
    if (!input) return;
    const n = parseInt(input.value, 10);
    if (!Number.isFinite(n)) return;
    const next = Math.max(1, Math.min(n, this._total));
    input.value = '';
    if (next !== this._page) this._navigate(next);
  }

  // Enter inside the goto-input submits the value — quicker than
  // requiring the user to mouse over to the Go button.
  _onGotoKeydown(e) {
    if (!e.target.matches('[data-goto-input]')) return;
    if (e.key !== 'Enter') return;
    e.preventDefault();
    this._submitGoto();
  }

  // <hbd-select> change for the page-size dropdown. Resets page to 1
  // (so the user isn't stranded outside the new data range) and
  // dispatches hbd:page-size-change so the consuming app can fetch
  // the new slice. The inner select's hbd:change is stopped so it
  // doesn't escape as a pagination page-change event.
  _onPageSizeChange(e) {
    const select = e.target && e.target.closest
      && e.target.closest('[data-page-size-select]');
    if (!select) return;
    e.stopPropagation();
    const detail = e.detail || {};
    const newSize = parseInt(detail.value, 10);
    if (!Number.isFinite(newSize) || newSize <= 0) return;
    if (newSize === this._pageSize) return;
    this.setAttribute('page-size', String(newSize));
    if (this._page !== 1) {
      this.setAttribute('page', '1');
    }
    this.dispatchEvent(new CustomEvent('hbd:page-size-change', {
      detail: { pageSize: newSize, page: 1, total: this._total },
      bubbles: true,
      composed: true,
    }));
  }

  _navigate(newPage) {
    // Remember where to refocus after the re-render. We prefer the new
    // current page button; if it doesn't exist in the new range (rare
    // for full variant), fall back to prev/next.
    this._pendingFocusPage = newPage;
    // Direction for the slide-in animation, captured BEFORE we mutate
    // the page attribute (which kicks off the re-render).
    this._pendingDirection = newPage > this._page ? 'forward' : 'backward';
    this.setAttribute('page', String(newPage));
    // attributeChangedCallback → _render → requestAnimationFrame → focus.
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { page: newPage, total: this._total },
      bubbles: true,
      composed: true,
    }));
  }

  _focusPageButton(page) {
    // First try the active page button.
    const active = this.querySelector(`button.hbd-pagination__link[data-page="${page}"]`);
    if (active) { active.focus({ preventScroll: false }); return; }
    // Otherwise (e.g. moved to first/last and that button is at the
    // boundary), focus prev/next as appropriate.
    if (page <= 1) {
      const prev = this.querySelector('button.hbd-pagination__prev');
      if (prev) prev.focus({ preventScroll: false });
      return;
    }
    if (page >= this._total) {
      const next = this.querySelector('button.hbd-pagination__next');
      if (next) next.focus({ preventScroll: false });
    }
  }
}

if (!customElements.get('hbd-pagination')) {
  customElements.define('hbd-pagination', HbdPagination);
}
