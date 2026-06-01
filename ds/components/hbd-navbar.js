// ds/components/hbd-navbar.js
// Here Be Dragons DS — <hbd-navbar> custom element (CLAUDE.md §7).
//
// Primary top navigation bar. Light DOM (NOT Shadow DOM) so the page
// can style slotted content and so the navbar participates in normal
// layout. The component captures slotted children into _source* once,
// then rebuilds the host's innerHTML into the canonical structure.
//
// Variants via attributes:
//   sticky / transparent / bordered
//
// Mobile menu (< 768px viewport): hamburger opens a full-viewport
// panel. Implements the same focus-trap + scroll-lock + return-focus
// chain as <hbd-drawer> — reusing the pattern from drawer.js.
//
// The 768px breakpoint is also expressed in CSS @media — JS reads
// --hbd-navbar-mobile-breakpoint so the two paths stay in sync.

let uidCounter = 0;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Default fallback when reading the custom property fails (e.g. before
// tokens.css is parsed). Matches the value in navbar.css's media query.
const DEFAULT_MOBILE_BREAKPOINT = 768;

let activeMenuLockCount = 0;
let savedBodyOverflow = '';

class HbdNavbar extends HTMLElement {
  static get observedAttributes() {
    return ['sticky', 'transparent', 'bordered'];
  }

  constructor() {
    super();
    this._uid = `hbd-navbar-${++uidCounter}`;
    this._mobileMenuOpen = false;
    this._previousFocus = null;
    this._ready = false;
    this._sourceLogo = null;        // outerHTML string
    this._sourceNav = [];           // array of outerHTML strings
    this._sourceActions = [];       // array of outerHTML strings
    this._resizeTimer = null;
    this._keyListenerInstalled = false;

    this._onHamburgerClick = this._onHamburgerClick.bind(this);
    this._onCloseClick = this._onCloseClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onResize = this._onResize.bind(this);
  }

  connectedCallback() {
    this._captureSource();
    this._ready = true;
    this._render();
    window.addEventListener('resize', this._onResize);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._onResize);
    if (this._mobileMenuOpen) {
      // Clean up the body-scroll lock if the navbar is removed while
      // the menu is open.
      this._releaseScrollLock();
      this._uninstallKeyListener();
    }
    this._removeListeners();
    if (this._resizeTimer) clearTimeout(this._resizeTimer);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._ready) return;
    this._render();
  }

  // ── Source capture ────────────────────────────────────────────────
  // Read slotted authored children (those with slot="logo"|"nav"|
  // "actions") BEFORE we overwrite innerHTML. We store the outerHTML
  // strings so the rebuild can place them in the canonical scaffold
  // AND in the mobile menu mirror without cloning DOM nodes (which
  // would require detaching listeners etc.).
  _captureSource() {
    // If we've already rebuilt, the .hbd-navbar__inner exists in
    // innerHTML — avoid re-capturing from our own scaffold.
    if (this.querySelector(':scope > .hbd-navbar__inner')) return;

    const logo = this.querySelector(':scope > [slot="logo"]');
    const nav = Array.from(this.querySelectorAll(':scope > [slot="nav"]'));
    const actions = Array.from(this.querySelectorAll(':scope > [slot="actions"]'));

    this._sourceLogo = logo ? logo.outerHTML : '';
    this._sourceNav = nav.map((el) => this._withClass(el, 'hbd-navbar__link').outerHTML);
    this._sourceActions = actions.map((el) => el.outerHTML);
  }

  // Clone an element + add a class to the clone so the slot attribute
  // can be stripped (it's irrelevant in Light DOM mode but harmless).
  _withClass(el, cls) {
    const clone = el.cloneNode(true);
    clone.classList.add(cls);
    clone.removeAttribute('slot');
    return clone;
  }

  // ── Helpers ───────────────────────────────────────────────────────
  _mobileBreakpoint() {
    // Read the token at runtime so any theme override is honoured.
    const v = getComputedStyle(this)
      .getPropertyValue('--hbd-navbar-mobile-breakpoint').trim();
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_MOBILE_BREAKPOINT;
  }
  _isMobileViewport() {
    return window.innerWidth < this._mobileBreakpoint();
  }

  _buildModifiers() {
    const out = [];
    if (this.hasAttribute('sticky')) out.push('hbd-navbar--sticky');
    if (this.hasAttribute('transparent')) out.push('hbd-navbar--transparent');
    if (this.hasAttribute('bordered')) out.push('hbd-navbar--bordered');
    if (this._mobileMenuOpen) out.push('is-open');
    return out;
  }

  // ── Render ────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const cls = ['hbd-navbar', ...this._buildModifiers()].join(' ');
    this.className = cls;
    this.setAttribute('role', 'banner');

    // Build the mobile-action list — by default we mirror the desktop
    // actions there. Authors who want different mobile actions can
    // override after the render via slot="mobile-actions" capture
    // (out of scope for v1; keep it simple: mirror desktop).
    const mobileActionsHtml = this._sourceActions.join('');

    // Active link detection — walk href against window.location and tag
    // matches. Best-effort: exact pathname match only.
    const activatedNav = this._sourceNav.map((html) =>
      this._maybeMarkActive(html, 'hbd-navbar__link'));
    const activatedMobileNav = this._sourceNav.map((html) =>
      this._maybeMarkActive(
        this._swapClass(html, 'hbd-navbar__link', 'hbd-navbar__mobile-link'),
        'hbd-navbar__mobile-link',
      ));

    this.innerHTML = `
      <div class="hbd-navbar__inner">
        <div class="hbd-navbar__logo">${this._sourceLogo || ''}</div>

        <nav class="hbd-navbar__nav" aria-label="Main navigation">
          ${activatedNav.join('')}
        </nav>

        <div class="hbd-navbar__actions">
          ${this._sourceActions.join('')}
          <hbd-button class="hbd-navbar__hamburger"
                      variant="default"
                      icon-only
                      aria-label="Open navigation menu"
                      aria-expanded="false"
                      aria-controls="mobile-menu-${uid}">
            <span class="hbd-button__icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor"
                      stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </span>
          </hbd-button>
        </div>
      </div>

      <div class="hbd-navbar__mobile-menu"
           id="mobile-menu-${uid}"
           role="dialog"
           aria-modal="true"
           aria-label="Mobile navigation"
           aria-hidden="${this._mobileMenuOpen ? 'false' : 'true'}">
        <div class="hbd-navbar__mobile-header">
          <div class="hbd-navbar__logo">${this._sourceLogo || ''}</div>
          <hbd-button class="hbd-navbar__mobile-close"
                      variant="default"
                      icon-only
                      aria-label="Close navigation menu">
            <span class="hbd-button__icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor"
                      stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </span>
          </hbd-button>
        </div>

        <nav class="hbd-navbar__mobile-nav" aria-label="Mobile navigation">
          ${activatedMobileNav.join('')}
        </nav>

        <div class="hbd-navbar__mobile-actions">
          ${mobileActionsHtml}
        </div>
      </div>
    `;

    this._wireListeners();
  }

  // ── Markup helpers ────────────────────────────────────────────────
  _maybeMarkActive(html, baseClass) {
    // Parse the outerHTML string into an element, check href against
    // window.location.pathname, and re-serialise. We do this on a
    // detached element so listeners aren't bound prematurely.
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    const node = tpl.content.firstElementChild;
    if (!node) return html;
    const href = node.getAttribute('href');
    if (href) {
      try {
        const url = new URL(href, window.location.href);
        if (url.pathname === window.location.pathname) {
          node.classList.add('is-active');
          node.setAttribute('aria-current', 'page');
        }
      } catch { /* ignore unparseable hrefs */ }
    }
    // Authors who set is-active manually on the source element will
    // already have it on the clone — no need to special-case.
    void baseClass; // silence unused-var hint
    return node.outerHTML;
  }

  _swapClass(html, fromCls, toCls) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    const node = tpl.content.firstElementChild;
    if (!node) return html;
    node.classList.remove(fromCls);
    node.classList.add(toCls);
    return node.outerHTML;
  }

  // ── Wiring ────────────────────────────────────────────────────────
  _wireListeners() {
    const hamburger = this.querySelector('.hbd-navbar__hamburger');
    const closeBtn = this.querySelector('.hbd-navbar__mobile-close');
    if (hamburger) hamburger.addEventListener('click', this._onHamburgerClick);
    if (closeBtn) closeBtn.addEventListener('click', this._onCloseClick);
  }
  _removeListeners() {
    const hamburger = this.querySelector('.hbd-navbar__hamburger');
    const closeBtn = this.querySelector('.hbd-navbar__mobile-close');
    if (hamburger) hamburger.removeEventListener('click', this._onHamburgerClick);
    if (closeBtn) closeBtn.removeEventListener('click', this._onCloseClick);
  }

  // ── Public API ────────────────────────────────────────────────────
  openMobileMenu() { this._openMobileMenu(); }
  closeMobileMenu() { this._closeMobileMenu(); }
  get isMobileMenuOpen() { return this._mobileMenuOpen; }

  // ── Mobile menu open / close ──────────────────────────────────────
  _openMobileMenu() {
    if (this._mobileMenuOpen) return;
    this._previousFocus = this._captureActiveElement();
    this._lockScroll();
    this._mobileMenuOpen = true;
    this.classList.add('is-open');

    const menu = this.querySelector('.hbd-navbar__mobile-menu');
    if (menu) menu.setAttribute('aria-hidden', 'false');

    const hamburger = this.querySelector('.hbd-navbar__hamburger');
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Close navigation menu');
    }

    this._installKeyListener();

    // Defer focus to the next frame so the transition has begun and the
    // close button is positioned on-screen.
    requestAnimationFrame(() => {
      const closeBtn = this.querySelector('.hbd-navbar__mobile-close');
      if (closeBtn) {
        const inner = closeBtn.shadowRoot && closeBtn.shadowRoot.querySelector('button');
        (inner || closeBtn).focus({ preventScroll: true });
      }
    });

    this.dispatchEvent(new CustomEvent('hbd:open', {
      bubbles: true, composed: true,
    }));
  }

  _closeMobileMenu() {
    if (!this._mobileMenuOpen) return;
    this._mobileMenuOpen = false;
    this.classList.remove('is-open');

    const menu = this.querySelector('.hbd-navbar__mobile-menu');
    if (menu) menu.setAttribute('aria-hidden', 'true');

    const hamburger = this.querySelector('.hbd-navbar__hamburger');
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open navigation menu');
    }

    this._releaseScrollLock();
    this._uninstallKeyListener();

    // Restore focus to the previously-focused element if it's still
    // connected; otherwise route back to the hamburger as a fallback.
    const prev = this._previousFocus;
    this._previousFocus = null;
    const target = (prev && prev.isConnected) ? prev : hamburger;
    if (target && typeof target.focus === 'function') {
      // Hamburger is an hbd-button — focus its inner native button.
      const inner = target.shadowRoot && target.shadowRoot.querySelector
        && target.shadowRoot.querySelector('button');
      (inner || target).focus({ preventScroll: true });
    }

    this.dispatchEvent(new CustomEvent('hbd:close', {
      bubbles: true, composed: true,
    }));
  }

  // ── Scroll lock (ref-counted across drawers + navbar menus) ───────
  _lockScroll() {
    if (activeMenuLockCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    activeMenuLockCount += 1;
  }
  _releaseScrollLock() {
    if (activeMenuLockCount === 0) return;
    activeMenuLockCount -= 1;
    if (activeMenuLockCount === 0) {
      document.body.style.overflow = savedBodyOverflow;
      savedBodyOverflow = '';
    }
  }

  // ── Focus trap + Escape ───────────────────────────────────────────
  _installKeyListener() {
    if (this._keyListenerInstalled) return;
    this._keyListenerInstalled = true;
    document.addEventListener('keydown', this._onKeydown, true);
  }
  _uninstallKeyListener() {
    if (!this._keyListenerInstalled) return;
    this._keyListenerInstalled = false;
    document.removeEventListener('keydown', this._onKeydown, true);
  }
  _onKeydown(e) {
    if (!this._mobileMenuOpen) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      this._closeMobileMenu();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = this._getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this._captureActiveElement();
    if (e.shiftKey) {
      if (active === first || active == null) {
        e.preventDefault();
        last.focus({ preventScroll: false });
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus({ preventScroll: false });
    }
  }

  _captureActiveElement() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  }

  _getFocusable() {
    const menu = this.querySelector('.hbd-navbar__mobile-menu');
    if (!menu) return [];
    return Array.from(menu.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((el) => {
        if (el.closest('[aria-hidden="true"]')) return false;
        if (el.offsetParent !== null) return true;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
  }

  // ── Event handlers ────────────────────────────────────────────────
  _onHamburgerClick(e) {
    e.stopPropagation();
    if (this._mobileMenuOpen) this._closeMobileMenu();
    else this._openMobileMenu();
  }
  _onCloseClick(e) {
    e.stopPropagation();
    this._closeMobileMenu();
  }

  // ── Resize handling ───────────────────────────────────────────────
  // If the viewport crosses the mobile breakpoint while the menu is
  // open, close it and release the scroll lock — the desktop nav has
  // taken over visually and the off-canvas panel would be orphaned.
  // Debounced so a continuous drag doesn't fire excessively.
  _onResize() {
    if (this._resizeTimer) clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => {
      this._resizeTimer = null;
      if (this._mobileMenuOpen && !this._isMobileViewport()) {
        this._closeMobileMenu();
      }
    }, 120);
  }
}

if (!customElements.get('hbd-navbar')) {
  customElements.define('hbd-navbar', HbdNavbar);
}
