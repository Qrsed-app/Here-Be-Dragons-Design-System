// ds/utils/shared-styles.js
// Here Be Dragons DS — adopted-stylesheet helper.
//
// Why this exists: components built with Shadow DOM previously wrote
// <link rel="stylesheet"> tags into their shadow roots on every render. Each
// re-render created new <link> elements that triggered a brief unstyled
// moment (FOUC = "blink") while the linked CSS was re-resolved. With
// adopted stylesheets, each stylesheet is fetched and parsed ONCE globally,
// cached as a CSSStyleSheet object, and shared across every component
// instance and every re-render — no flicker, no reparse.
//
// Usage from a component:
//
//   import { adoptStyles } from '../utils/shared-styles.js';
//   class HbdFoo extends HTMLElement {
//     constructor() { super(); this.attachShadow({ mode: 'open' }); }
//     connectedCallback() {
//       adoptStyles(this.shadowRoot, [
//         '/tokens/tokens.css',
//         '/ds/styles/components/foo.css',
//       ]);
//       this._render();
//     }
//   }
//
// Then _render() writes plain HTML into shadowRoot.innerHTML — NO <link>
// tags. The styles persist across innerHTML replacements because they live
// on the shadowRoot.adoptedStyleSheets array, not in the rendered tree.

// path → Promise<CSSStyleSheet> cache. One fetch per stylesheet for the
// lifetime of the page.
const cache = new Map();

function loadSheet(path) {
  if (cache.has(path)) return cache.get(path);
  const p = fetch(path)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load stylesheet: ${path} (${r.status})`);
      return r.text();
    })
    .then((text) => {
      const sheet = new CSSStyleSheet();
      // replace() returns a Promise that resolves when the parsing finishes.
      return sheet.replace(text).then(() => sheet);
    });
  cache.set(path, p);
  return p;
}

/**
 * Adopt one or more stylesheets into a shadow root. Idempotent — calling
 * twice with the same paths does not duplicate entries on the adopted list.
 *
 * The adoption is asynchronous on the FIRST call for a given path (one
 * network fetch + parse). Subsequent components reuse the cached
 * CSSStyleSheet and adoption is effectively synchronous because the Promise
 * is already resolved. preloadStyles() below can warm the cache eagerly.
 *
 * @param {ShadowRoot} shadowRoot
 * @param {string[]} paths
 */
export function adoptStyles(shadowRoot, paths) {
  Promise.all(paths.map(loadSheet)).then((sheets) => {
    // Merge with any sheets already adopted, dedupe, and assign.
    const existing = shadowRoot.adoptedStyleSheets || [];
    const merged = existing.slice();
    sheets.forEach((s) => { if (!merged.includes(s)) merged.push(s); });
    shadowRoot.adoptedStyleSheets = merged;
  }).catch((err) => {
    console.error('[hbd] adoptStyles failed:', err);
  });
}

/**
 * Warm the cache for the standard DS stylesheets. Call this from the barrel
 * (ds/index.js) so the sheets are fetched once at app boot — by the time the
 * first component upgrades, the adoption is synchronous from cache.
 */
export function preloadStyles(paths) {
  paths.forEach(loadSheet);
}
