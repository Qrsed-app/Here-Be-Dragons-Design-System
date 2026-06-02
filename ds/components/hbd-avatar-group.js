// ds/components/hbd-avatar-group.js
// Here Be Dragons DS — <hbd-avatar-group> custom element (CLAUDE.md §7).
//
// Light DOM. Wraps a sequence of <hbd-avatar> children, renders the
// first `max` of them, and adds a "+N" overflow bubble for the rest.
//
// Attributes:
//   max   — number of avatars to render before the overflow bubble
//           (default "5"). When the child count is <= max, the bubble
//           is omitted.
//   size  — propagated to every child avatar (overrides their own
//           size attribute). Optional.
//
// Authors write:
//   <hbd-avatar-group max="5" size="md" aria-label="Party members">
//     <hbd-avatar name="Aragorn"></hbd-avatar>
//     <hbd-avatar name="Legolas"></hbd-avatar>
//     <hbd-avatar name="Gimli"></hbd-avatar>
//     <hbd-avatar name="Boromir"></hbd-avatar>
//     <hbd-avatar name="Frodo"></hbd-avatar>
//     <hbd-avatar name="Samwise"></hbd-avatar>
//     <hbd-avatar name="Merry"></hbd-avatar>
//     <hbd-avatar name="Pippin"></hbd-avatar>
//   </hbd-avatar-group>

class HbdAvatarGroup extends HTMLElement {
  static get observedAttributes() {
    return ['max', 'size'];
  }

  constructor() {
    super();
    this._ready = false;
    this._avatars = [];
    this._mo = null;
  }

  connectedCallback() {
    this._snapshotAvatars();
    this._ready = true;
    this._render();
    // Watch for late insertion of additional <hbd-avatar> children
    // (e.g. via JS). Re-snapshot + re-render on changes.
    this._mo = new MutationObserver(() => {
      this._snapshotAvatars();
      this._render();
    });
    this._mo.observe(this, { childList: true });
  }

  disconnectedCallback() {
    if (this._mo) {
      this._mo.disconnect();
      this._mo = null;
    }
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  // ─── Snapshot the authored children ───────────────────────────────
  // We capture the original hbd-avatar nodes once on connect, then
  // move references between the rendered output. This preserves any
  // listeners or attributes the author set on them.
  _snapshotAvatars() {
    const existing = new Set(this._avatars);
    const fresh = Array.from(this.querySelectorAll(':scope > hbd-avatar'));
    fresh.forEach((el) => existing.delete(el));
    // existing now holds any old avatars that have been removed from
    // the live DOM — drop them from our cache.
    this._avatars = fresh;
  }

  // ─── Attribute readers ────────────────────────────────────────────
  get _max() {
    const n = parseInt(this.getAttribute('max'), 10);
    return Number.isFinite(n) && n > 0 ? n : 5;
  }
  get _size() {
    const s = (this.getAttribute('size') || '').toLowerCase();
    return ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(s) ? s : '';
  }

  // ─── Render ───────────────────────────────────────────────────────
  _render() {
    if (!this._ready) return;
    // Pause the child-mutation observer for the duration of this
    // render — we are about to move children around inside the host,
    // and each move would otherwise re-fire the observer and recurse.
    if (this._mo) this._mo.disconnect();

    this.className = 'hbd-avatar-group';
    // Authors can override the aria-label by setting it on the host;
    // otherwise we provide a sensible default that reports the total
    // count (NOT just the visible-count) so SR users get accurate info.
    if (!this.hasAttribute('aria-label')) {
      const count = this._avatars.length;
      this.setAttribute('aria-label',
        `${count} ${count === 1 ? 'participant' : 'participants'}`);
    }
    this.setAttribute('role', 'group');

    const max = this._max;
    const total = this._avatars.length;
    const overflowCount = Math.max(0, total - max);
    const visible = this._avatars.slice(0, max);
    const hidden  = this._avatars.slice(max);

    // Propagate size if set on the group.
    const groupSize = this._size;
    if (groupSize) {
      this._avatars.forEach((a) => a.setAttribute('size', groupSize));
    }

    // Re-parent the visible avatars in order. We avoid clearing the
    // whole host with innerHTML so the existing nodes keep their
    // listeners; instead we explicitly remove the previous overflow
    // bubble + any hidden avatars, then ensure visible nodes appear
    // in the right order.
    const oldOverflow = this.querySelector(':scope > .hbd-avatar-group__overflow');
    if (oldOverflow) oldOverflow.remove();
    hidden.forEach((el) => {
      if (el.parentNode === this) el.remove();
    });
    // Re-append visible avatars in order. appendChild on an existing
    // child moves it without recreating it.
    visible.forEach((el) => this.appendChild(el));

    let bubble = null;
    if (overflowCount > 0) {
      bubble = document.createElement('span');
      // Inherit the avatar base + size styling for parity with the
      // siblings.
      const sizeClass = groupSize
        ? `hbd-avatar--${groupSize}`
        : `hbd-avatar--${visible[0]
            ? (visible[0].getAttribute('size') || 'md')
            : 'md'}`;
      bubble.className = `hbd-avatar ${sizeClass} hbd-avatar-group__overflow`;
      // The bubble's role + label communicate the overflow count to
      // SR. The avatars hidden behind it are already counted in the
      // group's own aria-label above.
      bubble.setAttribute('role', 'img');
      bubble.setAttribute('aria-label', `${overflowCount} more`);
      bubble.textContent = `+${overflowCount}`;
      this.appendChild(bubble);
    }

    // Re-arm the observer for future authored insertions/removals.
    if (this._mo) {
      this._mo.observe(this, { childList: true });
    }
  }
}

if (!customElements.get('hbd-avatar-group')) {
  customElements.define('hbd-avatar-group', HbdAvatarGroup);
}
