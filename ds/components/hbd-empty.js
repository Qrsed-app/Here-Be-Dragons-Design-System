// ds/components/hbd-empty.js
// Here Be Dragons DS — <hbd-empty> custom element (CLAUDE.md §7).
//
// Light DOM. Four canonical templates communicate why content is
// absent and what the user can do next:
//
//   no-data     — a list or table has no records yet
//   no-results  — a search or filter returned nothing
//   error       — something went wrong loading the content
//   offline     — no network connection
//
// Authoring shape:
//
//   <hbd-empty template="no-data">
//     <hbd-button variant="primary">Add Spell</hbd-button>
//   </hbd-empty>
//
// Any author-supplied children are moved into the actions row.
// Re-renders preserve those nodes (and their listeners) by ripping
// them off the host before clearing innerHTML and re-appending them
// after — same pattern as hbd-card / hbd-list.
//
// Attributes:
//   template       — "no-data" (default) | "no-results" | "error" | "offline"
//   heading        — overrides the template's default heading
//   description    — overrides the template's default description
//   heading-level  — "2" (default) | "3" | "4" — semantic heading tag
//   size           — "sm" | "md" (default) | "lg"
//   inline         — boolean; horizontal layout (icon left of text)

const TEMPLATES = {
  'no-data': {
    heading: 'Nothing here yet',
    description: 'Add your first item to get started.',
    // Open scroll — ribbons on the sides, two ruled lines.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M16 14h32a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H16"/>' +
        '<path d="M16 14a6 6 0 0 0-6 6v24a6 6 0 0 0 6 6 6 6 0 0 0 6-6V20a6 6 0 0 0-6-6z"/>' +
        '<path d="M48 14a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6"/>' +
        '<line x1="26" y1="24" x2="46" y2="24"/>' +
        '<line x1="26" y1="32" x2="46" y2="32"/>' +
        '<line x1="26" y1="40" x2="40" y2="40"/>' +
      '</svg>',
  },
  'no-results': {
    heading: 'No results found',
    description: 'Try adjusting your search or filters.',
    // Magnifying glass with a small × inside.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<circle cx="28" cy="28" r="16"/>' +
        '<line x1="40" y1="40" x2="54" y2="54"/>' +
        '<line x1="22" y1="22" x2="34" y2="34"/>' +
        '<line x1="34" y1="22" x2="22" y2="34"/>' +
      '</svg>',
  },
  'error': {
    heading: 'Something went wrong',
    description: 'An error occurred while loading this content. Please try again.',
    // Warning rune — triangle with exclamation.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M32 10 L56 52 H8 Z"/>' +
        '<line x1="32" y1="26" x2="32" y2="38"/>' +
        '<circle cx="32" cy="44" r="1.5" fill="currentColor" stroke="none"/>' +
      '</svg>',
  },
  'offline': {
    heading: 'You appear to be offline',
    description: 'Check your connection and try again.',
    // Disconnected crystal ball — orb with a diagonal slash.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<circle cx="32" cy="30" r="16"/>' +
        '<path d="M22 50h20"/>' +
        '<path d="M20 54h24"/>' +
        '<line x1="14" y1="14" x2="50" y2="50"/>' +
      '</svg>',
  },
};

const VALID_LEVELS = ['2', '3', '4'];
const VALID_SIZES  = ['sm', 'md', 'lg'];

class HbdEmpty extends HTMLElement {
  static get observedAttributes() {
    return ['template', 'heading', 'description', 'heading-level', 'size', 'inline'];
  }

  constructor() {
    super();
    this._ready = false;
  }

  connectedCallback() {
    this._ready = true;
    this._render();
  }

  attributeChangedCallback(_n, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  _template() {
    const raw = (this.getAttribute('template') || 'no-data').toLowerCase();
    return TEMPLATES[raw] ? raw : 'no-data';
  }

  _size() {
    const raw = (this.getAttribute('size') || 'md').toLowerCase();
    return VALID_SIZES.includes(raw) ? raw : 'md';
  }

  _headingLevel() {
    const raw = (this.getAttribute('heading-level') || '2').toString();
    return VALID_LEVELS.includes(raw) ? raw : '2';
  }

  _escapeText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _render() {
    // 1. Snapshot author-supplied action children BEFORE clearing
    //    innerHTML so listeners survive a re-render. Skip any internal
    //    wrappers from a previous render — only nodes the author put
    //    on the host are real actions.
    const actions = [];
    for (const child of Array.from(this.children)) {
      if (
        child.classList &&
        (child.classList.contains('hbd-empty__illustration') ||
         child.classList.contains('hbd-empty__content'))
      ) {
        // Internal wrapper from a previous render — try to reclaim
        // any nested action nodes the author had already moved.
        const prevActions = child.querySelector('.hbd-empty__actions');
        if (prevActions) {
          for (const n of Array.from(prevActions.children)) actions.push(n);
        }
        continue;
      }
      actions.push(child);
    }

    const templateKey = this._template();
    const t = TEMPLATES[templateKey];
    const size = this._size();
    const inline = this.hasAttribute('inline');

    const headingText = this.getAttribute('heading') || t.heading;
    const descriptionText = this.getAttribute('description') || t.description;
    const hLevel = this._headingLevel();
    const hTag = 'h' + hLevel;

    // 2. Host classes
    const classes = ['hbd-empty'];
    if (size === 'sm') classes.push('hbd-empty--sm');
    if (size === 'lg') classes.push('hbd-empty--lg');
    if (inline)        classes.push('hbd-empty--inline');
    this.className = classes.join(' ');
    this.setAttribute('data-template', templateKey);

    // 3. Render structure. The illustration is purely decorative —
    //    aria-hidden lives on the wrapper, the inline SVG repeats
    //    aria-hidden + focusable="false" for older AT. The heading
    //    carries the accessible name.
    this.innerHTML =
      `<div class="hbd-empty__illustration" aria-hidden="true">${t.icon}</div>` +
      `<div class="hbd-empty__content">` +
        `<${hTag} class="hbd-empty__heading">${this._escapeText(headingText)}</${hTag}>` +
        `<p class="hbd-empty__description">${this._escapeText(descriptionText)}</p>` +
        `<div class="hbd-empty__actions"${actions.length ? '' : ' data-empty'}></div>` +
      `</div>`;

    // 4. Re-append authored action nodes — original DOM identity
    //    preserved, so any addEventListener bindings still fire.
    const actionsEl = this.querySelector('.hbd-empty__actions');
    for (const node of actions) {
      actionsEl.appendChild(node);
    }
  }
}

if (!customElements.get('hbd-empty')) {
  customElements.define('hbd-empty', HbdEmpty);
}
