// ds/components/hbd-full-banner.js
// Here Be Dragons DS — <hbd-full-banner> custom element (CLAUDE.md §7).
//
// Light DOM. Full-page banner — fills the viewport with a single
// dominant message. Four authoring templates communicate the most
// common takeover states; see TEMPLATES below.
//
// Distinct from hbd-alert with type="banner" (which is a narrow
// sticky ribbon at the top of the page). This component is a
// full-screen takeover with hero typography, illustration, and
// action buttons.
//
// Authoring shape:
//
//   <main>
//     <hbd-full-banner template="maintenance">
//       <hbd-button variant="default">Check status page</hbd-button>
//       <span slot="meta">Expected back online: Friday at 06:00 UTC</span>
//     </hbd-full-banner>
//   </main>
//
// Any author-supplied children become the action row content. A
// child with slot="meta" is treated as a meta line below the
// actions (timestamp / version / link). Re-renders preserve all
// authored nodes (and their listeners) via the snapshot-and-reattach
// pattern used elsewhere in the DS.
//
// Attributes:
//   template       — "maintenance" (default) | "launch" | "restricted" | "offline"
//   heading        — overrides the template's default heading
//   description    — overrides the template's default description
//   eyebrow        — overrides the template's default eyebrow label
//   dark           — boolean; flips to the inverted ink-900 colour scheme
//   heading-level  — "1" (default) | "2" | "3" — semantic heading tag
//
// Page-context expectations (documented for authors):
//   - SC 1.3.1: wrap the banner in <main> so the page has a main
//     landmark. The banner itself does not assume a landmark role.
//   - SC 2.4.2: when used as a true full-page replacement, the
//     document <title> must reflect the banner state. The component
//     does NOT mutate document.title — that is the author's call.

