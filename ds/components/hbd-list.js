// ds/components/hbd-list.js
// Here Be Dragons DS — <hbd-list> + <hbd-list-item> custom elements
// (CLAUDE.md §7).
//
// Light DOM. Authors compose with slotted children and the JS rewrites
// each <hbd-list-item> as either:
//   • <a class="hbd-list__item hbd-list__item--interactive" href>…</a>
//   • <button class="hbd-list__item hbd-list__item--interactive">…</button>
//   • <li class="hbd-list__item">…</li>
//
// The <hbd-list> host renders an <ol> or <ul> wrapper so basic lists
// keep proper SR semantics. Interactive items live inside an <li> so
// the outer structure remains valid.
//
// Authors write:
//   <hbd-list divided>
//     <hbd-list-item href="/spells/fireball">
//       <hbd-avatar slot="leading" name="Fireball" size="sm"></hbd-avatar>
//       <span slot="primary">Fireball</span>
//       <span slot="secondary">Evocation · Level 3</span>
//       <hbd-badge slot="trailing" variant="error">Concentration</hbd-badge>
//       <hbd-button slot="action" icon-only aria-label="More">…</hbd-button>
//     </hbd-list-item>
//     …
//   </hbd-list>
//
// Events:
//   hbd:select — fired on click / Enter / Space activation of a
//                non-href interactive item. detail = { index, value }.
//                Cancellable.

let listUidCounter = 0;

// ─── <hbd-list-item> ────────────────────────────────────────────────
// Data carrier. Holds the slotted children + observed attributes; the
// parent <hbd-list> reads from it on render. No visual rendering of
// its own — the parent owns the DOM.
class HbdListItem extends HTMLElement {
  static get observedAttributes() {
    return ['href', 'selected', 'disabled', 'value'];
  }

  connectedCallback() {
    // Notify the parent so late-inserted items appear without an
    // explicit author call. Skip when our parent is the hidden
    // source div — that's the list moving us internally, NOT a fresh
    // author insertion.
    if (this.parentNode && this.parentNode.hasAttribute &&
        this.parentNode.hasAttribute('data-list-items-source')) {
      return;
    }
    this._notifyParent();
  }
  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal) return;
    this._notifyParent();
  }
  _notifyParent() {
    const parent = this.closest('hbd-list');
    if (parent && typeof parent._render === 'function') {
      queueMicrotask(() => parent._render());
    }
  }
}
if (!customElements.get('hbd-list-item')) {
  customElements.define('hbd-list-item', HbdListItem);
}

// ─── <hbd-list> ─────────────────────────────────────────────────────
class HbdList extends HTMLElement {
  static get observedAttributes() {
    return ['size', 'divided', 'bordered', 'flush'];
  }

  constructor() {
    super();
    this._uid = `hbd-list-${++listUidCounter}`;
    this._ready = false;
    this._onClick = this._onClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    this._ready = true;
    this._render();
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeydown);
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  // ─── Attribute readers ──────────────────────────────────────────
  get _size() {
    const s = (this.getAttribute('size') || 'md').toLowerCase();
    return ['sm', 'md', 'lg'].includes(s) ? s : 'md';
  }
  get _items() {
    // First render: items live as direct children of the host. After
    // the first render they live inside the hidden source div. Look in
    // both places so re-renders see the same set.
    const hidden = this.querySelector(':scope > [data-list-items-source]');
    if (hidden) {
      return Array.from(hidden.querySelectorAll(':scope > hbd-list-item'));
    }
    return Array.from(this.querySelectorAll(':scope > hbd-list-item'));
  }

