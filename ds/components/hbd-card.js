// ds/components/hbd-card.js
// Here Be Dragons DS — <hbd-card> custom element (CLAUDE.md §7).
//
// Light DOM. Authors slot arbitrary content into the body and footer,
// and page-level print/theme styles must reach card content directly —
// both are reasons NOT to use Shadow DOM here. The trade-off is that
// authored markup is mutated in place on render; we re-render on
// observed-attribute changes only, and we preserve slotted children
// by snapshotting them before re-rendering.
//
// Variants:
//   basic        — content only (default)
//   interactive  — entire card is focusable + clickable
//                  • with `href` → renders as <a> (real link)
//                  • without `href` → renders as <div role="button"
//                    tabindex="0"> with Enter/Space activation
//   media        — image at the top
//   horizontal   — image on the left, content on the right
//
// Attributes:
//   variant       — "basic" | "interactive" | "media" | "horizontal"
//   href          — when set, interactive card renders as <a>
//   title         — card heading text (rendered into .hbd-card__title)
//   subtitle      — secondary heading text
//   img-src       — image URL for media / horizontal variants
//   img-alt       — image alt text; required when img-src is set
//                   (decorative images: img-alt="")
//   size          — "sm" | "md" | "lg" | "flush" (default "md")
//   elevated      — boolean — heavier shadow
//   bordered      — boolean — border instead of shadow
//   heading-level — "2" | "3" | "4" (default "3")
//                   sets the rendered heading element for the title
//
// Slotted children (authors put these inside <hbd-card>…</hbd-card>):
//   slot="body"   — main content
//   slot="footer" — actions row
//   slot="badge"  — absolutely-positioned overlay (top-right)
//   anything without a slot attribute → falls through into the body
//
// Events:
//   hbd:click — fired on click OR keyboard activation of an interactive
//               div-based card. detail = { href: string | null }.

class HbdCard extends HTMLElement {
  static get observedAttributes() {
    return [
      'variant', 'href', 'title', 'subtitle', 'img-src', 'img-alt',
      'size', 'elevated', 'bordered', 'heading-level',
    ];
  }

  constructor() {
    super();
    this._ready = false;
    // Snapshot of authored slotted nodes — preserved across renders so
    // we don't lose user-provided <hbd-button> children, etc.
    this._slots = { body: [], footer: [], badge: [], unslotted: [] };
    this._onClick = this._onClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onImgError = this._onImgError.bind(this);
  }

  connectedCallback() {
    this._snapshotSlots();
    this._ready = true;
    this._render();
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeydown);
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  // ─── Slot management ───────────────────────────────────────────────
  _snapshotSlots() {
    const body = [];
    const footer = [];
    const badge = [];
    const unslotted = [];
    // Copy children once at connect — they live in detached form between
    // renders and we re-attach them into the rendered structure.
    Array.from(this.children).forEach((child) => {
      const slot = child.getAttribute && child.getAttribute('slot');
      if (slot === 'body') body.push(child);
      else if (slot === 'footer') footer.push(child);
      else if (slot === 'badge') badge.push(child);
      else unslotted.push(child);
    });
    this._slots = { body, footer, badge, unslotted };
  }

  // ─── Attribute readers ─────────────────────────────────────────────
  get _variant() {
    const v = (this.getAttribute('variant') || 'basic').toLowerCase();
    return ['basic', 'interactive', 'media', 'horizontal'].includes(v)
      ? v : 'basic';
  }
  get _size() {
    const s = (this.getAttribute('size') || 'md').toLowerCase();
    return ['sm', 'md', 'lg', 'flush'].includes(s) ? s : 'md';
  }
  get _headingLevel() {
    const n = parseInt(this.getAttribute('heading-level'), 10);
    if (n === 2 || n === 3 || n === 4) return n;
    return 3;
  }
  get _isInteractive() {
    return this._variant === 'interactive' || this.hasAttribute('href');
  }
  get _href() {
    return this.getAttribute('href');
  }