const TEMPLATES = {
  maintenance: {
    eyebrow: 'Scheduled Maintenance',
    heading: 'We’ll be back shortly',
    description:
      'The arcane servers are undergoing maintenance. We expect to be back online within 2 hours.',
    // Cog with magical sparkle accents.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<circle cx="48" cy="48" r="14"/>' +
        '<circle cx="48" cy="48" r="6"/>' +
        // Eight cog teeth equally spaced.
        '<path d="M48 22 L48 30"/>' +
        '<path d="M48 66 L48 74"/>' +
        '<path d="M22 48 L30 48"/>' +
        '<path d="M66 48 L74 48"/>' +
        '<path d="M30 30 L36 36"/>' +
        '<path d="M60 60 L66 66"/>' +
        '<path d="M66 30 L60 36"/>' +
        '<path d="M30 66 L36 60"/>' +
        // Magical sparkles.
        '<path d="M14 18 L18 22 M14 22 L18 18"/>' +
        '<path d="M78 78 L82 82 M78 82 L82 78"/>' +
      '</svg>',
  },
  launch: {
    eyebrow: 'New Feature',
    heading: 'Something magical is here',
    description:
      'We’ve added new spells to the compendium. Explore what’s new in your spellbook.',
    // Four-pointed star burst with surrounding sparkles.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M48 14 L54 40 L80 48 L54 56 L48 82 L42 56 L16 48 L42 40 Z"/>' +
        '<path d="M20 22 L24 26 M20 26 L24 22"/>' +
        '<path d="M72 18 L76 22 M72 22 L76 18"/>' +
        '<path d="M76 70 L80 74 M76 74 L80 70"/>' +
      '</svg>',
  },
  restricted: {
    eyebrow: 'Access Restricted',
    heading: 'You don’t have permission',
    description:
      'You don’t have the required permissions to view this page. Contact your dungeon master.',
    // Locked tome — book with a padlock overlay.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M22 18h44a6 6 0 0 1 6 6v48a6 6 0 0 1-6 6H22"/>' +
        '<path d="M22 18a6 6 0 0 0-6 6v48a6 6 0 0 0 6 6 6 6 0 0 0 6-6V24a6 6 0 0 0-6-6z"/>' +
        // Padlock at the front.
        '<rect x="38" y="48" width="20" height="16" rx="2"/>' +
        '<path d="M42 48 V42 a6 6 0 0 1 12 0 V48"/>' +
        '<line x1="48" y1="54" x2="48" y2="58"/>' +
      '</svg>',
  },
  offline: {
    eyebrow: 'No Connection',
    heading: 'You’re offline',
    description: 'Check your arcane connection and try again.',
    // Crystal orb on a stand with a diagonal "disconnected" slash.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<circle cx="48" cy="42" r="22"/>' +
        '<path d="M32 70h32"/>' +
        '<path d="M28 76h40"/>' +
        // Inner highlight.
        '<circle cx="40" cy="34" r="4" stroke-opacity="0.5"/>' +
        // Disconnected diagonal slash.
        '<line x1="20" y1="20" x2="76" y2="76"/>' +
      '</svg>',
  },

  // ── Full-page error templates (Phase 5) ────────────────────────
  // Heading + description communicate the error in TEXT (SC 3.3.1).
  // The .hbd-full-banner--error host class tints the eyebrow and
  // illustration via CSS — colour is supplementary, never the sole
  // carrier of meaning.
  'error-404': {
    eyebrow: '404 — Not Found',
    heading: 'You’ve wandered off the map',
    description: 'The page you seek does not exist in this realm. Perhaps it was moved, renamed, or never existed.',
    // Torn map — rectangle with a jagged tear and a compass rose.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        // Map left half.
        '<path d="M12 18 H44 L40 32 L46 44 L40 56 L46 72 L42 84 H12 Z"/>' +
        // Map right half (slightly offset to suggest a tear).
        '<path d="M50 16 H84 V84 H50 L54 72 L48 56 L54 44 L48 32 Z"/>' +
        // Compass rose on the right half.
        '<circle cx="68" cy="48" r="8"/>' +
        '<path d="M68 40 L68 56"/>' +
        '<path d="M60 48 L76 48"/>' +
      '</svg>',
  },
  'error-500': {
    eyebrow: '500 — Server Error',
    heading: 'The arcane servers have faltered',
    description: 'Something broke on our end. Our engineers have been alerted. Please try again in a few moments.',
    // Broken crystal ball — orb fractured into two halves.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        // Top arc of the orb.
        '<path d="M30 50 a18 18 0 0 1 36 0"/>' +
        // Bottom arc of the orb (slightly offset to suggest fracture).
        '<path d="M30 52 a18 18 0 0 0 36 0"/>' +
        // Lightning bolt across the centre.
        '<path d="M50 32 L42 50 L52 50 L46 68"/>' +
        // Stand below.
        '<path d="M34 74 h28"/>' +
        '<path d="M30 80 h36"/>' +
      '</svg>',
  },
  'error-403': {
    eyebrow: '403 — Forbidden',
    heading: 'You shall not pass',
    description: 'You lack the required permissions to enter this area of the realm.',
    // Iron gate with vertical bars and a central lock.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        // Gate frame.
        '<path d="M16 20 H80 V80 H16 Z"/>' +
        '<path d="M16 28 H80"/>' +
        // Vertical bars.
        '<path d="M28 28 V80"/>' +
        '<path d="M40 28 V80"/>' +
        '<path d="M56 28 V80"/>' +
        '<path d="M68 28 V80"/>' +
        // Central padlock.
        '<rect x="42" y="46" width="12" height="14" rx="1.5"/>' +
        '<path d="M44 46 V42 a4 4 0 0 1 8 0 V46"/>' +
      '</svg>',
  },

  // ── Full-page success templates (Phase 5) ──────────────────────
  'success-submitted': {
    eyebrow: 'Success',
    heading: 'Your quest has been accepted',
    description: 'We’ve received your submission and will be in touch shortly.',
    // Wax seal with an embossed checkmark.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        // Outer seal — eight-pointed star edge.
        '<path d="M48 8 L56 18 L70 14 L70 28 L82 34 L74 46 L82 58 L70 64 L70 78 L56 74 L48 84 L40 74 L26 78 L26 64 L14 58 L22 46 L14 34 L26 28 L26 14 L40 18 Z"/>' +
        // Inner medallion.
        '<circle cx="48" cy="46" r="14"/>' +
        // Embossed checkmark inside.
        '<polyline points="38,46 45,53 58,40"/>' +
      '</svg>',
  },
  'success-completed': {
    eyebrow: 'Complete',
    heading: 'Journey complete',
    description: 'You’ve reached the end of this path. Well done, adventurer.',
    // Trophy with laurel branches.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        // Cup.
        '<path d="M32 22 h32 v18 a16 16 0 0 1 -32 0 z"/>' +
        // Side handles.
        '<path d="M64 26 a6 6 0 0 1 0 14"/>' +
        '<path d="M32 26 a6 6 0 0 0 0 14"/>' +
        // Stem + base.
        '<path d="M48 60 v12"/>' +
        '<path d="M36 80 h24"/>' +
        '<path d="M40 72 h16"/>' +
        // Laurel branches flanking the cup.
        '<path d="M22 30 q -6 8 0 18"/>' +
        '<path d="M26 32 l -4 -2"/>' +
        '<path d="M26 40 l -4 -2"/>' +
        '<path d="M26 48 l -4 -2"/>' +
        '<path d="M74 30 q 6 8 0 18"/>' +
        '<path d="M70 32 l 4 -2"/>' +
        '<path d="M70 40 l 4 -2"/>' +
        '<path d="M70 48 l 4 -2"/>' +
      '</svg>',
  },
  'success-welcome': {
    eyebrow: 'Welcome',
    heading: 'Your adventure begins',
    description: 'Your account is ready. The realm awaits.',
    // Open book with a starburst above.
    icon:
      '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        // Book spine (centre vertical line).
        '<path d="M48 36 V80"/>' +
        // Left page.
        '<path d="M48 36 C 36 32, 24 32, 14 36 V76 C 24 72, 36 72, 48 76"/>' +
        // Right page.
        '<path d="M48 36 C 60 32, 72 32, 82 36 V76 C 72 72, 60 72, 48 76"/>' +
        // Ruled lines on each page.
        '<path d="M22 46 h18"/>' +
        '<path d="M22 54 h18"/>' +
        '<path d="M56 46 h18"/>' +
        '<path d="M56 54 h18"/>' +
        // Starburst above the centre of the book.
        '<path d="M48 8 V18"/>' +
        '<path d="M40 12 L44 18"/>' +
        '<path d="M56 12 L52 18"/>' +
      '</svg>',
  },
};

