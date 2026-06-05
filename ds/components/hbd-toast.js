// ds/components/hbd-toast.js
// Here Be Dragons DS — toast / snackbar system (CLAUDE.md §7).
//
// Architecture:
//
//   1. ToastManager (singleton) — owns a single portal container at
//      the viewport edge, holds the active stack, holds a queue for
//      overflow, exposes the public API as `window.hbdToast`.
//
//   2. <hbd-toast-item> (internal custom element) — one toast.
//      Light DOM. Authors normally do NOT use this element directly;
//      they call `hbdToast.show({…})` and the manager creates it.
//
// Public API:
//
//   hbdToast.show({
//     message: 'Spell saved successfully.',
//     variant: 'success',
//     duration: 5000,            // ms; default 5000 (linger token)
//     title:   'Saved',          // optional bold heading
//     dismissible: true,         // default true
//     action:  { label: 'Undo', onClick: () => undoSave() },
//   });
//
//   hbdToast.setPosition('bottom-center'); // top-right (default) |
//     top-center | bottom-right | bottom-center | bottom-left
//
// Reduced motion + SC 2.2.1 compliance:
//   If the user prefers reduced motion, auto-dismiss is disabled
//   entirely (the toast lingers until the user dismisses it). This
//   covers users who need more time to read content. Sighted users
//   get hover-pause; keyboard users get focus-pause. The dismiss
//   button is reachable by Tab from anywhere on the page.

const VARIANTS = ['info', 'success', 'warning', 'error'];
const POSITIONS = [
  'top-right',
  'top-center',
  'bottom-right',
  'bottom-center',
  'bottom-left',
];

let hbdToastUid = 0;

// Inline SVG icons — same set used by hbd-alert, so the two
// components share a visual language.
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

