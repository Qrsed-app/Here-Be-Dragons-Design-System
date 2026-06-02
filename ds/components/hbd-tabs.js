// ds/components/hbd-tabs.js
// Here Be Dragons DS — <hbd-tabs> custom element (CLAUDE.md §7).
//
// Tabs organise content into labelled panels, one visible at a time.
// First navigation component — establishes the patterns Navbar, Drawer,
// and Stepper Navigation will follow: role="tablist" + roving tabindex
// + active indicator + scrollable overflow.
//
// Light DOM (NOT Shadow DOM): panel content is authored by consumers and
// they need to style it from the page. The component reads <hbd-tab> and
// <hbd-tab-panel> children, then replaces its own innerHTML with the
// rendered tab UI. The authored hbd-tab/hbd-tab-panel children are kept
// (as data carriers) under a data-attribute so the MutationObserver can
// pick up later changes.
//
// Variants:
//   horizontal  — tabs in a row above the content (default)
//   vertical    — tabs in a column to the left of the content
//   scrollable  — horizontal tabs that overflow with scroll buttons
//
// Modes:
//   lazy   — only the active panel is in the rendered DOM (default)
//   eager  — all panels rendered, inactive ones hidden via display:none
//
// Companion elements <hbd-tab> and <hbd-tab-panel> are pure data
// carriers (no Shadow DOM, no styles, no behaviour).

let uidCounter = 0;

// ── Companion elements — data carriers only ──────────────────────────
class HbdTab extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'label', 'badge', 'disabled'];
  }
}
if (!customElements.get('hbd-tab')) {
  customElements.define('hbd-tab', HbdTab);
}

class HbdTabPanel extends HTMLElement {
  static get observedAttributes() { return ['value']; }
}
if (!customElements.get('hbd-tab-panel')) {
  customElements.define('hbd-tab-panel', HbdTabPanel);
}

class HbdTabs extends HTMLElement {
  static get observedAttributes() {
    return ['active', 'variant', 'mode', 'label', 'scrollable'];
  }

  constructor() {
    super();
    this._uid = `hbd-tabs-${++uidCounter}`;
    this._tabs = [];
    this._panels = [];
    this._activeValue = '';
    this._ready = false;
    this._mo = null;
    // Stored Light-DOM source: the original hbd-tab / hbd-tab-panel
    // children, captured once on connect, so we can re-render without
    // re-reading the DOM (which we replace).
    this._sourceTabs = null;
    this._sourcePanels = null;

    this._onTabClick = this._onTabClick.bind(this);
    this._onTabKeydown = this._onTabKeydown.bind(this);
    this._onScrollPrev = this._onScrollPrev.bind(this);
    this._onScrollNext = this._onScrollNext.bind(this);
    this._onListScroll = this._onListScroll.bind(this);
    this._onWinResize = this._onWinResize.bind(this);
  }

  connectedCallback() {
    this._captureSource();
    this._readModel();
    this._ready = true;
    this._render();

    // Watch for changes to the AUTHORED children (added/removed/relabelled).
    // Mutations on the rendered scaffolding we ourselves write are excluded
    // by checking that the target is an <hbd-tab> / <hbd-tab-panel>.
    this._mo = new MutationObserver((muts) => {
      const relevant = muts.some((m) => {
        const tag = (m.target.tagName || '').toLowerCase();
        return tag === 'hbd-tab' || tag === 'hbd-tab-panel'
          || Array.from(m.addedNodes).some((n) => n.tagName
            && (n.tagName.toLowerCase() === 'hbd-tab'
              || n.tagName.toLowerCase() === 'hbd-tab-panel'))
          || Array.from(m.removedNodes).some((n) => n.tagName
            && (n.tagName.toLowerCase() === 'hbd-tab'
              || n.tagName.toLowerCase() === 'hbd-tab-panel'));
      });
      if (!relevant) return;
      this._captureSource();
      this._readModel();
      this._render();
    });
    this._mo.observe(this, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['value', 'label', 'badge', 'disabled'],
    });