const VALID_LEVELS = ['1', '2', '3'];

class HbdFullBanner extends HTMLElement {
  static get observedAttributes() {
    return ['template', 'heading', 'description', 'eyebrow', 'dark', 'heading-level'];
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

  // ─── Reading helpers ────────────────────────────────────────────
  _template() {
    const raw = (this.getAttribute('template') || 'maintenance').toLowerCase();
    return TEMPLATES[raw] ? raw : 'maintenance';
  }
  _headingLevel() {
    const raw = (this.getAttribute('heading-level') || '1').toString();
    return VALID_LEVELS.includes(raw) ? raw : '1';
  }
  _escapeText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ─── Render ─────────────────────────────────────────────────────
  _render() {
    if (!this._ready) return;

    // 1. Snapshot author-supplied children BEFORE clearing innerHTML
    //    so listeners survive a re-render. Two buckets:
    //      meta   — children with slot="meta" (timestamp / version / link)
    //      action — everything else (typically <hbd-button> CTAs)
    //    Internal wrappers from a previous render are skipped; any
    //    children they contain are reclaimed.
    const actions = [];
    const meta = [];

    for (const child of Array.from(this.children)) {
      if (
        child.classList &&
        (child.classList.contains('hbd-full-banner__illustration') ||
         child.classList.contains('hbd-full-banner__inner'))
      ) {
        // Internal wrapper from a previous render — reclaim its
        // authored descendants from the actions and meta rows.
        const prevActions = child.querySelector('.hbd-full-banner__actions');
        if (prevActions) {
          for (const n of Array.from(prevActions.children)) actions.push(n);
        }
        const prevMeta = child.querySelector('.hbd-full-banner__meta');
        if (prevMeta) {
          for (const n of Array.from(prevMeta.childNodes)) meta.push(n);
        }
        continue;
      }
      if (child.getAttribute && child.getAttribute('slot') === 'meta') {
        meta.push(child);
      } else {
        actions.push(child);
      }
    }

    // 2. Resolve template + attribute overrides.
    const templateKey = this._template();
    const t = TEMPLATES[templateKey];
    const dark = this.hasAttribute('dark');
    const headingLevel = this._headingLevel();
    const hTag = 'h' + headingLevel;

    const eyebrowText = this.getAttribute('eyebrow') || t.eyebrow;
    const headingText = this.getAttribute('heading') || t.heading;
    const descriptionText = this.getAttribute('description') || t.description;

    // 3. Host classes. Templates that start with "error-" or
    //    "success-" pick up a semantic modifier class so the
    //    stylesheet can tint the eyebrow + illustration with the
    //    matching status colour. The heading + description still
    //    carry the meaning in text (SC 1.4.1, SC 3.3.1).
    const classes = ['hbd-full-banner', `hbd-full-banner--${templateKey}`];
    if (templateKey.startsWith('error-')) {
      classes.push('hbd-full-banner--error');
    } else if (templateKey.startsWith('success-')) {
      classes.push('hbd-full-banner--success');
    }
    if (dark) classes.push('hbd-full-banner--dark');
    this.className = classes.join(' ');
    this.setAttribute('data-template', templateKey);

    // 4. Markup. The illustration is decorative — aria-hidden lives
    //    on the wrapper, the inline SVG repeats aria-hidden +
    //    focusable="false" for older AT. The heading carries the
    //    accessible name of the banner.
    const actionsEmpty = actions.length === 0 ? ' data-empty="true"' : '';
    const metaEmpty = meta.length === 0 ? ' data-empty="true"' : '';

    this.innerHTML =
      `<div class="hbd-full-banner__inner">` +
        `<span class="hbd-full-banner__illustration" aria-hidden="true">${t.icon}</span>` +
        `<p class="hbd-full-banner__eyebrow">${this._escapeText(eyebrowText)}</p>` +
        `<${hTag} class="hbd-full-banner__heading">${this._escapeText(headingText)}</${hTag}>` +
        `<p class="hbd-full-banner__description">${this._escapeText(descriptionText)}</p>` +
        `<div class="hbd-full-banner__actions"${actionsEmpty}></div>` +
        `<div class="hbd-full-banner__meta"${metaEmpty}></div>` +
      `</div>`;

    // 5. Re-append authored nodes — original DOM identity preserved
    //    so any addEventListener bindings still fire.
    const actionsEl = this.querySelector('.hbd-full-banner__actions');
    for (const node of actions) actionsEl.appendChild(node);

    const metaEl = this.querySelector('.hbd-full-banner__meta');
    for (const node of meta) metaEl.appendChild(node);
  }
}

if (!customElements.get('hbd-full-banner')) {
  customElements.define('hbd-full-banner', HbdFullBanner);
}
