// ds/components/hbd-alert.js
// Here Be Dragons DS — <hbd-alert> custom element (CLAUDE.md §7).
//
// Light DOM. The generic system-level equivalent of hbd-callout —
// application feedback (form errors, system notices, API responses).
// hbd-callout is reserved for HBD-flavoured authored content; this
// component is for app messaging.
//
// Authoring shape:
//
//   <hbd-alert variant="success" title="Character Saved">
//     Your character sheet has been saved to the cloud.
//   </hbd-alert>
//
//   <hbd-alert variant="error" dismissible>
//     The server could not process your request.
//     <button class="hbd-alert__action" type="button">Contact support</button>
//   </hbd-alert>
//
// Any author-supplied children become the alert content. Action
// buttons should carry .hbd-alert__action so the underline + focus
// ring style applies. Re-renders preserve children (and their
// listeners) via the snapshot-and-reattach pattern.
//
// Attributes:
//   variant      — "info" (default) | "success" | "warning" | "error"
//   title        — optional bold heading line
//   type         — "alert" (default) | "banner" | "inline"
//   dismissible  — boolean; renders × dismiss button
//   persist      — boolean; banner remembers its dismissed state in
//                  localStorage (key 'hbd-alert-dismissed-<id|uid>')
//                  so a dismissed maintenance banner does not reappear.
//
// Dynamic injection note for authors:
//   When an hbd-alert with variant="error" is appended to the DOM at
//   runtime, role="alert" / aria-live="assertive" causes immediate
//   announcement by AT. For success/warning, role="status" / polite
//   announces at the next pause. info uses role="note" and is NOT
//   announced — use info only for ambient context that does not
//   demand attention.

let hbdAlertUid = 0;

const VARIANTS = ['info', 'success', 'warning', 'error'];
const TYPES = ['alert', 'banner', 'inline'];

// Per spec Step 3a — explicit per-variant role/live-region mapping.
// Differs from hbd-callout (which folds success into "note") because
// app-level success usually IS a status change that should be
// announced (e.g. "Character saved").
const VARIANT_ARIA = {
  error:   { role: 'alert',  live: 'assertive' },
  warning: { role: 'status', live: 'polite'    },
  success: { role: 'status', live: 'polite'    },
  info:    { role: 'note',   live: null        },
};

// Inline-SVG icons — same family as the rest of the DS (stroke
// outlines, currentColor) so they inherit the variant text colour
// for free. aria-hidden lives on the wrapper.
const ICONS = {
  info:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<circle cx="8" cy="8" r="6.5"/>' +
      '<line x1="8" y1="7" x2="8" y2="11.5"/>' +
      '<circle cx="8" cy="4.5" r="0.6" fill="currentColor" stroke="none"/>' +
    '</svg>',
  success:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<circle cx="8" cy="8" r="6.5"/>' +
      '<polyline points="5,8.5 7.2,10.6 11,6.5"/>' +
    '</svg>',
  warning:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M8 1.5 L14.5 13 H1.5 Z"/>' +
      '<line x1="8" y1="6" x2="8" y2="9.5"/>' +
      '<circle cx="8" cy="11.4" r="0.6" fill="currentColor" stroke="none"/>' +
    '</svg>',
  error:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<circle cx="8" cy="8" r="6.5"/>' +
      '<line x1="5.5" y1="5.5" x2="10.5" y2="10.5"/>' +
      '<line x1="10.5" y1="5.5" x2="5.5" y2="10.5"/>' +
    '</svg>',
};

const DISMISS_ICON =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false">' +
    '<line x1="4" y1="4" x2="12" y2="12"/>' +
    '<line x1="12" y1="4" x2="4" y2="12"/>' +
  '</svg>';

