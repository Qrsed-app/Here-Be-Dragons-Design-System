// ds/components/hbd-avatar.js
// Here Be Dragons DS — <hbd-avatar> custom element (CLAUDE.md §7).
//
// Light DOM. The host carries .hbd-avatar* classes and the rendered
// content is written into innerHTML.
//
// Two content branches:
//   1. <img>        — when img-src is set AND loads successfully
//   2. generic icon — fallback (image absent or 404)
//
// Attributes:
//   name      — full name, used only for the accessible label
//   img-src   — image URL
//   img-alt   — image alt text; falls back to `name`
//   size      — "xs" | "sm" | "md" (default) | "lg" | "xl" | "2xl"

class HbdAvatar extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'img-src', 'img-alt', 'size'];
  }

  constructor() {
    super();
    this._ready = false;
    this._imgFailed = false;
    this._onImgError = this._onImgError.bind(this);
  }

  connectedCallback() {
    this._ready = true;
    this._render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    // A new img-src deserves a fresh attempt — reset the failure flag.
    if (name === 'img-src') this._imgFailed = false;
    this._render();
  }

  // ─── Attribute readers ─────────────────────────────────────────────
  get _name()   { return (this.getAttribute('name')   || '').trim(); }
  get _imgSrc() { return this.getAttribute('img-src') || ''; }
  get _imgAlt() {
    const explicit = this.getAttribute('img-alt');
    return explicit != null ? explicit : this._name;
  }
  get _size() {
    const s = (this.getAttribute('size') || 'md').toLowerCase();
    return ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(s) ? s : 'md';
  }

  // ─── Accessible name ──────────────────────────────────────────────
  // Preference order: img-alt → name → generic "Avatar".
  _getAccessibleName() {
    const altRaw = this.getAttribute('img-alt');
    const explicit = altRaw != null ? altRaw : '';
    return explicit || this._name || 'Avatar';
  }

  // ─── Render ───────────────────────────────────────────────────────
  _render() {
    if (!this._ready) return;

    const imgSrc = this._imgSrc;
    const useImage = imgSrc && !this._imgFailed;

    // Host classes — size only; no colour/square variants.
    this.className = `hbd-avatar hbd-avatar--${this._size}`;

    // role="img" treats the avatar as a single SR-readable image so
    // the inner <img>'s alt="" doesn't double-announce.
    this.setAttribute('role', 'img');
    this.setAttribute('aria-label', this._getAccessibleName());

    let inner;
    if (useImage) {
      inner =
        `<img class="hbd-avatar__img"
              src="${escapeAttr(imgSrc)}"
              alt=""
              aria-hidden="true"
              loading="lazy"
              data-avatar-img>`;
    } else {
      // Generic person outline. Sized + centred by CSS — no positioning here.
      inner =
        `<span class="hbd-avatar__icon" aria-hidden="true">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
             <circle cx="12" cy="9"  r="3.5"/>
             <path d="M5 20a7 7 0 0 1 14 0"/>
           </svg>
         </span>`;
    }

    this.innerHTML = inner;

    if (useImage) {
      const imgEl = this.querySelector('[data-avatar-img]');
      if (imgEl) imgEl.addEventListener('error', this._onImgError, { once: true });
    }
  }

  _onImgError() {
    this._imgFailed = true;
    this._render();
  }
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!customElements.get('hbd-avatar')) {
  customElements.define('hbd-avatar', HbdAvatar);
}
