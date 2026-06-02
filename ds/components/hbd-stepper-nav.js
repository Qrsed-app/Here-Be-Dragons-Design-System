// ds/components/hbd-stepper-nav.js
// Here Be Dragons DS — <hbd-stepper-nav> custom element (CLAUDE.md §7).
//
// Stepper navigation. Renders a horizontal or vertical row/column of
// numbered steps with connecting lines. Each <hbd-step> child carries
// label + description + optional explicit status; status is otherwise
// computed from the `active` index on the host.
//
// Light DOM so the rendered <nav> participates in landmark navigation
// and consumers can style descendants from page-level CSS.
//
// Naming note: this element is <hbd-stepper-nav>, not <hbd-stepper>,
// because <hbd-stepper> is already taken by the numeric input stepper.
//
// Markup:
//   <hbd-stepper-nav active="1">
//     <hbd-step label="Character" description="Name and race"></hbd-step>
//     <hbd-step label="Class"></hbd-step>
//     <hbd-step label="Abilities" status="error"></hbd-step>
//     <hbd-step label="Equipment"></hbd-step>
//   </hbd-stepper-nav>
//
// Attributes on <hbd-stepper-nav>:
//   active   — 0-based index of the current step (default "0")
//   variant  — "horizontal" (default) | "vertical"
//   mode     — "linear" (default) | "non-linear"
//
// Events:
//   hbd:change — fired on click of a non-linear indicator OR when the
//                public next() / previous() methods change the active
//                step. detail = { step, label }.

// ─── Companion element: <hbd-step> ────────────────────────────────────
// Data carrier. Holds label/description/status. Re-renders the parent
// when any of these change so authors can drive state declaratively.
class HbdStep extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'description', 'status'];
  }

  connectedCallback() {
    // <hbd-step> has no visual rendering of its own; the parent owns the
    // DOM. Ask the parent to re-render whenever a step is attached so
    // late-inserted steps appear without an explicit author call.
    this._notifyParent();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    this._notifyParent();
  }

  _notifyParent() {
    const parent = this.closest('hbd-stepper-nav');
    if (parent && typeof parent._render === 'function') {
      // Microtask so a batch of step mutations only triggers one render.
      queueMicrotask(() => parent._render());
    }
  }
}
if (!customElements.get('hbd-step')) {
  customElements.define('hbd-step', HbdStep);
}

// ─── Main element: <hbd-stepper-nav> ──────────────────────────────────
class HbdStepperNav extends HTMLElement {
  static get observedAttributes() {
    return ['active', 'variant', 'mode'];
  }

  constructor() {
    super();
    this._onClick = this._onClick.bind(this);
    // Per-step status overrides set via the public setStepStatus() API.
    // Keyed by step index; takes priority over the active-derived
    // status when present.
    this._statusOverrides = new Map();
    this._ready = false;
  }