  // ─── Render ────────────────────────────────────────────────────────
  _render() {
    if (!this._ready) return;

    // Validate img-alt presence when img-src is set. img-alt="" is
    // explicitly permitted (decorative image).
    const imgSrc = this.getAttribute('img-src');
    if (imgSrc && this.getAttribute('img-alt') == null) {
      console.warn(
        '[hbd-card] img-src is set but img-alt is missing. Provide ' +
        'img-alt="" for decorative images, or a meaningful description.'
      );
    }

    // Compose the class list. Surface modifiers (bordered, elevated)
    // stack with variant + size modifiers.
    const classes = ['hbd-card'];
    const v = this._variant;
    if (v === 'media') classes.push('hbd-card--media');
    if (v === 'horizontal') classes.push('hbd-card--horizontal');
    if (this._isInteractive) classes.push('hbd-card--interactive');
    const size = this._size;
    if (size !== 'md') classes.push(`hbd-card--${size}`);
    if (this.hasAttribute('bordered')) classes.push('hbd-card--bordered');
    if (this.hasAttribute('elevated')) classes.push('hbd-card--elevated');

    // The HOST is the card surface. We mutate the host's own attributes
    // for interactivity (anchor vs. button role) so a single focusable
    // element exists and there is no nested-focusable issue.
    this.className = classes.join(' ');

    // Reset host element semantics from any prior render, then re-apply.
    this.removeAttribute('role');
    this.removeAttribute('tabindex');
    if (this._isInteractive) {
      if (this._href != null) {
        // For href-based cards we rely on a single <a> wrapper INSIDE
        // the host to provide native link semantics — but to keep the
        // host as the focusable surface we wrap the entire content in
        // an <a>. The host's role is implicit "generic" in that case.
      } else {
        // Div-based interactive card: host is the focusable button.
        this.setAttribute('role', 'button');
        this.setAttribute('tabindex', '0');
      }
    }

    // Build inner markup.
    const titleText = this.getAttribute('title') || '';
    const subtitleText = this.getAttribute('subtitle') || '';
    const hL = this._headingLevel;
    const titleTag = `h${hL}`;

    // Header — only rendered when a title or subtitle is present.
    let headerHtml = '';
    if (titleText || subtitleText) {
      const titleHtml = titleText
        ? `<${titleTag} class="hbd-card__title">${escapeText(titleText)}</${titleTag}>`
        : '';
      const subtitleHtml = subtitleText
        ? `<p class="hbd-card__subtitle">${escapeText(subtitleText)}</p>`
        : '';
      headerHtml = `<div class="hbd-card__header">${titleHtml}${subtitleHtml}</div>`;
    }

    // Media — only for media + horizontal variants and only when
    // img-src is provided. Render either an <img> or, if a previous
    // render produced a placeholder, the placeholder div.
    let mediaHtml = '';
    if ((v === 'media' || v === 'horizontal') && imgSrc) {
      const altRaw = this.getAttribute('img-alt');
      const alt = altRaw == null ? '' : altRaw;
      mediaHtml = `
        <div class="hbd-card__media">
          <img class="hbd-card__img"
               src="${escapeAttr(imgSrc)}"
               alt="${escapeAttr(alt)}"
               loading="lazy"
               data-card-img>
        </div>`;
    }

    // Body + footer wrap markers — actual content (the snapshotted
    // slotted children) is moved into these wrappers AFTER innerHTML
    // is written, so authored nodes (with their event listeners, etc.)
    // are preserved.
    const bodyHtml   = '<div class="hbd-card__body"   data-card-body></div>';
    const footerHtml = this._slots.footer.length
      ? '<div class="hbd-card__footer" data-card-footer></div>'
      : '';
    const badgeHtml  = this._slots.badge.length
      ? '<div class="hbd-card__badge"  data-card-badge></div>'
      : '';

    // Horizontal layout: content stack lives in its own column so the
    // image keeps a fixed width on the left and header/body/footer
    // stack vertically on the right. Other variants compose linearly.
    let innerHtml;
    if (v === 'horizontal') {
      innerHtml =
        badgeHtml +
        mediaHtml +
        '<div class="hbd-card__content">' +
          headerHtml + bodyHtml + footerHtml +
        '</div>';
    } else {
      innerHtml = badgeHtml + mediaHtml + headerHtml + bodyHtml + footerHtml;
    }

    // Wrap inner markup in an <a> when href is set — gives the whole
    // surface a real link target. The anchor inherits the card's
    // colour/typography via .hbd-card--interactive { color: inherit }.
    let wrapperOpen = '';
    let wrapperClose = '';
    if (this._isInteractive && this._href != null) {
      wrapperOpen =
        `<a class="hbd-card__link" href="${escapeAttr(this._href)}">`;
      wrapperClose = '</a>';
    }

    this.innerHTML = wrapperOpen + innerHtml + wrapperClose;

    // Re-attach snapshotted slotted children into the rendered wrappers.
    const bodyEl   = this.querySelector('[data-card-body]');
    const footerEl = this.querySelector('[data-card-footer]');
    const badgeEl  = this.querySelector('[data-card-badge]');

    if (bodyEl) {
      this._slots.body.forEach((node) => bodyEl.appendChild(node));
      this._slots.unslotted.forEach((node) => bodyEl.appendChild(node));
    }
    if (footerEl) {
      this._slots.footer.forEach((node) => footerEl.appendChild(node));
    }
    if (badgeEl) {
      this._slots.badge.forEach((node) => badgeEl.appendChild(node));
    }

    // Wire image error fallback — replace with placeholder if load fails.
    const imgEl = this.querySelector('[data-card-img]');
    if (imgEl) {
      imgEl.addEventListener('error', this._onImgError, { once: true });
    }
  }

