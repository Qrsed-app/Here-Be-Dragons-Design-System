// ds/components/hbd-toggle-group.js
// Here Be Dragons DS — <hbd-toggle-group> custom element (CLAUDE.md §7).
//
// Light-DOM wrapper that coordinates a row of <hbd-button toggle> children.
// Two modes:
//   single — one-of-N (radio-like). Pressing a button un-presses the others.
//   multi  — independent on/off per button.
//
// ARIA role decision:
//   single mode → role="radiogroup" on the wrapper, each child gets
//     role="radio" + aria-checked (set via the host's `aria-checked` attr
//     so hbd-button.js emits it on the inner button). Rationale: single-
//     select with mutual exclusion IS the radio pattern, and SR users
//     expect "1 of N selected" announcements. Roving tabindex applies.
//   multi mode  → role="group" with aria-label, each child stays a normal
//     button with aria-pressed. Rationale: independent on/off buttons are
//     not radios — they're a collection of toggle buttons. Standard Tab
//     between buttons.
//
// Light DOM: the wrapper does NOT use Shadow DOM. It edits its own host
// element to add the .hbd-toggle-group class + role + aria-label, then
// listens for hbd:toggle events bubbling from the children. The children
// remain plain <hbd-button> hosts — easy for authors to inspect / style.

let uidCounter = 0;

class HbdToggleGroup extends HTMLElement {
  static get observedAttributes() {
    return ['mode', 'label', 'orientation', 'value', 'values', 'disabled'];
  }

  constructor() {
    super();
    this._uid = `hbd-toggle-group-${++uidCounter}`;
    this._values = new Set();       // multi mode
    this._value = '';               // single mode
    this._mo = null;
    this._ready = false;
    this._suppressToggleEvent = false;
    this._onClick = this._onClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    this._applyHostAttrs();
    this._readInitialState();
    this._propagateMarkerClass();
    this._syncPressedFromState();
    this._wireRovingTabindex();
    this._ready = true;

    // Listen for clicks directly on the group rather than relying on the
    // child's hbd:toggle. The hbd-button's own _handleClick already flipped
    // `pressed` synchronously before the click bubbled here — we OVERRIDE
    // that decision because in single mode the radio rules differ (clicking
    // the selected button must NOT un-press it; clicking another button
    // un-presses the previous).
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeydown);

