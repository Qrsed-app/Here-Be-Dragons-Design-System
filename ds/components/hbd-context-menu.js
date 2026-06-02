// ds/components/hbd-context-menu.js
// Here Be Dragons DS — <hbd-context-menu> custom element (CLAUDE.md §7).
//
// Same menu panel as hbd-dropdown, triggered by:
//   • right-click (contextmenu event) on desktop
//   • long-press (pointerdown + 500ms hold without movement) on touch
//
// The menu is positioned at the pointer location using `position: fixed`
// so it doesn't need to know about its host's layout. Viewport-edge
// flipping mirrors the dropdown's placement logic.
//
// Reuses the shared <hbd-menu-item>/<hbd-menu-separator>/<hbd-menu-group>
// companions registered by hbd-dropdown.js, and the same MenuController.

import { adoptStyles } from '../utils/shared-styles.js';
import { MenuController } from '../utils/menu-controller.js';
// Side-effect import — ensures the companion elements are defined even
// if a page only uses <hbd-context-menu> without <hbd-dropdown>.
import './hbd-dropdown.js';

let uidCounter = 0;
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 8;   // px the finger may drift

class HbdContextMenu extends HTMLElement {
  static get observedAttributes() { return ['disabled']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._uid = `hbd-context-menu-${++uidCounter}`;
    this._ready = false;
    this._mo = null;
    this._controller = null;
    this._lpTimer = null;
    this._lpStartX = 0;
    this._lpStartY = 0;
    this._lpFiredAt = null;     // set when long-press triggers the menu

    this._onContextMenu = this._onContextMenu.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
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
      onClose: () => this._afterClose(),
      onItemSelect: (detail) => this._onItemSelect(detail),
    });
    this._controller.attach();
    this._controller.render();
    this._ready = true;

    // Trigger listeners are on the HOST element (Light DOM) — the user's
    // right-click target is the host's content, not the shadow panel.
    this.addEventListener('contextmenu', this._onContextMenu);
    this.addEventListener('pointerdown', this._onPointerDown);

    this._mo = new MutationObserver((muts) => {
      const relevant = muts.some((m) => {
        const t = (m.target.tagName || '').toLowerCase();
        if (t === 'hbd-menu-item' || t === 'hbd-menu-separator' || t === 'hbd-menu-group') return true;
        return [...m.addedNodes, ...m.removedNodes].some((n) => {
          const tag = (n.tagName || '').toLowerCase();
          return ['hbd-menu-item', 'hbd-menu-separator', 'hbd-menu-group'].includes(tag);
        });
      });
      if (relevant) this._controller.render();
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
    this.removeEventListener('contextmenu', this._onContextMenu);
    this.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('resize', this._onWinResize);
    this._clearLongPress();
  }

  _render() {
    const uid = this._uid;
    this.shadowRoot.innerHTML = `
      <div class="hbd-context-menu">
        <slot></slot>
        <div class="hbd-menu"
             id="ctx-menu-${uid}"
             role="menu"
             aria-label="Context menu"
             tabindex="-1"
             style="position:fixed;top:0;left:0;"></div>
      </div>
    `;
  }

  // ── Trigger handlers ──────────────────────────────────────────────
  _onContextMenu(e) {
    if (this.hasAttribute('disabled')) return;
    e.preventDefault();
    this._clearLongPress();
    this._openAt(e.clientX, e.clientY);
  }

  // Long-press on touch devices: a pointerdown + a 500ms hold without
  // movement opens the menu. Mouse/pen pointers are ignored here —
  // they get the native contextmenu (right-click) path above.
  _onPointerDown(e) {
    if (this.hasAttribute('disabled')) return;
    if (e.pointerType !== 'touch') return;
    this._lpStartX = e.clientX;
    this._lpStartY = e.clientY;
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    this._lpTimer = setTimeout(() => {
      this._lpTimer = null;
      this._lpFiredAt = Date.now();
      this._openAt(this._lpStartX, this._lpStartY);
    }, LONG_PRESS_MS);
  }

  _onPointerMove(e) {
    if (this._lpTimer == null) return;
    const dx = e.clientX - this._lpStartX;
    const dy = e.clientY - this._lpStartY;
    if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE) {
      this._clearLongPress();
    }
  }
  _onPointerUp() {
    this._clearLongPress();
  }
  _clearLongPress() {
    if (this._lpTimer != null) {
      clearTimeout(this._lpTimer);
      this._lpTimer = null;
    }
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  }

  // ── Open at a point ───────────────────────────────────────────────
  _openAt(clientX, clientY) {
    const panel = this.shadowRoot.querySelector('.hbd-menu');
    if (!panel) return;

    // Pre-measure: temporarily reveal opacity 0 so getBoundingClientRect
    // returns real dimensions without flashing the menu visibly.
    const prevOpacity = panel.style.opacity;
    panel.style.opacity = '0';
    panel.style.display = 'block';
    // Reset transform so the controller's open() doesn't fight us.
    panel.style.transform = '';

    // Measure with a temporary position so we know the natural size.
    panel.style.top = '0';
    panel.style.left = '0';
    const rect = panel.getBoundingClientRect();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Default: open below-right of the pointer; flip when overflowing.
    let x = clientX;
    let y = clientY;
    if (x + rect.width > vw) x = Math.max(0, vw - rect.width - 4);
    if (y + rect.height > vh) y = Math.max(0, vh - rect.height - 4);

    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    panel.style.opacity = prevOpacity;
    panel.style.display = '';

    this._controller.open();
  }

  _afterClose() {
    // Context menu doesn't have a trigger element to return focus to —
    // focus stays on the host (the area that was right-clicked). If
    // focus was inside the menu, push it back to the host so the user
    // doesn't lose focus context entirely.
    const root = this.shadowRoot;
    if (root.activeElement
        && root.activeElement.closest
        && root.activeElement.closest('.hbd-menu')) {
      // Make the host focusable (-1) and move focus there.
      if (this.getAttribute('tabindex') == null) this.setAttribute('tabindex', '-1');
      this.focus({ preventScroll: true });
    }
  }

  _onItemSelect({ value, label }) {
    this.dispatchEvent(new CustomEvent('hbd:select', {
      detail: { value, label },
      bubbles: true,
      composed: true,
    }));
  }

  _onWinResize() {
    if (this._controller && this._controller.isOpen()) this._controller.close({ returnFocus: false });
  }
}

if (!customElements.get('hbd-context-menu')) {
  customElements.define('hbd-context-menu', HbdContextMenu);
}