class HbdAlert extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'title', 'type', 'dismissible', 'persist'];
  }

  constructor() {
    super();
    this._uid = ++hbdAlertUid;
    this._ready = false;
    this._dismissing = false;
    this._onClick = this._onClick.bind(this);
    this._onTransitionEnd = this._onTransitionEnd.bind(this);
  }

  connectedCallback() {
    // Persisted dismissal — if a banner was previously dismissed and
    // persist is set, remove immediately with no animation.
    if (this._isPersistedDismissed()) {
      this.remove();
      return;
    }
    this._ready = true;
    this._render();
    this.addEventListener('click', this._onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
  }

  attributeChangedCallback(_n, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  // ─── Attribute readers ──────────────────────────────────────────
  _variant() {
    const raw = (this.getAttribute('variant') || 'info').toLowerCase();
    return VARIANTS.includes(raw) ? raw : 'info';
  }
  _type() {
    const raw = (this.getAttribute('type') || 'alert').toLowerCase();
    return TYPES.includes(raw) ? raw : 'alert';
  }
  _title() {
    return this.getAttribute('title') || '';
  }
  _persistKey() {
    const id = this.id || `uid-${this._uid}`;
    return `hbd-alert-dismissed-${id}`;
  }
  _isPersistedDismissed() {
    if (!this.hasAttribute('persist')) return false;
    try {
      return localStorage.getItem(this._persistKey()) === '1';
    } catch (_e) {
      return false;
    }
  }
  _markPersistedDismissed() {
    if (!this.hasAttribute('persist')) return;
    try {
      localStorage.setItem(this._persistKey(), '1');
    } catch (_e) {
      // localStorage unavailable (private mode, quota) — silently skip
    }
  }

  _escapeText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  _escapeAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ─── Render ─────────────────────────────────────────────────────
  _render() {
    if (this._dismissing) return;

    // Snapshot author children BEFORE clearing innerHTML so listeners
    // survive a re-render. Skip internal wrappers from a previous
    // render and reclaim their content.
    const authorChildren = [];
    for (const child of Array.from(this.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE && child.classList && (
        child.classList.contains('hbd-alert__icon') ||
        child.classList.contains('hbd-alert__body') ||
        child.classList.contains('hbd-alert__dismiss')
      )) {
        // Reclaim nested authored nodes (action buttons, message text)
        // from a previous render of the content slot.
        const prevContent = child.classList.contains('hbd-alert__body')
          ? child.querySelector('.hbd-alert__content')
          : null;
        if (prevContent) {
          for (const n of Array.from(prevContent.childNodes)) authorChildren.push(n);
        }
        continue;
      }
      authorChildren.push(child);
    }

    const variant = this._variant();
    const type = this._type();
    const title = this._title();
    const dismissible = this.hasAttribute('dismissible');
    const aria = VARIANT_ARIA[variant];
    const titleId = `hbd-alert-title-${this._uid}`;

    // Host classes
    const classes = ['hbd-alert', `hbd-alert--${variant}`, `hbd-alert--${type}`];
    if (dismissible) classes.push('hbd-alert--dismissible');
    this.className = classes.join(' ');

    // ARIA on the host itself — Light DOM, so the host IS the alert.
    this.setAttribute('role', aria.role);
    if (aria.live) this.setAttribute('aria-live', aria.live);
    else this.removeAttribute('aria-live');
    if (title) this.setAttribute('aria-labelledby', titleId);
    else this.removeAttribute('aria-labelledby');

    const titleHtml = title
      ? `<p class="hbd-alert__title" id="${titleId}">${this._escapeText(title)}</p>`
      : '';

    const dismissHtml = dismissible
      ? `<button class="hbd-alert__dismiss" type="button" data-hbd-alert-dismiss aria-label="${this._escapeAttr('Dismiss ' + variant + ' message')}">${DISMISS_ICON}</button>`
      : '';

    this.innerHTML =
      `<span class="hbd-alert__icon" aria-hidden="true">${ICONS[variant]}</span>` +
      `<div class="hbd-alert__body">` +
        titleHtml +
        `<div class="hbd-alert__content"></div>` +
      `</div>` +
      dismissHtml;

    // Re-append authored content — original DOM identity preserved
    // so listeners on action buttons still fire.
    const contentEl = this.querySelector('.hbd-alert__content');
    for (const node of authorChildren) contentEl.appendChild(node);

    // Collapse the content wrapper when it has nothing — keeps the
    // body row from leaving a phantom gap below a title-only alert.
    if (!contentEl.childNodes.length) contentEl.remove();
  }

  // ─── Dismiss ────────────────────────────────────────────────────
  _onClick(e) {
    const btn = e.target && e.target.closest && e.target.closest('[data-hbd-alert-dismiss]');
    if (!btn || !this.contains(btn)) return;
    this._beginDismiss();
  }

  _beginDismiss() {
    if (this._dismissing) return;
    this._dismissing = true;
    // Listen on the host because the host carries the class.
    this.addEventListener('transitionend', this._onTransitionEnd);
    // Force a layout pass before flipping the class so the
    // transition picks up the starting state — without this, a
    // freshly-inserted alert dismissed in the same task would jump
    // straight to the end state.
    void this.offsetHeight;
    this.classList.add('is-dismissed');
  }

  _onTransitionEnd(e) {
    // The host has several transitioning properties; only fire once
    // when the longest (max-height / margin) has finished. Filter on
    // propertyName so an unrelated transition in a child doesn't
    // trigger early removal.
    if (e.target !== this) return;
    if (e.propertyName !== 'max-height' && e.propertyName !== 'opacity') return;
    this.removeEventListener('transitionend', this._onTransitionEnd);
    this._markPersistedDismissed();
    this.dispatchEvent(new CustomEvent('hbd:dismiss', {
      bubbles: true,
      composed: true,
      detail: { variant: this._variant(), type: this._type() },
    }));
    this.remove();
  }

  // ─── Public API ─────────────────────────────────────────────────
  /** Programmatic dismiss — equivalent to clicking the × button. */
  dismiss() {
    this._beginDismiss();
  }
}

if (!customElements.get('hbd-alert')) {
  customElements.define('hbd-alert', HbdAlert);
}
