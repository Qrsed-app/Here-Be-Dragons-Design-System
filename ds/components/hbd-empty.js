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

  // ── Section-level error templates (Phase 5) ────────────────────
  // Heading communicates the error in TEXT (SC 3.3.1) — the colour
  // tint added by .hbd-empty--error is supplementary, not the sole
  // carrier of meaning (SC 1.4.1).
  'error-404': {
    heading: 'Page not found',
    description: "The page you're looking for doesn't exist or has been moved.",
    // Compass with a broken needle.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<circle cx="32" cy="32" r="20"/>' +
        '<circle cx="32" cy="32" r="2.5" fill="currentColor" stroke="none"/>' +
        // North half of the needle — intact.
        '<path d="M32 32 L26 18"/>' +
        // South half — broken, displaced.
        '<path d="M38 46 L42 50"/>' +
        '<path d="M32 32 L36 42"/>' +
        // Compass tick marks at the cardinal points.
        '<line x1="32" y1="10" x2="32" y2="14"/>' +
        '<line x1="32" y1="50" x2="32" y2="54"/>' +
        '<line x1="10" y1="32" x2="14" y2="32"/>' +
        '<line x1="50" y1="32" x2="54" y2="32"/>' +
      '</svg>',
  },
  'error-500': {
    heading: 'Server error',
    description: "Something went wrong on our end. We've been notified and are working on a fix.",
    // Broken gear — cog with one missing tooth and a crack.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<circle cx="32" cy="32" r="10"/>' +
        '<circle cx="32" cy="32" r="4"/>' +
        // Seven cog teeth (the 8th — top-right — is missing).
        '<path d="M32 14 L32 22"/>' +
        '<path d="M32 42 L32 50"/>' +
        '<path d="M14 32 L22 32"/>' +
        '<path d="M42 32 L50 32"/>' +
        '<path d="M19 19 L25 25"/>' +
        '<path d="M39 39 L45 45"/>' +
        '<path d="M19 45 L25 39"/>' +
        // Crack across the gear.
        '<path d="M22 24 L30 32 L26 36 L34 44"/>' +
      '</svg>',
  },
  'error-403': {
    heading: 'Access forbidden',
    description: "You don't have permission to view this content.",
    // Locked shield.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M32 10 L52 18 V34 C52 44 42 52 32 56 C22 52 12 44 12 34 V18 Z"/>' +
        // Padlock body.
        '<rect x="24" y="30" width="16" height="14" rx="1.5"/>' +
        // Shackle.
        '<path d="M27 30 V25 a5 5 0 0 1 10 0 V30"/>' +
        // Keyhole.
        '<line x1="32" y1="35" x2="32" y2="40"/>' +
      '</svg>',
  },
  'error-network': {
    heading: 'Connection failed',
    description: 'Check your network connection and try again.',
    // Severed arcane link — two ring-and-chain halves with a break.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        // Left chain link.
        '<rect x="10" y="24" width="18" height="16" rx="8"/>' +
        // Right chain link.
        '<rect x="36" y="24" width="18" height="16" rx="8"/>' +
        // Diagonal slashes at the break.
        '<line x1="28" y1="20" x2="36" y2="44"/>' +
        '<line x1="36" y1="20" x2="28" y2="44"/>' +
      '</svg>',
  },
  'error-form': {
    heading: 'Submission failed',
    description: 'Please check the form for errors and try again.',
    // Scroll with an × overlay.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M16 14h32a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H16"/>' +
        '<path d="M16 14a6 6 0 0 0-6 6v24a6 6 0 0 0 6 6 6 6 0 0 0 6-6V20a6 6 0 0 0-6-6z"/>' +
        '<line x1="26" y1="24" x2="46" y2="24"/>' +
        '<line x1="26" y1="32" x2="46" y2="32"/>' +
        // × overlay on the lower half.
        '<line x1="27" y1="38" x2="43" y2="48"/>' +
        '<line x1="43" y1="38" x2="27" y2="48"/>' +
      '</svg>',
  },

  // ── Section-level success templates (Phase 5) ──────────────────
  'success-submitted': {
    heading: 'Submitted successfully',
    description: 'Your request has been received and is being processed.',
    // Circle checkmark.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<circle cx="32" cy="32" r="22"/>' +
        '<polyline points="20,32 28,40 44,24"/>' +
      '</svg>',
  },
  'success-saved': {
    heading: 'Changes saved',
    description: 'Your changes have been saved successfully.',
    // Smaller checkmark inside a circle.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<circle cx="32" cy="32" r="20" stroke-opacity="0.7"/>' +
        '<polyline points="22,32 30,39 42,26"/>' +
      '</svg>',
  },
  'success-completed': {
    heading: 'All done!',
    description: "You've completed all the required steps.",
    // Trophy with a star above.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        // Cup.
        '<path d="M22 18h20v10 a10 10 0 0 1 -20 0z"/>' +
        // Side handles.
        '<path d="M42 22 a4 4 0 0 1 0 8"/>' +
        '<path d="M22 22 a4 4 0 0 0 0 8"/>' +
        // Stem + base.
        '<path d="M32 40 V46"/>' +
        '<path d="M24 50h16"/>' +
        // Star above.
        '<path d="M32 6 L34 10 L38 10.5 L35 13 L36 17 L32 15 L28 17 L29 13 L26 10.5 L30 10 Z"/>' +
      '</svg>',
  },
  'success-welcome': {
    heading: 'Welcome, adventurer',
    description: 'Your account is ready. Begin your journey.',
    // Glowing open doorway.
    icon:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        // Outer arch.
        '<path d="M16 54 V24 a16 16 0 0 1 32 0 V54"/>' +
        // Inner arch (the opening).
        '<path d="M22 54 V26 a10 10 0 0 1 20 0 V54"/>' +
        // Glow rays above the arch.
        '<path d="M32 4 V10"/>' +
        '<path d="M20 8 L23 13"/>' +
        '<path d="M44 8 L41 13"/>' +
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

    // 2. Host classes. Template keys that start with "error-" or
    //    "success-" add a semantic modifier so empty-state.css can
    //    tint the illustration with the matching status colour. The
    //    legacy "error" template (no suffix) also gets --error so
    //    it picks up the same treatment retroactively. Heading text
    //    still carries the meaning (SC 1.4.1 / SC 3.3.1); the colour
    //    is supplementary.
    const classes = ['hbd-empty'];
    if (size === 'sm') classes.push('hbd-empty--sm');
    if (size === 'lg') classes.push('hbd-empty--lg');
    if (inline)        classes.push('hbd-empty--inline');
    if (templateKey === 'error' || templateKey.startsWith('error-')) {
      classes.push('hbd-empty--error');
    } else if (templateKey.startsWith('success-')) {
      classes.push('hbd-empty--success');
    }
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
