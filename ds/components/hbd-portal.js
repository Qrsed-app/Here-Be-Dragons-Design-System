// ds/components/hbd-portal.js
// Here Be Dragons DS — <hbd-portal> custom element (CLAUDE.md §7).
//
// Light DOM, no Shadow DOM, no styles. A portal moves its Light-DOM
// children to a target element elsewhere in the document, then
// removes them when the portal disconnects.
//
// Authoring shape:
//
//   <hbd-portal target="#overlay-root">
//     <div class="my-floating-panel">…</div>
//   </hbd-portal>
//
//   <!-- elsewhere in the page -->
//   <div id="overlay-root"></div>
//
// Attributes:
//   target  — CSS selector for the destination element. Default "body".
//   prepend — boolean; prepends instead of appending. Useful for
//             skip-link-style outlets that must appear first inside
//             the target.
//
// A MutationObserver on the host catches dynamic child additions
// (e.g. React/Vue inserting new content) and routes them to the
// target as they arrive.
//
// Limitations (documented for authors):
//   1. No Shadow DOM boundary. Styles defined inside the target's
//      ancestry CASCADE onto the moved nodes — if you portal into
//      <body> you inherit body's font-family, etc.
//   2. Event bubbling follows the DOM tree, so a click on the
//      moved content bubbles up through the TARGET ancestry, not
//      through the portal's logical position. Use composedPath()
//      with a known-marker class if you need to associate the
//      event with the portal's owner.
//   3. Focus management across portals is the author's concern —
//      Tab order follows the DOM, so focus moves to wherever the
//      portalled content actually sits, not where the portal tag
//      is written.
//   4. Multiple portals targeting the same element append in the
//      order their portals connected to the document.
//
// Typical use cases:
//   - Rendering content into a named outlet slot in the page shell.
//   - Floating panels (modals, popovers) that need to escape
//     overflow:hidden ancestors when position:fixed isn't enough.
//   - Putting toast-style messages into a dedicated <body>-level
//     stack from any depth in the component tree.

class HbdPortal extends HTMLElement {
  static get observedAttributes() {
    return ['target', 'prepend'];
  }

  constructor() {
    super();
    this._movedNodes = [];
    this._observer = null;
    this._onMutation = this._onMutation.bind(this);
  }

  connectedCallback() {
    // Move current children to the target on initial connect.
    this._relocateInitial();

    // Watch for subsequent dynamic additions to the portal host.
    this._observer = new MutationObserver(this._onMutation);
    this._observer.observe(this, { childList: true });
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    // Per the spec: when the portal disappears, its outsourced
    // children disappear too. Some authors might prefer to move
    // them back to the portal host — but that host is itself being
    // removed, so the cleaner contract is "remove them outright".
    for (const node of this._movedNodes) {
      if (node.parentNode) node.parentNode.removeChild(node);
    }
    this._movedNodes = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    if (name === 'target' || name === 'prepend') {
      // Pull anything we already moved back into the portal host so
      // _relocateInitial() can re-route them to the NEW target.
      for (const node of this._movedNodes) {
        if (node.parentNode) node.parentNode.removeChild(node);
        this.appendChild(node);
      }
      this._movedNodes = [];
      this._relocateInitial();
    }
  }

  _targetEl() {
    const selector = this.getAttribute('target') || 'body';
    return document.querySelector(selector) || document.body;
  }

  _relocateInitial() {
    const target = this._targetEl();
    if (!target) return;
    const prepend = this.hasAttribute('prepend');
    const moving = Array.from(this.childNodes);
    if (moving.length === 0) return;

    if (prepend) {
      // Prepend in REVERSE order so the final on-target order matches
      // the authored source order: child[0] ends up first.
      for (let i = moving.length - 1; i >= 0; i -= 1) {
        target.prepend(moving[i]);
        this._movedNodes.push(moving[i]);
      }
      // Reverse the bookkeeping list back to source order.
      this._movedNodes.reverse();
    } else {
      for (const node of moving) {
        target.appendChild(node);
        this._movedNodes.push(node);
      }
    }
  }

  _onMutation(records) {
    const target = this._targetEl();
    if (!target) return;
    const prepend = this.hasAttribute('prepend');

    for (const record of records) {
      // Newly authored children → route to target.
      for (const added of Array.from(record.addedNodes)) {
        // Skip if it's already in our moved-nodes list (e.g. a
        // re-insertion from attribute-change rerouting).
        if (this._movedNodes.includes(added)) continue;
        if (prepend) target.prepend(added);
        else target.appendChild(added);
        this._movedNodes.push(added);
      }
      // Children removed from the portal host → also remove from
      // the target if we put them there. (Author code might
      // explicitly remove children; we honour that.)
      for (const removed of Array.from(record.removedNodes)) {
        const idx = this._movedNodes.indexOf(removed);
        if (idx === -1) continue;
        if (removed.parentNode === target) target.removeChild(removed);
        this._movedNodes.splice(idx, 1);
      }
    }
  }
}

if (!customElements.get('hbd-portal')) {
  customElements.define('hbd-portal', HbdPortal);
}