// ─── hbd-toast-item — individual toast element ───────────────────────
class HbdToastItem extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'title', 'duration', 'dismissible'];
  }

  constructor() {
    super();
    this._uid = ++hbdToastUid;
    this._timer = null;
    this._startedAt = 0;
    this._elapsed = 0;
    this._totalDuration = 0;
    this._paused = false;
    this._removed = false;
    this._onClick = this._onClick.bind(this);
    this._onPointerEnter = this._onPointerEnter.bind(this);
    this._onPointerLeave = this._onPointerLeave.bind(this);
    this._onFocusIn = this._onFocusIn.bind(this);
    this._onFocusOut = this._onFocusOut.bind(this);
    this._onAnimationEnd = this._onAnimationEnd.bind(this);
  }

  connectedCallback() {
    this._render();

    this.addEventListener('click', this._onClick);
    this.addEventListener('pointerenter', this._onPointerEnter);
    this.addEventListener('pointerleave', this._onPointerLeave);
    this.addEventListener('focusin', this._onFocusIn);
    this.addEventListener('focusout', this._onFocusOut);

    // Begin the auto-dismiss timer unless reduced motion is requested
    // — under prefers-reduced-motion, the toast stays until manually
    // dismissed (SC 2.2.1 + reduced-motion users need more reading
    // time). The dismiss button is still reachable by Tab.
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._totalDuration = this._parseDuration();
    if (reducedMotion || this._totalDuration === Infinity) {
      // No timer, no progress bar animation.
      const bar = this.querySelector('.hbd-toast__progress');
      if (bar) bar.remove();
    } else {
      this._startTimer(this._totalDuration);
    }
  }

  disconnectedCallback() {
    this._clearTimer();
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('pointerenter', this._onPointerEnter);
    this.removeEventListener('pointerleave', this._onPointerLeave);
    this.removeEventListener('focusin', this._onFocusIn);
    this.removeEventListener('focusout', this._onFocusOut);
  }

  attributeChangedCallback() {
    // Toasts are short-lived and usually configured once at
    // construction time — re-rendering on attribute changes after
    // mount would clobber the running enter animation. Ignore.
  }

  // ─── Reading helpers ────────────────────────────────────────────
  _variant() {
    const raw = (this.getAttribute('variant') || 'info').toLowerCase();
    return VARIANTS.includes(raw) ? raw : 'info';
  }

  _parseDuration() {
    const raw = this.getAttribute('duration');
    if (raw == null || raw === '' || raw === 'Infinity') {
      // No attr → fall back to --hbd-duration-linger (5000ms) so the
      // value still lives in tokens.json.
      return 5000;
    }
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 5000;
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
    // Snapshot author children so action buttons + their listeners
    // survive the innerHTML rebuild.
    const authorNodes = [];
    for (const child of Array.from(this.childNodes)) {
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        child.classList &&
        (
          child.classList.contains('hbd-toast__icon') ||
          child.classList.contains('hbd-toast__body') ||
          child.classList.contains('hbd-toast__dismiss') ||
          child.classList.contains('hbd-toast__progress')
        )
      ) {
        // Reclaim any nested authored nodes from a previous render.
        if (child.classList.contains('hbd-toast__body')) {
          const prev = child.querySelector('.hbd-toast__content');
          if (prev) for (const n of Array.from(prev.childNodes)) authorNodes.push(n);
        }
        continue;
      }
      authorNodes.push(child);
    }

    const variant = this._variant();
    const title = this.getAttribute('title') || '';
    const dismissible = this.hasAttribute('dismissible');
    const duration = this._parseDuration();
    const titleId = `hbd-toast-title-${this._uid}`;

    // Host classes
    const classes = ['hbd-toast', `hbd-toast--${variant}`, 'is-entering'];
    this.className = classes.join(' ');

    // ARIA on the host. The container has aria-live="polite" so the
    // toast text is announced when inserted. The host carries a role
    // that AT can target; aria-labelledby points to the title if set.
    this.setAttribute('role', variant === 'error' ? 'alert' : 'status');
    if (title) this.setAttribute('aria-labelledby', titleId);
    else this.removeAttribute('aria-labelledby');

    const titleHtml = title
      ? `<p class="hbd-toast__title" id="${titleId}">${this._escapeText(title)}</p>`
      : '';

    const dismissHtml = dismissible
      ? `<button class="hbd-toast__dismiss" type="button" data-hbd-toast-dismiss aria-label="Dismiss notification">${DISMISS_ICON}</button>`
      : '';

    // Progress bar duration is set via inline animation-duration —
    // documented per-instance value-driven exception (same pattern
    // as hbd-progress fill width).
    const progressHtml = duration === Infinity
      ? ''
      : `<div class="hbd-toast__progress" aria-hidden="true" style="animation-duration: ${duration}ms;"></div>`;

    this.innerHTML =
      `<span class="hbd-toast__icon" aria-hidden="true">${ICONS[variant]}</span>` +
      `<div class="hbd-toast__body">` +
        titleHtml +
        `<div class="hbd-toast__content"></div>` +
      `</div>` +
      dismissHtml +
      progressHtml;

    const content = this.querySelector('.hbd-toast__content');
    for (const node of authorNodes) content.appendChild(node);
    if (!content.childNodes.length) content.remove();
  }

  // ─── Auto-dismiss timer + hover/focus pause ─────────────────────
  _startTimer(ms) {
    this._clearTimer();
    this._totalDuration = ms;
    this._elapsed = 0;
    this._startedAt = Date.now();
    this._paused = false;
    this._timer = window.setTimeout(() => this._dismiss(), ms);
  }

  _clearTimer() {
    if (this._timer != null) {
      window.clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _pause() {
    if (this._paused || this._timer == null) return;
    this._paused = true;
    // Snapshot elapsed time before clearing so we can resume.
    this._elapsed += Date.now() - this._startedAt;
    this._clearTimer();
    const bar = this.querySelector('.hbd-toast__progress');
    if (bar) bar.style.animationPlayState = 'paused';
  }

  _resume() {
    if (!this._paused) return;
    this._paused = false;
    const remaining = Math.max(0, this._totalDuration - this._elapsed);
    if (remaining === 0) {
      this._dismiss();
      return;
    }
    this._startedAt = Date.now();
    this._timer = window.setTimeout(() => this._dismiss(), remaining);
    const bar = this.querySelector('.hbd-toast__progress');
    if (bar) bar.style.animationPlayState = 'running';
  }

  _onPointerEnter() { this._pause(); }
  _onPointerLeave() { this._resume(); }
  _onFocusIn()      { this._pause(); }
  _onFocusOut(e) {
    // Only resume when focus leaves the toast entirely — focus
    // moving between dismiss/action buttons should keep it paused.
    if (this.contains(e.relatedTarget)) return;
    this._resume();
  }

  _onClick(e) {
    const dismissBtn = e.target && e.target.closest && e.target.closest('[data-hbd-toast-dismiss]');
    if (dismissBtn && this.contains(dismissBtn)) {
      this._dismiss();
    }
  }

  // ─── Dismiss ────────────────────────────────────────────────────
  _dismiss() {
    if (this._removed) return;
    this._removed = true;
    this._clearTimer();
    const bar = this.querySelector('.hbd-toast__progress');
    if (bar) bar.style.animationPlayState = 'paused';
    this.classList.remove('is-entering');
    this.classList.add('is-leaving');
    this.addEventListener('animationend', this._onAnimationEnd, { once: true });
  }

  _onAnimationEnd() {
    this.dispatchEvent(new CustomEvent('hbd:dismiss', {
      bubbles: true,
      composed: true,
      detail: { variant: this._variant() },
    }));
    this.remove();
  }
}

if (!customElements.get('hbd-toast-item')) {
  customElements.define('hbd-toast-item', HbdToastItem);
}

// ─── ToastManager singleton ──────────────────────────────────────────
const MAX_STACK = 3;

class ToastManager {
  constructor() {
    this._container = null;
    this._queue = [];
    this._active = [];
    this._maxStack = MAX_STACK;
    this._position = 'top-right';
  }

  _getContainer() {
    if (!this._container || !this._container.isConnected) {
      const c = document.createElement('div');
      c.className = `hbd-toast-container hbd-toast-container--${this._position}`;
      c.setAttribute('role', 'region');
      c.setAttribute('aria-label', 'Notifications');
      c.setAttribute('aria-live', 'polite');
      c.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(c);
      this._container = c;
    }
    return this._container;
  }

  /**
   * Show a toast.
   * @param {object} opts
   * @param {string} opts.message      Body text.
   * @param {string} [opts.title]      Optional bold heading.
   * @param {string} [opts.variant]    "info" (default) | "success" | "warning" | "error".
   * @param {number} [opts.duration]   Auto-dismiss in ms; default 5000. Use Infinity to disable.
   * @param {object} [opts.action]     { label, onClick } — inline activator.
   * @param {boolean} [opts.dismissible] Defaults to true.
   */
  show(opts) {
    const cfg = opts || {};
    if (this._active.length >= this._maxStack) {
      this._queue.push(cfg);
      return;
    }

    const variant = VARIANTS.includes(cfg.variant) ? cfg.variant : 'info';
    const container = this._getContainer();

    // Error toasts temporarily flip the region to assertive so the
    // announcement interrupts. Restore polite on the next macrotask
    // so subsequent non-error toasts announce normally.
    if (variant === 'error') {
      container.setAttribute('aria-live', 'assertive');
      window.setTimeout(() => {
        container.setAttribute('aria-live', 'polite');
      }, 0);
    }

    const toast = document.createElement('hbd-toast-item');
    toast.setAttribute('variant', variant);
    if (cfg.title) toast.setAttribute('title', cfg.title);
    if (cfg.duration != null) toast.setAttribute('duration', String(cfg.duration));
    if (cfg.dismissible !== false) toast.setAttribute('dismissible', '');
    if (typeof cfg.message === 'string') toast.textContent = cfg.message;

    if (cfg.action && typeof cfg.action.label === 'string') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hbd-toast__action';
      btn.textContent = cfg.action.label;
      if (typeof cfg.action.onClick === 'function') {
        btn.addEventListener('click', (e) => {
          // Stop the click from bubbling to the dismiss handler.
          e.stopPropagation();
          try { cfg.action.onClick(e); } finally {
            // After an action runs the toast usually loses relevance.
            toast._dismiss();
          }
        });
      }
      toast.appendChild(btn);
    }

    container.appendChild(toast);
    this._active.push(toast);

    toast.addEventListener('hbd:dismiss', () => {
      this._active = this._active.filter((t) => t !== toast);
      if (this._queue.length > 0) {
        this.show(this._queue.shift());
      }
    });

    return toast;
  }

  setPosition(position) {
    if (!POSITIONS.includes(position)) return;
    this._position = position;
    if (this._container && this._container.isConnected) {
      this._container.className = `hbd-toast-container hbd-toast-container--${position}`;
    }
  }

  /** Convenience shorthands. */
  info(message, opts)    { return this.show(Object.assign({ message, variant: 'info'    }, opts || {})); }
  success(message, opts) { return this.show(Object.assign({ message, variant: 'success' }, opts || {})); }
  warning(message, opts) { return this.show(Object.assign({ message, variant: 'warning' }, opts || {})); }
  error(message, opts)   { return this.show(Object.assign({ message, variant: 'error'   }, opts || {})); }
}

const toast = new ToastManager();

// Expose on window so authoring code that isn't a module can call
// hbdToast.show(...). For ESM consumers, `import { toast } from
// '/ds/components/hbd-toast.js'` works too.
if (typeof window !== 'undefined') {
  window.hbdToast = toast;
}

export { toast };
