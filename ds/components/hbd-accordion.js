// ds/components/hbd-accordion.js
// Here Be Dragons DS — <hbd-accordion> + <hbd-accordion-item> custom
// elements (CLAUDE.md §7).
//
// Light DOM. The accordion host renders a stack of header+panel pairs
// and owns the toggle behaviour. Each authored <hbd-accordion-item>
// is a data carrier — its title, open state, disabled state, and
// innerHTML drive the rendered output. The authored items live inside
// a hidden source div across renders so author-provided event
// listeners on body content survive re-renders.
//
// Animation: CSS-only. The panel uses grid-template-rows: 0fr ↔ 1fr
// at --hbd-duration-slow (350ms). No scrollHeight measurement, no JS
// timing, no layout thrash.
//
// Authors write:
//   <hbd-accordion mode="single">
//     <hbd-accordion-item title="Spell Components">
//       <p>Verbal, somatic, and material components…</p>
//     </hbd-accordion-item>
//     <hbd-accordion-item title="Casting Time" open>
//       <p>Most spells require 1 action…</p>
//     </hbd-accordion-item>
//   </hbd-accordion>
//
// Attributes on hbd-accordion:
//   mode          — "single" (default) | "multi"
//   heading-level — "2" | "3" (default) | "4"
//
// Attributes on hbd-accordion-item:
//   title    — header label (required for a usable item)
//   open     — boolean; the item starts (or is) expanded
//   disabled — boolean; the trigger is non-interactive
//
// Events:
//   hbd:open  — detail = { index, title }
//   hbd:close — detail = { index, title }

let accordionUidCounter = 0;

// ─── <hbd-accordion-item> ────────────────────────────────────────────
class HbdAccordionItem extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'open', 'disabled'];
  }
  connectedCallback() {
    // Skip notify when our parent is the hidden source div — that's
    // the accordion moving us internally, not a fresh author insert.
    if (this.parentNode && this.parentNode.hasAttribute &&
        this.parentNode.hasAttribute('data-accordion-items-source')) {
      return;
    }
    this._notifyParent('structural');
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    // open + disabled are STATE changes — let the parent toggle the
    // corresponding class on the already-rendered item so the CSS
    // transition has a real start state to animate FROM. A full
    // re-render would rebuild the panel in its open state, which
    // gives the browser nothing to transition.
    if (name === 'open' || name === 'disabled') {
      this._notifyParent('state', name);
    } else {
      this._notifyParent('structural');
    }
  }
  _notifyParent(kind, attrName) {
    const parent = this.closest('hbd-accordion');
    if (!parent) return;
    if (kind === 'state' && typeof parent._syncItemState === 'function') {
      parent._syncItemState(this, attrName);
      return;
    }
    if (typeof parent._render === 'function') {
      queueMicrotask(() => parent._render());
    }
  }
}
if (!customElements.get('hbd-accordion-item')) {
  customElements.define('hbd-accordion-item', HbdAccordionItem);
}

// ─── <hbd-accordion> ─────────────────────────────────────────────────
class HbdAccordion extends HTMLElement {
  static get observedAttributes() {
    return ['mode', 'heading-level', 'bordered', 'divided', 'flush'];
  }

