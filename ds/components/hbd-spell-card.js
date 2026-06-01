// ds/components/hbd-spell-card.js
// Here Be Dragons DS — <hbd-spell-card> custom element (CLAUDE.md §7).
//
// A D&D spell rendered as a card: school colour band, ornamental corners,
// level badge, label/value meta grid, description, optional "At Higher Levels"
// and footer. Migrated from the legacy components-spellcard.html — purely
// presentational and static (the legacy markup had no JavaScript).
//
// DOM choice — LIGHT DOM (no shadow root). The card is purely presentational
// with no scoped-style or behaviour-isolation needs; Light DOM lets the global
// token cascade and page/print stylesheets reach the content directly, and
// keeps the dl/dt/dd meta grid in the page's accessibility tree without slot
// indirection. Styles come from ds/styles/components/spell-card.css (loaded via
// ds/index.css). Slotted content (description, higher-levels, footer) is read
// from light-DOM children before the element renders its own markup.

const SCHOOLS = new Set([
  'abjuration', 'conjuration', 'divination', 'enchantment',
  'evocation', 'illusion', 'necromancy', 'transmutation',
]);

const META_FIELDS = [
  { attr: 'casting-time', label: 'Casting Time' },
  { attr: 'range', label: 'Range' },
  { attr: 'components', label: 'Components' },
  { attr: 'duration', label: 'Duration' },
];

class HbdSpellCard extends HTMLElement {
  static get observedAttributes() {
    return [
      'name', 'level', 'school', 'casting-time', 'range', 'components',
      'duration', 'ritual', 'concentration', 'selected',
    ];
  }

  constructor() {
    super();
    // Capture author-provided slot content once, before we overwrite innerHTML.
    this._slots = null;
    this._ready = false;
  }

  connectedCallback() {
    // First connection: capture slotted children (now present) then render.
    if (!this._slots) this._captureSlots();
    this._ready = true;
    this._render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    // Ignore attribute changes until the first connectedCallback has run: during
    // upgrade this can fire before children/slots exist. The initial render in
    // connectedCallback already reflects all current attributes.
    if (oldVal !== newVal && this._ready) this._render();
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  _captureSlots() {
    const pick = (sel) => {
      const el = this.querySelector(sel);
      return el ? el.innerHTML.trim() : '';
    };
    // Description = default (unslotted) text; named slots for the rest.
    const higher = pick('[slot="higher-levels"]');
    const footer = pick('[slot="footer"]');
    // Default slot: everything not assigned to a named slot.
    const clone = this.cloneNode(true);
    clone.querySelectorAll('[slot]').forEach((n) => n.remove());
    const description = clone.innerHTML.trim();
    this._slots = { description, higher, footer };
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _levelText(level) {
    if (!level) return '';
    const v = String(level).toLowerCase();
    if (v === 'cantrip' || v === '0') return 'Cantrip';
    return `Lvl ${level}`;
  }

  // ── Render ──────────────────────────────────────────────────────────────
  _render() {
    const name = this.getAttribute('name') || '';
    const level = this.getAttribute('level') || '';
    const schoolRaw = (this.getAttribute('school') || '').toLowerCase();
    const school = SCHOOLS.has(schoolRaw) ? schoolRaw : '';
    const isRitual = this.hasAttribute('ritual');
    const isConc = this.hasAttribute('concentration');
    const isCantrip = String(level).toLowerCase() === 'cantrip' || String(level) === '0';
    const isSelected = this.hasAttribute('selected');

    const classes = ['hbd-spell-card'];
    if (school) classes.push(`hbd-spell-card--${school}`);
    if (isCantrip) classes.push('hbd-spell-card--cantrip');
    if (isRitual) classes.push('hbd-spell-card--ritual');
    if (isConc) classes.push('hbd-spell-card--concentration');
    if (isSelected) classes.push('hbd-spell-card--selected', 'is-selected');

    const schoolLabel = school ? school.charAt(0).toUpperCase() + school.slice(1) : '';
    const levelText = this._levelText(level);
    const ariaLabel = `${name}${name ? ' ' : ''}spell card`;

    // Meta grid — only render fields that have a value.
    const metaItems = META_FIELDS
      .filter((f) => this.getAttribute(f.attr))
      .map((f) => `
        <div class="hbd-spell-card__meta-item">
          <dt class="hbd-spell-card__meta-label">${this._esc(f.label)}</dt>
          <dd class="hbd-spell-card__meta-value">${this._esc(this.getAttribute(f.attr))}</dd>
        </div>`).join('');

    // Ritual / concentration tags — visible text, not colour-only.
    const tags = [];
    if (isRitual) tags.push('Ritual');
    if (isConc) tags.push('Concentration');
    const tagsHtml = tags.length
      ? `<div class="hbd-spell-card__tags">${tags.map((t) =>
          `<span class="hbd-spell-card__tag">${this._esc(t)}</span>`).join('')}</div>`
      : '';

    // attributeChangedCallback can fire before connectedCallback during upgrade,
    // so slots may not be captured yet. Capture lazily before reading them.
    if (!this._slots) this._captureSlots();
    const { description, higher, footer } = this._slots;
    const descHtml = description
      ? `<p class="hbd-spell-card__description">${description}</p>` : '';
    const higherHtml = higher
      ? `<div class="hbd-spell-card__higher-levels">
           <span class="hbd-spell-card__higher-levels-label">At Higher Levels.</span> ${higher}
         </div>` : '';
    const footerHtml = footer
      ? `<div class="hbd-spell-card__footer">${footer}</div>` : '';

    // The host element is the article (role + label live on the host); the
    // inner wrapper is a plain styled div so there is exactly one article role.
    this.className = classes.join(' ');
    this.setAttribute('role', 'article');
    this.setAttribute('aria-label', ariaLabel);
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    this.innerHTML = `
      <span class="hbd-spell-card__corner hbd-spell-card__corner--tl" aria-hidden="true"></span>
      <span class="hbd-spell-card__corner hbd-spell-card__corner--tr" aria-hidden="true"></span>
      <span class="hbd-spell-card__corner hbd-spell-card__corner--bl" aria-hidden="true"></span>
      <span class="hbd-spell-card__corner hbd-spell-card__corner--br" aria-hidden="true"></span>
      <div class="hbd-spell-card__bar" aria-hidden="true"></div>
      <div class="hbd-spell-card__body">
        ${levelText ? `<span class="hbd-spell-card__level">${this._esc(levelText)}</span>` : ''}
        ${schoolLabel ? `<span class="hbd-spell-card__school">${this._esc(schoolLabel)}</span>` : ''}
        ${name ? `<h3 class="hbd-spell-card__name">${this._esc(name)}</h3>` : ''}
        ${tagsHtml}
        ${metaItems ? '<hr class="hbd-spell-card__rule">' : ''}
        ${metaItems ? `<dl class="hbd-spell-card__meta">${metaItems}</dl>` : ''}
        ${descHtml ? '<hr class="hbd-spell-card__rule">' : ''}
        ${descHtml}
        ${higherHtml}
        ${footerHtml}
      </div>
    `;
  }
}

if (!customElements.get('hbd-spell-card')) {
  customElements.define('hbd-spell-card', HbdSpellCard);
}
