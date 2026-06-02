// ds/utils/menu-controller.js
// Here Be Dragons DS — shared menu logic used by hbd-dropdown and
// hbd-context-menu. The owning component supplies:
//   host        — the custom element (used for events + querying Light DOM)
//   shadowRoot  — where the panel <div role="menu"> lives
//   panel       — the <div role="menu"> element
//   onClose     — () => void, called after a successful close (item
//                 activated / Escape / outside-click / Tab away). Allows
//                 the owner to handle focus-return / clear context state.
//   onItemSelect — ({ value, label }) => void, called when an item is
//                 activated. Owner dispatches its own hbd:select event.
//
// The controller manages:
//   • reading <hbd-menu-item> / <hbd-menu-separator> / <hbd-menu-group>
//     children from the Light DOM of the owning component
//   • rendering the menu markup into the supplied panel
//   • roving tabindex + arrow / Home / End / first-character navigation
//   • Enter/Space activation, Escape cancellation
//   • outside-click + Tab dismissal

export class MenuController {
  constructor({ host, shadowRoot, panel, onClose, onItemSelect }) {
    this.host = host;
    this.shadowRoot = shadowRoot;
    this.panel = panel;
    this.onClose = onClose || (() => {});
    this.onItemSelect = onItemSelect || (() => {});

    this._items = [];       // flat list of rendered <button> items
    this._focusedIndex = -1;
    this._typeBuffer = '';
    this._typeTimer = null;
    this._open = false;

    this._onPanelClick = this._onPanelClick.bind(this);
    this._onPanelKeydown = this._onPanelKeydown.bind(this);
    this._onDocPointer = this._onDocPointer.bind(this);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────
  attach() {
    if (!this.panel) return;
    this.panel.addEventListener('click', this._onPanelClick);
    this.panel.addEventListener('keydown', this._onPanelKeydown);
  }
  detach() {
    if (!this.panel) return;
    this.panel.removeEventListener('click', this._onPanelClick);
    this.panel.removeEventListener('keydown', this._onPanelKeydown);
    this._removeDocListeners();
  }

  // ── Item rendering ────────────────────────────────────────────────
  // Reads <hbd-menu-item>/<hbd-menu-separator>/<hbd-menu-group> children
  // from the host's Light DOM and rebuilds the panel's inner HTML.
  render() {
    const out = [];
    const uid = this.host._uid || 'menu';
    let groupIdx = 0;

    Array.from(this.host.children).forEach((el) => {
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'hbd-menu-separator') {
        out.push(this._separatorHtml());
        return;
      }
      if (tag === 'hbd-menu-group') {
        const label = el.getAttribute('label') || '';
        const groupId = `group-label-${uid}-${groupIdx++}`;
        const inner = Array.from(el.querySelectorAll('hbd-menu-item, hbd-menu-separator'))
          .map((c) => {
            const ct = c.tagName.toLowerCase();
            return ct === 'hbd-menu-separator'
              ? this._separatorHtml()
              : this._itemHtml(c);
          }).join('');
        out.push(`
          <div class="hbd-menu__group" role="group" aria-labelledby="${groupId}">
            <span class="hbd-menu__group-label" id="${groupId}">${this._esc(label)}</span>
            ${inner}
          </div>`);
        return;
      }
      if (tag === 'hbd-menu-item') {
        out.push(this._itemHtml(el));
        return;
      }
    });

    this.panel.innerHTML = out.join('');
    this._cacheItems();
  }

  _itemHtml(el) {
    const value = el.getAttribute('value') || '';
    const label = el.getAttribute('label') || el.textContent.trim();
    const icon = el.getAttribute('icon') || '';
    const shortcut = el.getAttribute('shortcut') || '';
    const disabled = el.hasAttribute('disabled');
    const destructive = el.hasAttribute('destructive');

    const cls = [
      'hbd-menu__item',
      destructive ? 'hbd-menu__item--destructive' : '',
      disabled ? 'hbd-menu__item--disabled' : '',
    ].filter(Boolean).join(' ');

    // icon can be: a URL (renders as <img>), an SVG markup string, or an
    // emoji/glyph — we treat anything that starts with '<' as raw markup.
    let iconHtml = '';
    if (icon) {
      iconHtml = icon.trimStart().startsWith('<')
        ? `<span class="hbd-menu__item-icon" aria-hidden="true">${icon}</span>`
        : `<span class="hbd-menu__item-icon" aria-hidden="true">${this._esc(icon)}</span>`;
    }
    const shortcutHtml = shortcut
      ? `<span class="hbd-menu__item-shortcut" aria-hidden="true">${this._esc(shortcut)}</span>`
      : '';

    return `
      <button type="button"
              class="${cls}"
              role="menuitem"
              tabindex="-1"
              ${disabled ? 'aria-disabled="true" disabled' : ''}
              data-value="${this._esc(value)}"
              data-label="${this._esc(label)}"
              title="${this._esc(label)}">
        ${iconHtml}
        <span class="hbd-menu__item-label">${this._esc(label)}</span>
        ${shortcutHtml}
      </button>`;
  }