  // ─── Render ─────────────────────────────────────────────────────
  _render() {
    if (!this._ready) return;

    // Restore slotted children back into their authored hbd-list-item
    // owners before re-reading them — they were moved into the
    // rendered <ul> by the previous render.
    this._reclaimSlotsToItems();

    const items = this._items;
    const size = this._size;

    // Build the <ul> wrapper. Always <ul> — ordered semantics would
    // require an "ordered" attribute; the spec doesn't ask for one and
    // most product lists are unordered.
    const classes = ['hbd-list'];
    if (size !== 'md') classes.push(`hbd-list--${size}`);
    if (this.hasAttribute('divided'))  classes.push('hbd-list--divided');
    if (this.hasAttribute('bordered')) classes.push('hbd-list--bordered');
    if (this.hasAttribute('flush'))    classes.push('hbd-list--flush');

    const itemsHtml = items.map((item, index) =>
      this._renderItem(item, index)
    ).join('');

    // We rebuild the wrapper but PRESERVE the original <hbd-list-item>
    // nodes — they own slotted author content that we need to read
    // again on the next render. They live inside the host but outside
    // the visible <ul>, hidden via display:none, so authoring still
    // works (the user-facing DOM is the rendered <ul>).
    let hidden = this.querySelector(':scope > [data-list-items-source]');
    if (!hidden) {
      hidden = document.createElement('div');
      hidden.setAttribute('data-list-items-source', '');
      hidden.style.display = 'none';
      this.appendChild(hidden);
    }
    // Move all hbd-list-item children that are not already in the
    // hidden source into it. We must do this BEFORE writing innerHTML
    // on the host or we'd lose the slotted children entirely.
    items.forEach((item) => {
      if (item.parentNode !== hidden) hidden.appendChild(item);
    });

    // Now clear the rendered <ul>, if any, and re-render.
    const oldRendered = this.querySelector(':scope > ul.hbd-list');
    if (oldRendered) oldRendered.remove();

    const ul = document.createElement('ul');
    ul.className = classes.join(' ');
    ul.innerHTML = itemsHtml;
    this.appendChild(ul);

    // Move the slotted "leading" / "primary" / "secondary" / "trailing"
    // / "action" nodes from each hbd-list-item INTO the corresponding
    // slots inside the rendered item, preserving listeners + identity.
    items.forEach((item, index) => {
      const renderedItem = ul.querySelector(`[data-list-item-index="${index}"]`);
      if (!renderedItem) return;
      this._populateItemSlots(item, renderedItem);
    });
  }

  // Build the markup for ONE item. The slot containers carry data-
  // attributes; the JS then moves the slotted children into them.
  _renderItem(item, index) {
    const href = item.getAttribute('href');
    const isSelected = item.hasAttribute('selected');
    const isDisabled = item.hasAttribute('disabled');
    const isInteractive = href != null;

    const itemClasses = ['hbd-list__item'];
    if (isInteractive) itemClasses.push('hbd-list__item--interactive');
    if (isSelected)    itemClasses.push('hbd-list__item--selected', 'is-selected');
    if (isDisabled)    itemClasses.push('hbd-list__item--disabled');

    const hasLeading   = !!item.querySelector(':scope > [slot="leading"]');
    const hasPrimary   = !!item.querySelector(':scope > [slot="primary"]');
    const hasSecondary = !!item.querySelector(':scope > [slot="secondary"]');
    const hasTrailing  = !!item.querySelector(':scope > [slot="trailing"]');
    const hasAction    = !!item.querySelector(':scope > [slot="action"]');

    const inner =
      (hasLeading
        ? '<span class="hbd-list__item-leading" data-slot="leading"></span>'
        : '') +
      (hasPrimary || hasSecondary
        ? '<span class="hbd-list__item-content">' +
            (hasPrimary
              ? '<span class="hbd-list__item-primary" data-slot="primary"></span>'
              : '') +
            (hasSecondary
              ? '<span class="hbd-list__item-secondary" data-slot="secondary"></span>'
              : '') +
          '</span>'
        : '') +
      ((hasTrailing || hasAction)
        ? '<span class="hbd-list__item-trailing">' +
            (hasTrailing
              ? '<span data-slot="trailing"></span>'
              : '') +
            (hasAction
              ? '<span class="hbd-list__item-action" data-slot="action"></span>'
              : '') +
          '</span>'
        : '');

    // For href items we render an <a> INSIDE an <li> so the outer list
    // semantics stay correct (a list of links, not links pretending to
    // be list items).
    if (isInteractive) {
      const ariaCurrent = isSelected ? ' aria-current="page"' : '';
      const ariaDisabled = isDisabled ? ' aria-disabled="true"' : '';
      const tabindex = isDisabled ? ' tabindex="-1"' : '';
      return `
        <li data-list-item-index="${index}" data-list-item-wrap>
          <a class="${itemClasses.join(' ')}"
             href="${escapeAttr(href)}"${ariaCurrent}${ariaDisabled}${tabindex}>
            ${inner}
          </a>
        </li>`;
    }

    // Static item — plain <li>.
    return `
      <li class="${itemClasses.join(' ')}"
          data-list-item-index="${index}">
        ${inner}
      </li>`;
  }

