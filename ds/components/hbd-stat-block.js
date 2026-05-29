// ds/components/hbd-stat-block.js
// Here Be Dragons DS — <hbd-stat-block> custom element (CLAUDE.md §7).
//
// A D&D 5e creature/NPC stat block: name + subtitle, basic stats (AC/HP/Speed),
// a six-ability score table, properties (saves/senses/languages/CR), and
// trait/action/reaction/legendary sections. Migrated from the legacy
// components-statblock.html — purely a structured-data display (the legacy
// markup had no JavaScript).
//
// DOM choice — LIGHT DOM (no shadow root). The stat block is display-only with
// no behaviour or style-isolation needs. Light DOM keeps the real <table> and
// <dl> semantics in the page accessibility tree (a shadow root would still work
// for AT, but Light DOM also lets the global token cascade and print stylesheets
// reach the content directly, matching the other static HBD cards). Styles come
// from ds/styles/components/stat-block.css (loaded via ds/index.css). Slotted
// content (properties, traits, actions, …) is read from light-DOM children
// before the element renders its own markup.

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const SLOT_NAMES = [
  'saving-throws', 'skills', 'immunities', 'senses', 'languages',
  'traits', 'actions', 'reactions', 'legendary-actions',
];

// Basic stat rows rendered from attributes, in display order.
const BASIC_FIELDS = [
  { attr: 'ac', label: 'Armor Class' },
  { attr: 'hp', label: 'Hit Points' },
  { attr: 'speed', label: 'Speed' },
];

class HbdStatBlock extends HTMLElement {
  static get observedAttributes() {
    return [
      'creature-name', 'size', 'type', 'alignment', 'ac', 'hp', 'speed', 'cr',
      'legendary', 'compact', ...ABILITIES,
    ];
  }