    window.addEventListener('resize', this._onWinResize);
  }

  disconnectedCallback() {
    if (this._mo) { this._mo.disconnect(); this._mo = null; }
    window.removeEventListener('resize', this._onWinResize);
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'active') this._activeValue = newVal || '';
    if (this._ready && this.isConnected) {
      if (name === 'active') this._activate(this._activeValue, /*fromAttr*/ true);
      else this._render();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────
  get active() { return this._activeValue; }
  set active(v) { this.setAttribute('active', v == null ? '' : String(v)); }

  // ── Helpers ────────────────────────────────────────────────────────
  get _variant() {
    const v = (this.getAttribute('variant') || 'horizontal').toLowerCase();
    // `scrollable` was historically a variant; now it's a separate boolean
    // attribute that composes with horizontal OR vertical orientation. We
    // still accept variant="scrollable" for backwards compatibility — it
    // means horizontal + scrollable.
    if (v === 'scrollable') return 'horizontal';
    return ['horizontal', 'vertical'].includes(v) ? v : 'horizontal';
  }
  get _isVertical() { return this._variant === 'vertical'; }
  get _isScrollable() {
    return this.hasAttribute('scrollable')
      || (this.getAttribute('variant') || '').toLowerCase() === 'scrollable';
  }
  get _mode() {
    return (this.getAttribute('mode') || 'lazy').toLowerCase() === 'eager'
      ? 'eager' : 'lazy';
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Capture the authored <hbd-tab> / <hbd-tab-panel> children once. After
  // this runs, _render() can overwrite innerHTML safely — the source data
  // lives in _sourceTabs / _sourcePanels.
  _captureSource() {
    // If we've already captured (and innerHTML has been replaced with our
    // rendered scaffolding), do not re-capture from the rendered output.
    if (this._sourceTabs !== null) {
      // Re-scan only when authored children still exist (i.e. MO triggered
      // before render OR an author replaced children at runtime).
      const tabs = this.querySelectorAll(':scope > hbd-tab');
      const panels = this.querySelectorAll(':scope > hbd-tab-panel');
      if (tabs.length === 0 && panels.length === 0) return; // nothing fresh
    }
    const tabEls = Array.from(this.querySelectorAll(':scope > hbd-tab'));
    const panelEls = Array.from(this.querySelectorAll(':scope > hbd-tab-panel'));
    if (tabEls.length === 0 && panelEls.length === 0) {
      // Nothing to capture; keep whatever we had.
      if (this._sourceTabs === null) {
        this._sourceTabs = [];
        this._sourcePanels = [];
      }
      return;
    }
    this._sourceTabs = tabEls.map((t) => ({
      value: t.getAttribute('value') || '',
      label: t.getAttribute('label') || t.textContent.trim(),
      badge: t.getAttribute('badge') || '',
      disabled: t.hasAttribute('disabled'),
    }));
    this._sourcePanels = panelEls.map((p) => ({
      value: p.getAttribute('value') || '',
      innerHTML: p.innerHTML,
    }));
  }

  _readModel() {
    this._tabs = (this._sourceTabs || []).slice();
    this._panels = (this._sourcePanels || []).slice();

    // Resolve active value: explicit attr → first non-disabled tab.
    const attr = this.getAttribute('active');
    if (attr) {
      this._activeValue = attr;
    } else {
      const first = this._tabs.find((t) => !t.disabled);
      this._activeValue = first ? first.value : '';
    }
  }

  _enabledIndexes() {
    const out = [];
    this._tabs.forEach((t, i) => { if (!t.disabled) out.push(i); });
    return out;
  }
  _activeIndex() {
    return this._tabs.findIndex((t) => t.value === this._activeValue);
  }

  _removeListeners() {
    const root = this;
    const list = root.querySelector('.hbd-tabs__list');
    if (list) {
      list.removeEventListener('click', this._onTabClick);
      list.removeEventListener('keydown', this._onTabKeydown);
      list.removeEventListener('scroll', this._onListScroll);
    }
    const prev = root.querySelector('.hbd-tabs__scroll-prev');
    const next = root.querySelector('.hbd-tabs__scroll-next');
    if (prev) prev.removeEventListener('click', this._onScrollPrev);
    if (next) next.removeEventListener('click', this._onScrollNext);
  }

  // ── Render ─────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const variant = this._variant;
    const orientation = this._isVertical ? 'vertical' : 'horizontal';
    const label = this.getAttribute('label') || '';

    const wrapperClasses = ['hbd-tabs', `hbd-tabs--${variant}`];
    if (this._isScrollable) wrapperClasses.push('hbd-tabs--scrollable');

    const tabsHtml = this._tabs.map((t) => {
      const isActive = t.value === this._activeValue && !t.disabled;
      const cls = [
        'hbd-tabs__tab',
        isActive ? 'is-active' : '',
        t.disabled ? 'is-disabled' : '',
      ].filter(Boolean).join(' ');
      const badge = t.badge
        ? `<span class="hbd-tabs__tab-badge" aria-label="${this._esc(t.badge)} items">${this._esc(t.badge)}</span>`
        : '';
      return `
        <button type="button"
                class="${cls}"
                role="tab"
                id="tab-${uid}-${this._esc(t.value)}"
                aria-selected="${isActive ? 'true' : 'false'}"
                aria-controls="panel-${uid}-${this._esc(t.value)}"
                ${t.disabled ? 'aria-disabled="true" disabled' : ''}
                tabindex="${isActive ? '0' : '-1'}"
                data-value="${this._esc(t.value)}">
          ${this._esc(t.label)}${badge}
        </button>`;
    }).join('');

    // Scroll arrows — chevron direction depends on orientation. Vertical
    // tabs scroll up/down; horizontal tabs scroll left/right. The
    // aria-labels also rephrase per axis so SR users hear the right thing.
    const prevSvg = this._isVertical
      ? '<path d="M3 9l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
    const nextSvg = this._isVertical
      ? '<path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
    const prevLabel = this._isVertical ? 'Scroll tabs up' : 'Scroll tabs left';
    const nextLabel = this._isVertical ? 'Scroll tabs down' : 'Scroll tabs right';

    const scrollPrev = this._isScrollable
      ? `<button type="button" class="hbd-tabs__scroll-prev" aria-label="${prevLabel}" tabindex="-1">
           <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">${prevSvg}</svg>
         </button>` : '';
    const scrollNext = this._isScrollable
      ? `<button type="button" class="hbd-tabs__scroll-next" aria-label="${nextLabel}" tabindex="-1">
           <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">${nextSvg}</svg>
         </button>` : '';

    // Panels: in lazy mode, render only the active panel. Inactive panels
    // are absent from the DOM. In eager mode, render all panels; CSS
    // controls visibility via .is-active.
    const renderedPanels = this._mode === 'lazy'
      ? this._panels.filter((p) => p.value === this._activeValue)
      : this._panels;
    const panelsHtml = renderedPanels.map((p) => {
      const isActive = p.value === this._activeValue;
      return `
        <div class="hbd-tabs__panel${isActive ? ' is-active' : ''}"
             role="tabpanel"
             id="panel-${uid}-${this._esc(p.value)}"
             aria-labelledby="tab-${uid}-${this._esc(p.value)}"
             tabindex="0">${p.innerHTML}</div>`;
    }).join('');

    this.innerHTML = `
      <div class="${wrapperClasses.join(' ')}">
        <div class="hbd-tabs__list-wrap">
          ${scrollPrev}
          <div class="hbd-tabs__list"
               role="tablist"
               ${label ? `aria-label="${this._esc(label)}"` : ''}
               aria-orientation="${orientation}">
            ${tabsHtml}
          </div>
          ${scrollNext}
        </div>
        <div class="hbd-tabs__panels">
          ${panelsHtml}
        </div>
      </div>
    `;

    this._wireListeners();
    if (this._isScrollable) {
      this._updateScrollVisibility();
      this._scrollActiveIntoView();
    }
  }

  _wireListeners() {
    const list = this.querySelector('.hbd-tabs__list');
    if (list) {
      list.addEventListener('click', this._onTabClick);
      list.addEventListener('keydown', this._onTabKeydown);
      list.addEventListener('scroll', this._onListScroll, { passive: true });
    }
    const prev = this.querySelector('.hbd-tabs__scroll-prev');
    const next = this.querySelector('.hbd-tabs__scroll-next');
    if (prev) prev.addEventListener('click', this._onScrollPrev);
    if (next) next.addEventListener('click', this._onScrollNext);
  }

  // ── Activation ─────────────────────────────────────────────────────
  _activate(value, fromAttr = false) {
    const t = this._tabs.find((x) => x.value === value);
    if (!t || t.disabled) return;
    if (this._activeValue === value && !fromAttr) {
      // No-op activation — still re-focus the tab for the keyboard path.
      this._focusActiveTab();
      return;
    }
    const prev = this._activeValue;
    this._activeValue = value;
    if (this.getAttribute('active') !== value) {
      // Setting the attribute would trigger attributeChangedCallback →
      // _activate again; we're already mid-activation, so set it without
      // looping by checking equality above.
      this.setAttribute('active', value);
    }

    // In lazy mode we need a full re-render to swap which panel is in
    // the DOM. In eager mode we can mutate classes + ARIA in place.
    if (this._mode === 'lazy') {
      this._render();
      this._focusActiveTab();
    } else {
      this._updateActiveTabClasses();
      this._updateActivePanelClasses();
      this._focusActiveTab();
    }

    if (this._isScrollable) this._scrollActiveIntoView();

    if (prev !== value) {
      this.dispatchEvent(new CustomEvent('hbd:change', {
        detail: { value },
        bubbles: true,
        composed: true,
      }));
    }
  }

  _updateActiveTabClasses() {
    const tabs = this.querySelectorAll('.hbd-tabs__tab');
    tabs.forEach((tab) => {
      const v = tab.getAttribute('data-value');
      const isActive = v === this._activeValue && !tab.classList.contains('is-disabled');
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }
  _updateActivePanelClasses() {
    const panels = this.querySelectorAll('.hbd-tabs__panel');
    panels.forEach((p) => {
      const id = p.getAttribute('id') || '';
      const v = id.replace(`panel-${this._uid}-`, '');
      p.classList.toggle('is-active', v === this._activeValue);
    });
  }
  _focusActiveTab() {
    const tab = this.querySelector(`.hbd-tabs__tab[data-value="${CSS.escape(this._activeValue)}"]`);
    if (tab) tab.focus({ preventScroll: false });
  }

  // ── Event handlers ─────────────────────────────────────────────────
  _onTabClick(e) {
    const tab = e.target.closest('.hbd-tabs__tab');
    if (!tab) return;
    if (tab.classList.contains('is-disabled')) return;
    const v = tab.getAttribute('data-value');
    if (v != null) this._activate(v);
  }

  _onTabKeydown(e) {
    const tab = e.target.closest('.hbd-tabs__tab');
    if (!tab) return;
    const k = e.key;
    const isVertical = this._isVertical;
    const nextKeys = isVertical ? ['ArrowDown'] : ['ArrowRight'];
    const prevKeys = isVertical ? ['ArrowUp'] : ['ArrowLeft'];

    const enabled = this._enabledIndexes();
    if (enabled.length === 0) return;
    const curIdx = enabled.indexOf(this._activeIndex());
    let nextIdx = -1;

    if (nextKeys.includes(k)) {
      e.preventDefault();
      nextIdx = (curIdx + 1 + enabled.length) % enabled.length;
    } else if (prevKeys.includes(k)) {
      e.preventDefault();
      nextIdx = (curIdx - 1 + enabled.length) % enabled.length;
    } else if (k === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (k === 'End') {
      e.preventDefault();
      nextIdx = enabled.length - 1;
    } else {
      return;
    }

    if (nextIdx < 0) return;
    const target = this._tabs[enabled[nextIdx]];
    if (target) this._activate(target.value);
  }

  // ── Scrollable variant ─────────────────────────────────────────────
  _onScrollPrev() { this._scrollBy(-1); }
  _onScrollNext() { this._scrollBy(1); }
  _scrollBy(dir) {
    const list = this.querySelector('.hbd-tabs__list');
    if (!list) return;
    const tabs = list.querySelectorAll('.hbd-tabs__tab');
    if (tabs.length === 0) return;
    const probe = tabs[Math.floor(tabs.length / 2)];
    if (this._isVertical) {
      const step = (probe.offsetHeight || 40) * dir;
      list.scrollBy({ top: step, behavior: 'smooth' });
    } else {
      const step = (probe.offsetWidth || 120) * dir;
      list.scrollBy({ left: step, behavior: 'smooth' });
    }
  }
  _onListScroll() { this._updateScrollVisibility(); }
  _onWinResize() {
    if (this._isScrollable) this._updateScrollVisibility();
  }

  _updateScrollVisibility() {
    const list = this.querySelector('.hbd-tabs__list');
    const prev = this.querySelector('.hbd-tabs__scroll-prev');
    const next = this.querySelector('.hbd-tabs__scroll-next');
    if (!list || !prev || !next) return;
    if (this._isVertical) {
      const max = list.scrollHeight - list.clientHeight;
      const y = list.scrollTop;
      prev.classList.toggle('is-visible', y > 1);
      next.classList.toggle('is-visible', y < max - 1);
    } else {
      const max = list.scrollWidth - list.clientWidth;
      const x = list.scrollLeft;
      prev.classList.toggle('is-visible', x > 1);
      next.classList.toggle('is-visible', x < max - 1);
    }
  }

  _scrollActiveIntoView() {
    const list = this.querySelector('.hbd-tabs__list');
    const tab = this.querySelector(`.hbd-tabs__tab[data-value="${CSS.escape(this._activeValue)}"]`);
    if (!list || !tab) return;
    const tRect = tab.getBoundingClientRect();
    const lRect = list.getBoundingClientRect();
    if (this._isVertical) {
      if (tRect.top < lRect.top) {
        list.scrollBy({ top: tRect.top - lRect.top, behavior: 'smooth' });
      } else if (tRect.bottom > lRect.bottom) {
        list.scrollBy({ top: tRect.bottom - lRect.bottom, behavior: 'smooth' });
      }
    } else {
      if (tRect.left < lRect.left) {
        list.scrollBy({ left: tRect.left - lRect.left, behavior: 'smooth' });
      } else if (tRect.right > lRect.right) {
        list.scrollBy({ left: tRect.right - lRect.right, behavior: 'smooth' });
      }
    }
  }
}

if (!customElements.get('hbd-tabs')) {
  customElements.define('hbd-tabs', HbdTabs);
}
