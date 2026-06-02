// ds/components/hbd-dropdown.js
// Here Be Dragons DS — <hbd-dropdown> custom element (CLAUDE.md §7).
//
// Trigger button (slotted) + action menu panel. Items are read from the
// Light DOM (<hbd-menu-item>, <hbd-menu-separator>, <hbd-menu-group>)
// and rendered as <button role="menuitem"> rows inside the panel. The
// menu uses ARIA `menu` / `menuitem` semantics — DISTINCT from select's
// listbox/option: items execute actions, they don't represent a value.
//
// Shadow DOM. Styles via adopted stylesheets (../utils/shared-styles.js).
// Shared roving-tabindex + keyboard logic lives in
// ../utils/menu-controller.js so hbd-context-menu can reuse it.

import { adoptStyles } from '../utils/shared-styles.js';
import { MenuController } from '../utils/menu-controller.js';

let uidCounter = 0;

// ── Companion elements — Light DOM data carriers ─────────────────────
class HbdMenuItem extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'label', 'icon', 'shortcut', 'disabled', 'destructive'];
  }
}
if (!customElements.get('hbd-menu-item')) {
  customElements.define('hbd-menu-item', HbdMenuItem);
}

class HbdMenuSeparator extends HTMLElement {}
if (!customElements.get('hbd-menu-separator')) {
  customElements.define('hbd-menu-separator', HbdMenuSeparator);
}

class HbdMenuGroup extends HTMLElement {
  static get observedAttributes() { return ['label']; }
}
if (!customElements.get('hbd-menu-group')) {
  customElements.define('hbd-menu-group', HbdMenuGroup);
}

class HbdDropdown extends HTMLElement {
  static get observedAttributes() {
    return ['placement', 'offset'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._uid = `hbd-dropdown-${++uidCounter}`;
    this._trigger = null;
    this._ready = false;
    this._mo = null;
    this._controller = null;

    this._onTriggerClick = this._onTriggerClick.bind(this);
    this._onTriggerKeydown = this._onTriggerKeydown.bind(this);
    this._onSlotChange = this._onSlotChange.bind(this);
    this._onWinResize = this._onWinResize.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/components/menu.css',
    ]);
    this._render();
    this._controller = new MenuController({
      host: this,
      shadowRoot: this.shadowRoot,
      panel: this.shadowRoot.querySelector('.hbd-menu'),
      onClose: ({ returnFocus }) => this._afterClose(returnFocus),
      onItemSelect: (detail) => this._onItemSelect(detail),
    });
    this._controller.attach();
    this._controller.render();
    this._ready = true;