  constructor() {
    super();
    this._uid = `hbd-accordion-${++accordionUidCounter}`;
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
  get _mode() {
    const m = (this.getAttribute('mode') || 'single').toLowerCase();
    return m === 'multi' ? 'multi' : 'single';
  }
  get _headingLevel() {
    const n = parseInt(this.getAttribute('heading-level'), 10);
    return (n === 2 || n === 3 || n === 4) ? n : 3;
  }
  get _items() {
    const hidden = this.querySelector(':scope > [data-accordion-items-source]');
    if (hidden) {
      return Array.from(hidden.querySelectorAll(':scope > hbd-accordion-item'));
    }
    return Array.from(this.querySelectorAll(':scope > hbd-accordion-item'));
  }

  // ─── Render ─────────────────────────────────────────────────────
  _render() {
    if (!this._ready) return;
    // Reclaim author content from the rendered DOM first so author
    // items remain the source of truth between renders.
    this._reclaimBodiesToItems();

    const items = this._items;

    // Move items into the hidden source div the first time we see them.
    let hidden = this.querySelector(':scope > [data-accordion-items-source]');
    if (!hidden) {
      hidden = document.createElement('div');
      hidden.setAttribute('data-accordion-items-source', '');
      hidden.style.display = 'none';
      this.appendChild(hidden);
    }
    items.forEach((item) => {
      if (item.parentNode !== hidden) hidden.appendChild(item);
    });

    const classes = ['hbd-accordion'];
    if (this.hasAttribute('bordered')) classes.push('hbd-accordion--bordered');
    if (this.hasAttribute('divided'))  classes.push('hbd-accordion--divided');
    if (this.hasAttribute('flush'))    classes.push('hbd-accordion--flush');

    const hL = this._headingLevel;
    const headingTag = `h${hL}`;

    const itemsHtml = items.map((item, index) => {
      const title = item.getAttribute('title') || '';
      const isOpen = item.hasAttribute('open');
      const isDisabled = item.hasAttribute('disabled');

      const itemClasses = ['hbd-accordion__item'];
      if (isOpen) itemClasses.push('hbd-accordion__item--open');
      if (isDisabled) itemClasses.push('hbd-accordion__item--disabled');

      const triggerId = `${this._uid}-trigger-${index}`;
      const panelId   = `${this._uid}-panel-${index}`;

      const disabledAttr = isDisabled ? ' disabled' : '';

      return `
        <div class="${itemClasses.join(' ')}"
             id="${this._uid}-item-${index}"
             data-accordion-item-index="${index}">

          <${headingTag} class="hbd-accordion__header">
            <button class="hbd-accordion__trigger"
                    type="button"
                    id="${triggerId}"
                    aria-expanded="${isOpen ? 'true' : 'false'}"
                    aria-controls="${panelId}"${disabledAttr}>
              <span class="hbd-accordion__title">${escapeText(title)}</span>
              <span class="hbd-accordion__icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="4 6 8 10 12 6"></polyline>
                </svg>
              </span>
            </button>
          </${headingTag}>

          <div class="hbd-accordion__panel"
               id="${panelId}"
               role="region"
               aria-labelledby="${triggerId}">
            <div class="hbd-accordion__body" data-accordion-body></div>
          </div>

        </div>`;
    }).join('');

    // Replace the rendered wrapper.
    const oldRendered = this.querySelector(':scope > div.hbd-accordion');
    if (oldRendered) oldRendered.remove();

    const wrap = document.createElement('div');
    wrap.className = classes.join(' ');
    wrap.innerHTML = itemsHtml;
    this.appendChild(wrap);

    // Move authored body children into the rendered .hbd-accordion__body
    // wrappers, preserving listeners + identity.
    items.forEach((item, index) => {
      const renderedBody = wrap.querySelector(
        `[data-accordion-item-index="${index}"] [data-accordion-body]`
      );
      if (!renderedBody) return;
      Array.from(item.childNodes).forEach((node) => {
        renderedBody.appendChild(node);
      });
    });
  }

  // Move any body content currently inside the rendered .hbd-accordion__body
  // wrappers back into their authored hbd-accordion-item owners before
  // the next render. Mirrors the list component's reclaim helper.
  _reclaimBodiesToItems() {
    const oldRendered = this.querySelector(':scope > div.hbd-accordion');
    if (!oldRendered) return;
    const hidden = this.querySelector(':scope > [data-accordion-items-source]');
    if (!hidden) return;
    const sourceItems = Array.from(
      hidden.querySelectorAll(':scope > hbd-accordion-item')
    );
    oldRendered.querySelectorAll('[data-accordion-item-index]').forEach((itemEl) => {
      const idx = parseInt(itemEl.getAttribute('data-accordion-item-index'), 10);
      const authored = sourceItems[idx];
      if (!authored) return;
      const body = itemEl.querySelector('[data-accordion-body]');
      if (!body) return;
      Array.from(body.childNodes).forEach((node) => authored.appendChild(node));
    });
  }

  // ─── State sync (no re-render) ──────────────────────────────────
  // Open/close + disabled changes only update the existing rendered
  // item's classes + ARIA. The transition needs a real start state to
  // animate from, so we MUST NOT destroy and recreate the element.
  _syncItemState(authoredItem, attrName) {
    const items = this._items;
    const index = items.indexOf(authoredItem);
    if (index === -1) return;
    const wrap = this.querySelector(':scope > div.hbd-accordion');
    if (!wrap) return;
    const itemEl = wrap.querySelector(
      `[data-accordion-item-index="${index}"]`
    );
    if (!itemEl) return;
    const trigger = itemEl.querySelector('.hbd-accordion__trigger');
    if (attrName === 'open') {
      const isOpen = authoredItem.hasAttribute('open');
      itemEl.classList.toggle('hbd-accordion__item--open', isOpen);
      if (trigger) trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    } else if (attrName === 'disabled') {
      const isDisabled = authoredItem.hasAttribute('disabled');
      itemEl.classList.toggle('hbd-accordion__item--disabled', isDisabled);
      if (trigger) {
        if (isDisabled) trigger.setAttribute('disabled', '');
        else trigger.removeAttribute('disabled');
      }
    }
  }

  // ─── Toggle ─────────────────────────────────────────────────────
  _toggle(index) {
    const items = this._items;
    const target = items[index];
    if (!target || target.hasAttribute('disabled')) return;
    const wasOpen = target.hasAttribute('open');
    if (wasOpen) {
      this._close(index);
    } else {
      if (this._mode === 'single') {
        // Close every other open item first. Use the items array so
        // attribute writes stay synchronised with the parent's render.
        items.forEach((it, i) => {
          if (i !== index && it.hasAttribute('open')) {
            this._close(i);
          }
        });
      }
      this._open(index);
    }
  }

  _open(index) {
    const item = this._items[index];
    if (!item) return;
    item.setAttribute('open', '');
    // The item's attributeChangedCallback queues a re-render. The
    // rendered DOM then picks up the .hbd-accordion__item--open class.
    this.dispatchEvent(new CustomEvent('hbd:open', {
      detail: { index, title: item.getAttribute('title') || '' },
      bubbles: true, composed: true,
    }));
  }

  _close(index) {
    const item = this._items[index];
    if (!item) return;
    item.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('hbd:close', {
      detail: { index, title: item.getAttribute('title') || '' },
      bubbles: true, composed: true,
    }));
  }