    // Re-sync if children change (added/removed/values change).
    this._mo = new MutationObserver(() => {
      this._propagateMarkerClass();
      this._wireRovingTabindex();
    });
    this._mo.observe(this, { childList: true, subtree: false });
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeydown);
    if (this._mo) { this._mo.disconnect(); this._mo = null; }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (!this._ready) return;
    if (name === 'value' || name === 'values') {
      // Skip the re-sync when the click handler set the attribute itself
      // — it's already managing children directly. This avoids a fight
      // between two paths trying to drive the same DOM state.
      if (this._suppressToggleEvent) return;
      this._readInitialState();
      this._syncPressedFromState();
    }
    if (name === 'mode') {
      // Mode change: re-emit aria-checked vs aria-pressed by toggling
      // the host attribute, which re-renders each button.
      this._applyHostAttrs();
      this._propagateMarkerClass();
      this._syncPressedFromState();
      this._wireRovingTabindex();
    }
    if (name === 'orientation' || name === 'label' || name === 'disabled') {
      this._applyHostAttrs();
    }
  }

  // ── Public API ──────────────────────────────────────────────────────
  get value() { return this._value; }
  set value(v) { this.setAttribute('value', v == null ? '' : String(v)); }
  get values() { return [...this._values]; }

  // ── Helpers ─────────────────────────────────────────────────────────
  get _mode() {
    return this.getAttribute('mode') === 'multi' ? 'multi' : 'single';
  }
  get _isVertical() {
    return this.getAttribute('orientation') === 'vertical';
  }
  _children() {
    return Array.from(this.querySelectorAll(':scope > hbd-button'));
  }
  _enabledChildren() {
    return this._children().filter((b) => !b.hasAttribute('disabled'));
  }

  _applyHostAttrs() {
    this.classList.add('hbd-toggle-group');
    this.classList.toggle('hbd-toggle-group--vertical', this._isVertical);

    const label = this.getAttribute('label') || '';
    if (label) this.setAttribute('aria-label', label);

    if (this._mode === 'single') {
      this.setAttribute('role', 'radiogroup');
    } else {
      this.setAttribute('role', 'group');
    }
  }

  // Mark every child host with the in-group class so button.css's
  // :host(.hbd-button--in-group) rule strips its inner border + radius.
  // In single mode, also set the `aria-checked` marker attribute on the
  // host so hbd-button.js emits aria-checked instead of aria-pressed.
  _propagateMarkerClass() {
    const wantChecked = this._mode === 'single';
    const isVertical = this._isVertical;
    this._children().forEach((btn) => {
      btn.classList.add('hbd-button--in-group');
      btn.classList.toggle('hbd-button--in-group-vertical', isVertical);
      if (wantChecked) {
        if (!btn.hasAttribute('aria-checked')) {
          btn.setAttribute('aria-checked',
            btn.hasAttribute('pressed') ? 'true' : 'false');
        }
      } else {
        btn.removeAttribute('aria-checked');
      }
    });
  }

  _readInitialState() {
    if (this._mode === 'single') {
      // Attribute wins; otherwise pick up whichever child has `pressed`.
      const attrVal = this.getAttribute('value');
      if (attrVal != null && attrVal !== '') {
        this._value = attrVal;
      } else {
        const pressedChild = this._children().find((b) => b.hasAttribute('pressed'));
        this._value = pressedChild ? (pressedChild.getAttribute('value') || '') : '';
      }
    } else {
      // multi
      const attrVals = this.getAttribute('values');
      if (attrVals) {
        try {
          const arr = JSON.parse(attrVals);
          if (Array.isArray(arr)) this._values = new Set(arr.map(String));
        } catch { /* ignore */ }
      } else {
        this._values = new Set(
          this._children()
            .filter((b) => b.hasAttribute('pressed'))
            .map((b) => b.getAttribute('value') || ''),
        );
      }
    }
  }

  _syncPressedFromState() {
    if (this._mode === 'single') {
      this._children().forEach((btn) => {
        const isPressed = btn.getAttribute('value') === this._value;
        btn.toggleAttribute('pressed', isPressed);
        btn.setAttribute('aria-checked', isPressed ? 'true' : 'false');
      });
    } else {
      this._children().forEach((btn) => {
        const isPressed = this._values.has(btn.getAttribute('value') || '');
        btn.toggleAttribute('pressed', isPressed);
      });
    }
  }

  // ── Roving tabindex (single mode) ───────────────────────────────────
  // In radiogroup, exactly one child carries tabindex=0; the rest are -1.
  // Arrow keys move focus AND select. The button's inner shadow <button>
  // is the actual focus target — we set tabindex on the host, which the
  // inner button does not currently propagate. We propagate it via a
  // direct DOM reach into the shadow root after each change.
  _wireRovingTabindex() {
    if (this._mode !== 'single') {
      // Multi: every enabled button is independently tabbable. Strip any
      // tabindex we may have set previously.
      this._children().forEach((btn) => this._setInnerTabindex(btn, null));
      return;
    }
    const enabled = this._enabledChildren();
    if (enabled.length === 0) return;
    const pressedIdx = enabled.findIndex((b) => b.hasAttribute('pressed'));
    const target = pressedIdx >= 0 ? enabled[pressedIdx] : enabled[0];
    enabled.forEach((btn) => {
      this._setInnerTabindex(btn, btn === target ? '0' : '-1');
    });
  }

  _setInnerTabindex(host, value) {
    // Reach into the button's shadow root to set tabindex on the native
    // <button>. If the shadow root hasn't upgraded yet, defer one tick.
    const apply = () => {
      const inner = host.shadowRoot && host.shadowRoot.querySelector('button');
      if (!inner) return;
      if (value == null) inner.removeAttribute('tabindex');
      else inner.setAttribute('tabindex', value);
    };
    if (host.shadowRoot) apply();
    else queueMicrotask(apply);
  }

  // ── Events ──────────────────────────────────────────────────────────
  // Click handler on the group itself. The click event bubbles from the
  // inner shadow button up through the hbd-button host and into the group
  // (Light DOM). hbd-button's own click handler already flipped `pressed`
  // synchronously before this fires — we read the post-flip state and
  // correct it as needed for the group's coordination rules.
  _onClick(e) {
    const btn = e.target.closest('hbd-button');
    if (!btn || btn.parentElement !== this) return;
    if (btn.hasAttribute('disabled')) return;
    const value = btn.getAttribute('value') || '';
    const nowPressed = btn.hasAttribute('pressed');

    if (this._mode === 'single') {
      // Radio behaviour: clicking the already-selected button must NOT
      // un-press it. The child's _handleClick just toggled `pressed`, so
      // if the post-click state is "not pressed" we know the user clicked
      // the previously-selected button — restore it.
      if (!nowPressed) {
        btn.setAttribute('pressed', '');
        btn.setAttribute('aria-checked', 'true');
        return;
      }
      // User picked a new button. Sync state, un-press others.
      this._value = value;
      // Updating the attribute would trigger our own attributeChangedCallback
      // → _syncPressedFromState, which fights with the work we're doing here.
      // Skip the round-trip by setting the attribute WITHOUT re-running sync.
      this._setValueSilently(value);
      this._children().forEach((other) => {
        if (other === btn) return;
        if (other.hasAttribute('pressed')) {
          other.removeAttribute('pressed');
        }
        other.setAttribute('aria-checked', 'false');
      });
      btn.setAttribute('aria-checked', 'true');
      this._wireRovingTabindex();
      this.dispatchEvent(new CustomEvent('hbd:change', {
        detail: { value: this._value },
        bubbles: true,
        composed: true,
      }));
      return;
    }

    // Multi mode — the child already toggled itself. Just track the set.
    if (nowPressed) this._values.add(value);
    else this._values.delete(value);
    this._setValuesSilently([...this._values]);
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { values: [...this._values] },
      bubbles: true,
      composed: true,
    }));
  }

  // Set the `value` attribute without triggering our own re-sync — used
  // when the click handler is already managing the children directly.
  _setValueSilently(v) {
    this._suppressToggleEvent = true;
    try { this.setAttribute('value', v == null ? '' : String(v)); }
    finally { this._suppressToggleEvent = false; }
  }
  _setValuesSilently(arr) {
    this._suppressToggleEvent = true;
    try { this.setAttribute('values', JSON.stringify(arr)); }
    finally { this._suppressToggleEvent = false; }
  }

  _onKeydown(e) {
    if (this._mode !== 'single') return;
    const enabled = this._enabledChildren();
    if (enabled.length === 0) return;

    // Find the currently-focused child via document.activeElement →
    // composedPath — focus lives on the inner button inside the shadow.
    const active = e.target.closest('hbd-button');
    if (!active || active.parentElement !== this) return;
    const curIdx = enabled.indexOf(active);
    if (curIdx < 0) return;

    let nextIdx = -1;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIdx = (curIdx + 1) % enabled.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIdx = (curIdx - 1 + enabled.length) % enabled.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIdx = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIdx = enabled.length - 1;
        break;
      default:
        return;
    }
    if (nextIdx < 0 || nextIdx === curIdx) return;
    const next = enabled[nextIdx];
    // Activate (radio: arrow moves AND selects).
    const value = next.getAttribute('value') || '';
    this._value = value;
    this.setAttribute('value', value);
    enabled.forEach((b) => {
      const press = b === next;
      b.toggleAttribute('pressed', press);
      b.setAttribute('aria-checked', press ? 'true' : 'false');
    });
    this._wireRovingTabindex();
    // Move focus to the newly-selected button.
    queueMicrotask(() => {
      const inner = next.shadowRoot && next.shadowRoot.querySelector('button');
      if (inner) inner.focus();
    });
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { value },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('hbd-toggle-group')) {
  customElements.define('hbd-toggle-group', HbdToggleGroup);
}