    // Re-render menu items when the authored children mutate.
    this._mo = new MutationObserver((muts) => {
      const relevant = muts.some((m) => {
        const t = (m.target.tagName || '').toLowerCase();
        if (t === 'hbd-menu-item' || t === 'hbd-menu-separator' || t === 'hbd-menu-group') return true;
        return [...m.addedNodes, ...m.removedNodes].some((n) => {
          const tag = (n.tagName || '').toLowerCase();
          return ['hbd-menu-item', 'hbd-menu-separator', 'hbd-menu-group'].includes(tag);
        });
      });
      if (!relevant) return;
      this._controller.render();
      if (this._controller.isOpen()) this._positionMenu();
    });
    this._mo.observe(this, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['value', 'label', 'icon', 'shortcut', 'disabled', 'destructive'],
    });

    window.addEventListener('resize', this._onWinResize);
  }

  disconnectedCallback() {
    if (this._controller) this._controller.detach();
    if (this._mo) { this._mo.disconnect(); this._mo = null; }
    window.removeEventListener('resize', this._onWinResize);
    if (this._trigger) {
      this._trigger.removeEventListener('click', this._onTriggerClick);
      this._trigger.removeEventListener('keydown', this._onTriggerKeydown);
    }
    const slot = this.shadowRoot.querySelector('slot[name="trigger"]');
    if (slot) slot.removeEventListener('slotchange', this._onSlotChange);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    if (this._controller && this._controller.isOpen()) this._positionMenu();
  }

  // ── Render shell ──────────────────────────────────────────────────
  _render() {
    const uid = this._uid;
    this.shadowRoot.innerHTML = `
      <div class="hbd-dropdown">
        <slot name="trigger"></slot>
        <div class="hbd-menu"
             id="menu-${uid}"
             role="menu"
             tabindex="-1"></div>
      </div>
    `;
    const slot = this.shadowRoot.querySelector('slot[name="trigger"]');
    slot.addEventListener('slotchange', this._onSlotChange);
    // Initial slotchange may have already fired before listener attached.
    this._wireTrigger(slot.assignedElements()[0] || null);
  }

  _onSlotChange(e) {
    const assigned = e.target.assignedElements()[0] || null;
    this._wireTrigger(assigned);
  }

  _wireTrigger(el) {
    if (this._trigger && this._trigger !== el) {
      this._trigger.removeEventListener('click', this._onTriggerClick);
      this._trigger.removeEventListener('keydown', this._onTriggerKeydown);
    }
    this._trigger = el;
    if (!el) return;
    const uid = this._uid;
    el.id = el.id || `trigger-${uid}`;
    el.setAttribute('aria-haspopup', 'menu');
    el.setAttribute('aria-expanded', 'false');
    el.setAttribute('aria-controls', `menu-${uid}`);
    el.addEventListener('click', this._onTriggerClick);
    el.addEventListener('keydown', this._onTriggerKeydown);
    // Link the panel back to the trigger for accessible name.
    const panel = this.shadowRoot.querySelector('.hbd-menu');
    if (panel) panel.setAttribute('aria-labelledby', el.id);
  }

  _onTriggerClick(e) {
    e.stopPropagation();
    if (!this._controller) return;
    if (this._controller.isOpen()) this._controller.close();
    else this._openWithPlacement();
  }
  _onTriggerKeydown(e) {
    if (this.hasAttribute('disabled')) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      this._openWithPlacement();
    }
  }

  _openWithPlacement() {
    if (!this._controller) return;
    this._positionMenu();
    this._controller.open();
    if (this._trigger) this._trigger.setAttribute('aria-expanded', 'true');
  }

  _afterClose(returnFocus) {
    if (this._trigger) this._trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus && this._trigger) {
      // hbd-button's actual focus target is its inner native button.
      const inner = this._trigger.shadowRoot
        && this._trigger.shadowRoot.querySelector('button');
      if (inner) inner.focus({ preventScroll: true });
      else if (typeof this._trigger.focus === 'function') {
        this._trigger.focus({ preventScroll: true });
      }
    }
  }

  _onItemSelect({ value, label }) {
    this.dispatchEvent(new CustomEvent('hbd:select', {
      detail: { value, label },
      bubbles: true,
      composed: true,
    }));
  }

  // ── Placement calculation ─────────────────────────────────────────
  // Inline custom properties on the .hbd-menu element drive its
  // absolute positioning. The menu's parent (.hbd-dropdown) is
  // position:relative so top/left/right/bottom are relative to it.
  _positionMenu() {
    const panel = this.shadowRoot.querySelector('.hbd-menu');
    const trig = this._trigger;
    if (!panel || !trig) return;

    const placement = (this.getAttribute('placement') || 'bottom-start').toLowerCase();
    const offset = parseFloat(this.getAttribute('offset')) || 4;

    // Temporarily make the panel measurable while keeping it visually
    // hidden, then run the flip checks against viewport bounds.
    const prevDisplay = panel.style.display;
    const prevOpacity = panel.style.opacity;
    panel.style.opacity = '0';
    panel.style.display = 'block';

    // Compute desired position based on trigger rect + placement.
    const trigRect = trig.getBoundingClientRect();
    const menuRect = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let vert = placement.startsWith('top') ? 'top' : 'bottom';
    let horiz = placement.endsWith('-end') ? 'end'
              : placement.endsWith('-start') ? 'start'
              : 'center';

    // Flip vertically if not enough space.
    const spaceBelow = vh - trigRect.bottom;
    const spaceAbove = trigRect.top;
    if (vert === 'bottom' && spaceBelow < menuRect.height + offset
        && spaceAbove > spaceBelow) vert = 'top';
    if (vert === 'top' && spaceAbove < menuRect.height + offset
        && spaceBelow > spaceAbove) vert = 'bottom';

    // Flip horizontally if right-aligned overflows left, or vice versa.
    if (horiz === 'start' && trigRect.left + menuRect.width > vw
        && trigRect.right - menuRect.width >= 0) {
      horiz = 'end';
    } else if (horiz === 'end' && trigRect.right - menuRect.width < 0
        && trigRect.left + menuRect.width <= vw) {
      horiz = 'start';
    }

    // Apply position relative to the .hbd-dropdown wrapper (which is
    // position:relative and located at trigRect.{top,left} since it
    // contains the trigger as its primary visible child).
    panel.style.top = panel.style.bottom = panel.style.left = panel.style.right = '';
    if (vert === 'bottom') panel.style.top = `calc(100% + ${offset}px)`;
    else                   panel.style.bottom = `calc(100% + ${offset}px)`;
    if (horiz === 'start') panel.style.left = '0';
    else if (horiz === 'end') panel.style.right = '0';
    else { panel.style.left = '50%'; panel.style.transform = ''; /* center handled by translateX */ }

    panel.style.opacity = prevOpacity;
    panel.style.display = prevDisplay;
  }

  _onWinResize() {
    if (this._controller && this._controller.isOpen()) this._positionMenu();
  }
}

if (!customElements.get('hbd-dropdown')) {
  customElements.define('hbd-dropdown', HbdDropdown);
}
