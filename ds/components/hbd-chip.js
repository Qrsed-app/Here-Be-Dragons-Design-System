// ds/components/hbd-chip.js
// Here Be Dragons DS — <hbd-chip> custom element (CLAUDE.md §7).
//
// Light DOM. The chip is small chrome around a label + optional icon
// + optional remove button + optional toggle behaviour.
//
// Attributes:
//   label      — chip text
//   variant    — "primary" | "success" | "warning" | "error" | "neutral"
//                (default "neutral")
//   size       — "sm" | "md" (default) | "lg"
//   outline    — boolean; outline modifier
//   removable  — boolean; renders a remove ✕ button
//   selectable — boolean; renders the chip as <button> with aria-pressed
//   selected   — boolean; selected state on selectable chips
//   icon       — SVG markup string for a leading icon (optional)
//
// Events:
//   hbd:toggle — selectable chip pressed/unpressed. detail =
//                { selected: boolean, label: string }
//                Cancellable: e.preventDefault() rolls the toggle back.
//   hbd:remove — removable chip's ✕ activated. detail = { label }
//                Cancellable: e.preventDefault() prevents removal.
//
// Composition:
//   Static chip      → <span class="hbd-chip">…</span>
//   Removable chip   → <span class="hbd-chip"> + inner <button>
//   Selectable chip  → <button class="hbd-chip hbd-chip--selectable"
//                              aria-pressed="…">

class HbdChip extends HTMLElement {
  static get observedAttributes() {
    return [
      'label', 'variant', 'size', 'outline',
      'removable', 'selectable', 'selected', 'icon',
    ];
  }

  constructor() {
    super();
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

  // ─── Attribute readers ─────────────────────────────────────────────
  get _label() {
    return this.getAttribute('label') || this.textContent.trim() || '';
  }
  get _variant() {
    const v = (this.getAttribute('variant') || 'neutral').toLowerCase();
    return ['primary', 'success', 'warning', 'error', 'neutral'].includes(v)
      ? v : 'neutral';
  }
  get _size() {
    const s = (this.getAttribute('size') || 'md').toLowerCase();
    return ['sm', 'md', 'lg'].includes(s) ? s : 'md';
  }
  get _isRemovable()  { return this.hasAttribute('removable'); }
  get _isSelectable() { return this.hasAttribute('selectable'); }
  get _isSelected()   { return this.hasAttribute('selected'); }
  get _isOutline()    { return this.hasAttribute('outline'); }
  get _icon()         { return this.getAttribute('icon') || ''; }

  // ─── Render ────────────────────────────────────────────────────────
  _render() {
    // Compose host classes. Selectable + removable can both be set
    // (a removable filter chip is unusual but valid); the JS handles
    // both interactions side by side.
    const classes = ['hbd-chip', `hbd-chip--${this._variant}`];
    const size = this._size;
    if (size !== 'md') classes.push(`hbd-chip--${size}`);
    if (this._isOutline)    classes.push('hbd-chip--outline');
    if (this._isSelectable) classes.push('hbd-chip--selectable');
    if (this._isSelectable && this._isSelected) classes.push('is-selected');
    this.className = classes.join(' ');

    const label = this._label;
    const iconHtml = this._icon
      ? `<span class="hbd-chip__icon" aria-hidden="true">${this._icon}</span>`
      : '';
    const labelHtml =
      `<span class="hbd-chip__label">${escapeText(label)}</span>`;

    const removeHtml = this._isRemovable
      ? `<button class="hbd-chip__remove" type="button"
                  data-chip-remove
                  aria-label="Remove ${escapeAttr(label)}">
           <svg viewBox="0 0 16 16" width="16" height="16" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" aria-hidden="true">
             <line x1="4" y1="4" x2="12" y2="12"></line>
             <line x1="12" y1="4" x2="4" y2="12"></line>
           </svg>
         </button>`
      : '';

    // Selectable chips upgrade the host's role + keyboard via attrs.
    // Removable chips that are NOT selectable stay as a plain span —
    // the inner ✕ button is the only focusable element.
    if (this._isSelectable) {
      this.setAttribute('role', 'button');
      this.setAttribute('tabindex', '0');
      this.setAttribute('aria-pressed', String(this._isSelected));
    } else {
      this.removeAttribute('role');
      this.removeAttribute('tabindex');
      this.removeAttribute('aria-pressed');
    }

    this.innerHTML = iconHtml + labelHtml + removeHtml;
  }

  // ─── Events ────────────────────────────────────────────────────────
  _onClick(e) {
    // Remove button — fire hbd:remove, allow preventDefault to keep
    // the chip in place. Closest() handles clicks on the inner SVG.
    if (e.target && e.target.closest) {
      const removeBtn = e.target.closest('[data-chip-remove]');
      if (removeBtn && this.contains(removeBtn)) {
        e.preventDefault();
        e.stopPropagation();
        this._fireRemove();
        return;
      }
    }

    // Selectable chip — clicking the host (but not the remove button)
    // toggles selection.
    if (this._isSelectable) {
      this._toggleSelected();
    }
  }

  _onKeydown(e) {
    if (!this._isSelectable) return;
    // Enter + Space activate the host when it carries role="button".
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      this._toggleSelected();
    }
  }

  _toggleSelected() {
    const wasSelected = this._isSelected;
    const willBe = !wasSelected;

    // Fire BEFORE mutating so a cancelled event leaves state alone.
    const ev = new CustomEvent('hbd:toggle', {
      detail: { selected: willBe, label: this._label },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    const accepted = this.dispatchEvent(ev);
    if (!accepted) return;

    if (willBe) this.setAttribute('selected', '');
    else this.removeAttribute('selected');
    // The attributeChangedCallback re-renders, updating aria-pressed
    // and the .is-selected class.
  }

  _fireRemove() {
    const ev = new CustomEvent('hbd:remove', {
      detail: { label: this._label },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    const accepted = this.dispatchEvent(ev);
    if (!accepted) return;
    // Move focus to the next sibling chip if one exists, else the
    // previous sibling — same pattern as combobox chips. If there's
    // nothing, focus falls back to the previously-focused element
    // naturally as the button is removed from the DOM.
    const next = this.nextElementSibling;
    const prev = this.previousElementSibling;
    const target = (next && next.matches && next.matches('hbd-chip'))
      ? next
      : ((prev && prev.matches && prev.matches('hbd-chip')) ? prev : null);
    this.remove();
    if (target && typeof target.focus === 'function') {
      // Selectable chips are focusable (tabindex=0); removable-only
      // chips are not — in that case, focus the chip's remove button.
      const inner = target.querySelector('[data-chip-remove]');
      if (target.hasAttribute('selectable')) target.focus();
      else if (inner) inner.focus();
    }
  }
}

// ─── HTML-escape helpers ─────────────────────────────────────────────
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

if (!customElements.get('hbd-chip')) {
  customElements.define('hbd-chip', HbdChip);
}