  constructor() {
    super();
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
    const slots = {};
    for (const slotName of SLOT_NAMES) {
      const el = this.querySelector(`[slot="${slotName}"]`);
      slots[slotName] = el ? el.innerHTML.trim() : '';
    }
    this._slots = slots;
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 4a — modifier from score, formatted "+N" / "−N" (U+2212 for negatives).
  _modifier(score) {
    const n = parseInt(score, 10);
    if (Number.isNaN(n)) return '';
    const mod = Math.floor((n - 10) / 2);
    if (mod < 0) return `−${Math.abs(mod)}`;
    return `+${mod}`;
  }

  _subtitle() {
    const size = this.getAttribute('size') || '';
    const type = this.getAttribute('type') || '';
    const alignment = this.getAttribute('alignment') || '';
    const sizeType = [size, type].filter(Boolean).join(' ');
    return [sizeType, alignment].filter(Boolean).join(', ');
  }

  // ── Render ──────────────────────────────────────────────────────────────
  _render() {
    // attributeChangedCallback can fire before connectedCallback during upgrade,
    // so slots may not be captured yet. Capture lazily before reading them.
    if (!this._slots) this._captureSlots();

    const name = this.getAttribute('creature-name') || '';
    const isLegendary = this.hasAttribute('legendary');
    const isCompact = this.hasAttribute('compact');
    const subtitle = this._subtitle();

    const classes = ['hbd-stat-block'];
    if (isLegendary) classes.push('hbd-stat-block--legendary');
    if (isCompact) classes.push('hbd-stat-block--compact');

    // Basic stats (AC/HP/Speed) — only those provided.
    const basics = BASIC_FIELDS
      .filter((f) => this.getAttribute(f.attr))
      .map((f) => `
        <div class="hbd-stat-block__property">
          <dt class="hbd-stat-block__property-label">${this._esc(f.label)}</dt>
          <dd class="hbd-stat-block__property-value">${this._esc(this.getAttribute(f.attr))}</dd>
        </div>`).join('');

    // Ability table — real <table>, only if at least one score is present.
    const hasAbilities = ABILITIES.some((a) => this.getAttribute(a));
    let abilityTable = '';
    if (hasAbilities) {
      const labelCells = ABILITIES.map((a) =>
        `<th scope="col" class="hbd-stat-block__ability-label">${a.toUpperCase()}</th>`).join('');
      const scoreCells = ABILITIES.map((a) => {
        const v = this.getAttribute(a);
        return `<td class="hbd-stat-block__ability-score">${v ? this._esc(v) : '—'}</td>`;
      }).join('');
      const modCells = ABILITIES.map((a) => {
        const v = this.getAttribute(a);
        return `<td class="hbd-stat-block__ability-modifier">${v ? this._modifier(v) : ''}</td>`;
      }).join('');
      abilityTable = `
        <table class="hbd-stat-block__ability-grid">
          <caption class="hbd-sr-only">Ability scores</caption>
          <thead><tr>${labelCells}</tr></thead>
          <tbody>
            <tr>${scoreCells}</tr>
            <tr>${modCells}</tr>
          </tbody>
        </table>`;
    }

    // Property rows from slots (label is supplied by the slot content itself).
    const cr = this.getAttribute('cr');
    const propRows = [
      this._slots['saving-throws'] ? this._propRow('Saving Throws', this._slots['saving-throws']) : '',
      this._slots.skills ? this._propRow('Skills', this._slots.skills) : '',
      this._slots.immunities ? this._propRow('Immunities', this._slots.immunities) : '',
      this._slots.senses ? this._propRow('Senses', this._slots.senses) : '',
      this._slots.languages ? this._propRow('Languages', this._slots.languages) : '',
      cr ? this._propRow('Challenge', this._esc(cr)) : '',
    ].join('');

    const sections = [
      this._section('Traits', this._slots.traits, false),
      this._section('Actions', this._slots.actions, false),
      this._section('Reactions', this._slots.reactions, false),
      isLegendary ? this._section('Legendary Actions', this._slots['legendary-actions'], true) : '',
    ].join('');

    this.className = classes.join(' ');
    this.setAttribute('role', 'article');
    this.setAttribute('aria-label', `${name} stat block`);

    this.innerHTML = `
      <div class="hbd-stat-block__inner">
        <header class="hbd-stat-block__header">
          ${name ? `<h2 class="hbd-stat-block__name">${this._esc(name)}</h2>` : ''}
          ${subtitle ? `<p class="hbd-stat-block__subtitle">${this._esc(subtitle)}</p>` : ''}
        </header>
        ${(basics || abilityTable || propRows) ? '<hr class="hbd-stat-block__divider">' : ''}
        ${basics ? `<dl class="hbd-stat-block__basics">${basics}</dl>` : ''}
        ${abilityTable}
        ${propRows ? `<hr class="hbd-stat-block__divider"><dl class="hbd-stat-block__properties">${propRows}</dl>` : ''}
        ${sections ? '<hr class="hbd-stat-block__divider">' : ''}
        ${sections}
      </div>
    `;
  }

  _propRow(label, valueHtml) {
    return `
      <div class="hbd-stat-block__property">
        <dt class="hbd-stat-block__property-label">${this._esc(label)}</dt>
        <dd class="hbd-stat-block__property-value">${valueHtml}</dd>
      </div>`;
  }

  // A section is a heading + slotted body. The body is author HTML that already
  // contains .hbd-stat-block__trait markup (trait-name + trait-body inline).
  _section(heading, bodyHtml, legendary) {
    if (!bodyHtml) return '';
    const cls = legendary
      ? 'hbd-stat-block__section hbd-stat-block__section--legendary'
      : 'hbd-stat-block__section';
    return `
      <section class="${cls}">
        <h3 class="hbd-stat-block__section-heading">${this._esc(heading)}</h3>
        ${bodyHtml}
      </section>`;
  }
}

if (!customElements.get('hbd-stat-block')) {
  customElements.define('hbd-stat-block', HbdStatBlock);
}