  // Move any slotted content currently sitting inside the rendered
  // <ul> back into its authored hbd-list-item. Call this before each
  // re-render so the authored items are the source of truth again.
  _reclaimSlotsToItems() {
    const oldRendered = this.querySelector(':scope > ul.hbd-list');
    if (!oldRendered) return;
    const hidden = this.querySelector(':scope > [data-list-items-source]');
    if (!hidden) return;
    const sourceItems = Array.from(
      hidden.querySelectorAll(':scope > hbd-list-item')
    );
    oldRendered.querySelectorAll('[data-list-item-index]').forEach((wrap) => {
      const idx = parseInt(wrap.getAttribute('data-list-item-index'), 10);
      const authored = sourceItems[idx];
      if (!authored) return;
      wrap.querySelectorAll('[data-slot]').forEach((slotEl) => {
        const slotName = slotEl.getAttribute('data-slot');
        Array.from(slotEl.children).forEach((child) => {
          // The slot child may have lost its slot attribute during
          // the move; restore it just in case.
          if (!child.getAttribute('slot')) {
            child.setAttribute('slot', slotName);
          }
          authored.appendChild(child);
        });
      });
    });
  }

  // Move the original slotted children from the authored hbd-list-item
  // into the data-slot wrappers inside the rendered item.
  _populateItemSlots(authored, rendered) {
    const moveSlot = (slotName) => {
      const source = authored.querySelector(`:scope > [slot="${slotName}"]`);
      if (!source) return;
      const target = rendered.querySelector(`[data-slot="${slotName}"]`);
      if (!target) return;
      target.appendChild(source);
    };
    moveSlot('leading');
    moveSlot('primary');
    moveSlot('secondary');
    moveSlot('trailing');
    moveSlot('action');
  }

  // ─── Events ─────────────────────────────────────────────────────
  _onClick(e) {
    const wrap = e.target && e.target.closest
      ? e.target.closest('[data-list-item-index]')
      : null;
    if (!wrap || !this.contains(wrap)) return;
    // Trailing/action clicks should NOT also fire the list-level
    // select — they have their own actions. Detect by checking the
    // path includes a trailing wrapper.
    const trailingHit = e.target.closest('.hbd-list__item-trailing');
    if (trailingHit) return;
    this._fireSelect(wrap, e);
  }

  _onKeydown(e) {
    // Only relevant for interactive items.
    const wrap = e.target && e.target.closest
      ? e.target.closest('[data-list-item-index]')
      : null;
    if (!wrap) return;
    const interactive = wrap.querySelector('.hbd-list__item--interactive');
    if (!interactive) return;
    // Anchors handle Enter natively. We only synthesise activation
    // for non-href button-style items, but the current implementation
    // requires href for interactive — Enter/Space pass through.
    if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')
        && interactive.tagName === 'BUTTON') {
      e.preventDefault();
      this._fireSelect(wrap, e);
    }
  }

  _fireSelect(wrap, originalEvent) {
    const idx = parseInt(wrap.getAttribute('data-list-item-index'), 10);
    if (!Number.isFinite(idx)) return;
    const authored = this._items[idx];
    if (!authored) return;
    if (authored.hasAttribute('disabled')) return;
    const value = authored.getAttribute('value')
      || (authored.querySelector(':scope > [slot="primary"]') &&
          authored.querySelector(':scope > [slot="primary"]').textContent.trim())
      || '';
    const ev = new CustomEvent('hbd:select', {
      detail: { index: idx, value, item: authored },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    const accepted = this.dispatchEvent(ev);
    if (!accepted && originalEvent) originalEvent.preventDefault();
  }
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!customElements.get('hbd-list')) {
  customElements.define('hbd-list', HbdList);
}