  // ─── Events ─────────────────────────────────────────────────────
  _onClick(e) {
    const trigger = e.target && e.target.closest
      ? e.target.closest('.hbd-accordion__trigger')
      : null;
    if (!trigger || !this.contains(trigger)) return;
    const itemEl = trigger.closest('[data-accordion-item-index]');
    if (!itemEl) return;
    const idx = parseInt(itemEl.getAttribute('data-accordion-item-index'), 10);
    if (Number.isFinite(idx)) this._toggle(idx);
  }

  _onKeydown(e) {
    const trigger = e.target && e.target.closest
      ? e.target.closest('.hbd-accordion__trigger')
      : null;
    if (!trigger || !this.contains(trigger)) return;
    const triggers = this._triggers();
    const currentIndex = triggers.indexOf(trigger);
    if (currentIndex === -1) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = this._nextEnabled(triggers, currentIndex, 1);
        if (next) next.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = this._nextEnabled(triggers, currentIndex, -1);
        if (prev) prev.focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        const first = triggers.find((t) => !t.disabled);
        if (first) first.focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        const last = [...triggers].reverse().find((t) => !t.disabled);
        if (last) last.focus();
        break;
      }
      default:
        // Enter / Space are handled by the native <button>.
        break;
    }
  }

  _triggers() {
    const wrap = this.querySelector(':scope > div.hbd-accordion');
    if (!wrap) return [];
    return Array.from(wrap.querySelectorAll('.hbd-accordion__trigger'));
  }

  // Walk forward/backward through triggers, skipping disabled ones,
  // wrapping at the ends.
  _nextEnabled(triggers, from, step) {
    if (triggers.length === 0) return null;
    let i = from;
    for (let n = 0; n < triggers.length; n += 1) {
      i = (i + step + triggers.length) % triggers.length;
      if (!triggers[i].disabled) return triggers[i];
    }
    return null;
  }
}

function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!customElements.get('hbd-accordion')) {
  customElements.define('hbd-accordion', HbdAccordion);
}