  // ─── Events ────────────────────────────────────────────────────────
  _onClick(e) {
    if (!this._isInteractive) return;
    // For href-based cards the inner <a> already handles navigation
    // natively. We still fire hbd:click so consumers can react (e.g.
    // analytics) — but we do NOT preventDefault, so the native nav
    // proceeds. For div-based cards there is no native action; fire
    // the event and let the consumer handle it.
    // Ignore clicks that originated inside a footer interactive child
    // (button, link, input) — those have their own actions and should
    // not also activate the card. The closest() check keeps this cheap.
    const footerActionable = e.target.closest && e.target.closest(
      '.hbd-card__footer button, .hbd-card__footer a, ' +
      '.hbd-card__footer input, .hbd-card__footer hbd-button'
    );
    if (footerActionable) return;
    this.dispatchEvent(new CustomEvent('hbd:click', {
      detail: { href: this._href },
      bubbles: true,
      composed: true,
    }));
  }

  _onKeydown(e) {
    // Keyboard activation only matters for div-based interactive cards.
    // Anchor-wrapped cards activate via the <a>'s native handling.
    if (!this._isInteractive || this._href != null) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('hbd:click', {
        detail: { href: null },
        bubbles: true,
        composed: true,
      }));
    }
  }

  _onImgError(e) {
    const img = e.target;
    if (!img || !img.parentNode) return;
    const placeholder = document.createElement('div');
    placeholder.className = 'hbd-card__media-placeholder';
    placeholder.setAttribute('role', 'img');
    const alt = this.getAttribute('img-alt') || 'Image unavailable';
    placeholder.setAttribute('aria-label', alt);
    placeholder.textContent = 'Image unavailable';
    img.parentNode.replaceChild(placeholder, img);
  }
}

// ─── HTML-escape helpers (no dep) ────────────────────────────────────
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!customElements.get('hbd-card')) {
  customElements.define('hbd-card', HbdCard);
}