  _separatorHtml() {
    return '<hr class="hbd-menu__separator" role="separator" aria-orientation="horizontal">';
  }

  _cacheItems() {
    this._items = Array.from(this.panel.querySelectorAll('.hbd-menu__item'));
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Open / close ──────────────────────────────────────────────────
  isOpen() { return this._open; }

  open() {
    if (this._open) return;
    this._open = true;
    this.panel.classList.add('hbd-menu--open');
    this._addDocListeners();
    // Focus the first non-disabled item.
    const idx = this._firstEnabledIndex();
    this._focusedIndex = idx;
    if (idx >= 0) this._focusItemAt(idx);
  }

  close({ returnFocus = true } = {}) {
    if (!this._open) return;
    this._open = false;
    this.panel.classList.remove('hbd-menu--open');
    this._removeDocListeners();
    this._focusedIndex = -1;
    this.onClose({ returnFocus });
  }

  // ── Item navigation ───────────────────────────────────────────────
  _firstEnabledIndex() {
    return this._items.findIndex((b) => !b.disabled);
  }
  _lastEnabledIndex() {
    for (let i = this._items.length - 1; i >= 0; i--) {
      if (!this._items[i].disabled) return i;
    }
    return -1;
  }
  _nextEnabled(from, dir) {
    const n = this._items.length;
    if (n === 0) return -1;
    let i = from;
    for (let s = 0; s < n; s++) {
      i = (i + dir + n) % n;
      if (!this._items[i].disabled) return i;
    }
    return -1;
  }
  _focusItemAt(i) {
    this._items.forEach((b, idx) => {
      const isFocused = idx === i;
      b.classList.toggle('is-focused', isFocused);
      b.setAttribute('tabindex', isFocused ? '0' : '-1');
    });
    const target = this._items[i];
    if (target) {
      target.focus({ preventScroll: false });
      target.scrollIntoView({ block: 'nearest' });
    }
    this._focusedIndex = i;
  }

  _activateItem(idx) {
    const btn = this._items[idx];
    if (!btn || btn.disabled) return;
    const value = btn.getAttribute('data-value') || '';
    const label = btn.getAttribute('data-label') || '';
    this.onItemSelect({ value, label });
    this.close();
  }

  // ── Event handlers ────────────────────────────────────────────────
  _onPanelClick(e) {
    const btn = e.target.closest('.hbd-menu__item');
    if (!btn) return;
    if (btn.disabled) return;
    e.stopPropagation();
    const idx = this._items.indexOf(btn);
    if (idx >= 0) this._activateItem(idx);
  }

  _onPanelKeydown(e) {
    const k = e.key;
    if (k === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }
    if (k === 'Tab') {
      this.close({ returnFocus: false });
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      if (this._focusedIndex >= 0) this._activateItem(this._focusedIndex);
      return;
    }
    if (k === 'ArrowDown') {
      e.preventDefault();
      const next = this._nextEnabled(
        this._focusedIndex >= 0 ? this._focusedIndex : -1, 1);
      if (next >= 0) this._focusItemAt(next);
      return;
    }
    if (k === 'ArrowUp') {
      e.preventDefault();
      const prev = this._nextEnabled(
        this._focusedIndex >= 0 ? this._focusedIndex : this._items.length, -1);
      if (prev >= 0) this._focusItemAt(prev);
      return;
    }
    if (k === 'Home') {
      e.preventDefault();
      const f = this._firstEnabledIndex();
      if (f >= 0) this._focusItemAt(f);
      return;
    }
    if (k === 'End') {
      e.preventDefault();
      const l = this._lastEnabledIndex();
      if (l >= 0) this._focusItemAt(l);
      return;
    }
    // First-character search: a single printable character jumps to the
    // next item whose label starts with that letter (case-insensitive,
    // wrapping). Multi-character buffer resets after 500ms.
    if (k.length === 1 && /\S/.test(k)) {
      this._typeBuffer += k.toLowerCase();
      if (this._typeTimer) clearTimeout(this._typeTimer);
      this._typeTimer = setTimeout(() => { this._typeBuffer = ''; }, 500);

      const start = (this._focusedIndex + 1) % Math.max(1, this._items.length);
      for (let step = 0; step < this._items.length; step++) {
        const i = (start + step) % this._items.length;
        const btn = this._items[i];
        if (btn.disabled) continue;
        const lbl = (btn.getAttribute('data-label') || '').toLowerCase();
        if (lbl.startsWith(this._typeBuffer)) {
          this._focusItemAt(i);
          return;
        }
      }
    }
  }

  // Outside-click: close if the click landed outside the host element.
  _onDocPointer(e) {
    if (e.composedPath().includes(this.host)) return;
    this.close({ returnFocus: false });
  }

  _addDocListeners() {
    document.addEventListener('pointerdown', this._onDocPointer, true);
  }
  _removeDocListeners() {
    document.removeEventListener('pointerdown', this._onDocPointer, true);
  }
}