  connectedCallback() {
    this._ready = true;
    this._render();
    this.addEventListener('click', this._onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  // ─── Public API ─────────────────────────────────────────────────────
  setStepStatus(index, status) {
    // Allow null/undefined to CLEAR an override and fall back to the
    // computed status.
    if (status == null) {
      this._statusOverrides.delete(index);
    } else {
      this._statusOverrides.set(index, status);
    }
    // Also mirror onto the underlying <hbd-step> so the markup reflects
    // the override and authors reading from the DOM see the right value.
    const stepEl = this._stepElements[index];
    if (stepEl) {
      if (status == null) stepEl.removeAttribute('status');
      else stepEl.setAttribute('status', status);
    }
    this._render();
  }

  next() {
    const total = this._stepElements.length;
    const cur = this._active;
    if (cur >= total - 1) return;
    const newIndex = cur + 1;
    this.setAttribute('active', String(newIndex));
    this._fireChange(newIndex);
  }

  previous() {
    const cur = this._active;
    if (cur <= 0) return;
    const newIndex = cur - 1;
    this.setAttribute('active', String(newIndex));
    this._fireChange(newIndex);
  }

  // ─── Internal helpers ───────────────────────────────────────────────
  get _stepElements() {
    return Array.from(this.querySelectorAll(':scope > hbd-step'));
  }

  get _active() {
    const n = parseInt(this.getAttribute('active'), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  get _variant() {
    const v = (this.getAttribute('variant') || 'horizontal').toLowerCase();
    return v === 'vertical' ? 'vertical' : 'horizontal';
  }

  get _mode() {
    const m = (this.getAttribute('mode') || 'linear').toLowerCase();
    return m === 'non-linear' ? 'non-linear' : 'linear';
  }

  _statusFor(index) {
    // Explicit override (from setStepStatus or status attribute) wins.
    if (this._statusOverrides.has(index)) {
      return this._statusOverrides.get(index);
    }
    const stepEl = this._stepElements[index];
    const explicit = stepEl && stepEl.getAttribute('status');
    if (explicit) return explicit;
    const active = this._active;
    if (index < active) return 'completed';
    if (index === active) return 'active';
    return 'upcoming';
  }

  _iconFor(status, indexLabel) {
    if (status === 'completed') {
      // 16x16 checkmark — currentColor inherits from indicator text colour.
      return `
        <span class="hbd-stepper__indicator-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 8.5 7 12 13 5"></polyline>
          </svg>
        </span>`;
    }
    if (status === 'error') {
      // ! glyph — circle outline + exclamation stroke.
      return `
        <span class="hbd-stepper__indicator-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="4"  x2="8" y2="9"></line>
            <line x1="8" y1="12" x2="8" y2="12"></line>
          </svg>
        </span>`;
    }
    return String(indexLabel);
  }

  _render() {
    if (!this._ready) return;

    const steps = this._stepElements;
    const variant = this._variant;
    const mode = this._mode;

    const variantClass = `hbd-stepper--${variant}`;
    const modeClass = mode === 'non-linear' ? ' hbd-stepper--non-linear' : '';
    const active = this._active;

    // Build the <ol> markup. We render to a string and assign once so
    // there's a single DOM mutation per state change.
    const items = steps.map((stepEl, index) => {
      const label = stepEl.getAttribute('label') || '';
      const description = stepEl.getAttribute('description') || '';
      const status = this._statusFor(index);
      const isLast = index === steps.length - 1;

      const clickable =
        mode === 'non-linear' &&
        (status === 'completed' || status === 'error');

      const indicatorInner = this._iconFor(status, index + 1);

      const ariaCurrent = index === active ? ' aria-current="step"' : '';

      // Error steps surface an SR-only label so the status reaches AT
      // even without colour. Completed steps get the same treatment so
      // screen readers announce progress, not just position.
      let srStatus = '';
      if (status === 'error') {
        srStatus = '<span class="hbd-sr-only">Error: </span>';
      } else if (status === 'completed') {
        srStatus = '<span class="hbd-sr-only">Completed: </span>';
      }

      const indicator = clickable
        ? `<button class="hbd-stepper__indicator"
                   type="button"
                   data-step="${index}"
                   aria-label="Go to step ${index + 1}: ${escapeAttr(label)}">
             ${indicatorInner}
           </button>`
        : `<div class="hbd-stepper__indicator" aria-hidden="true">
             ${indicatorInner}
           </div>`;

      const descriptionHtml = description
        ? `<div class="hbd-stepper__description">${escapeText(description)}</div>`
        : '';

      const connector = isLast
        ? ''
        : '<div class="hbd-stepper__connector" aria-hidden="true"></div>';

      return `
        <li class="hbd-stepper__step hbd-stepper__step--${status}"${ariaCurrent}>
          ${indicator}
          <div class="hbd-stepper__content">
            <div class="hbd-stepper__label">${srStatus}${escapeText(label)}</div>
            ${descriptionHtml}
          </div>
          ${connector}
        </li>`;
    }).join('');

    this.innerHTML = `
      <nav class="hbd-stepper ${variantClass}${modeClass}"
           aria-label="Progress steps">
        <ol class="hbd-stepper__list">${items}</ol>
      </nav>`;
  }

  _onClick(e) {
    // Non-linear: a clickable indicator carries data-step.
    const btn = e.target && e.target.closest
      ? e.target.closest('button.hbd-stepper__indicator[data-step]')
      : null;
    if (!btn || !this.contains(btn)) return;
    const target = parseInt(btn.getAttribute('data-step'), 10);
    if (!Number.isFinite(target)) return;
    if (target === this._active) return;
    this.setAttribute('active', String(target));
    this._fireChange(target);
  }

  _fireChange(index) {
    const stepEl = this._stepElements[index];
    const label = stepEl ? stepEl.getAttribute('label') || '' : '';
    this.dispatchEvent(new CustomEvent('hbd:change', {
      detail: { step: index, label },
      bubbles: true,
      composed: true,
    }));
  }
}

// ─── Tiny HTML-escape helpers (avoid drag-in deps) ────────────────────
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

if (!customElements.get('hbd-stepper-nav')) {
  customElements.define('hbd-stepper-nav', HbdStepperNav);
}
