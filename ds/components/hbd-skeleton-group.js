// ds/components/hbd-skeleton-group.js
// Here Be Dragons DS — <hbd-skeleton-group> custom element (CLAUDE.md §7).
//
// Light DOM. A named layout preset that arranges multiple
// <hbd-skeleton> shapes into recognisable patterns (avatar+text row,
// card, list-item, table-row). The group itself is purely decorative
// — the containing element owns aria-busy. See hbd-skeleton.js for
// the full aria-busy pattern.
//
// Attributes:
//   preset    — "avatar-text" (default) | "card" | "list-item" | "table-row"
//   lines     — number of text lines for text-heavy presets (default 3)
//   columns   — number of cells in the table-row preset (default 4)
//   no-shimmer — boolean; cascades to child skeletons via attribute.
//
// Widths cycle deterministically — no Math.random() so the preview
// (and any author tests) look identical on every render.

const PRESETS = ['avatar-text', 'card', 'list-item', 'table-row'];
const LINE_WIDTHS = [100, 90, 75, 85, 60, 70];

class HbdSkeletonGroup extends HTMLElement {
  static get observedAttributes() {
    return ['preset', 'lines', 'columns', 'no-shimmer'];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(_n, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (this.isConnected) this._render();
  }

  get _preset() {
    const raw = (this.getAttribute('preset') || 'avatar-text').toLowerCase();
    return PRESETS.includes(raw) ? raw : 'avatar-text';
  }

  get _lines() {
    const n = parseInt(this.getAttribute('lines'), 10);
    return Number.isFinite(n) && n > 0 ? n : 3;
  }

  get _columns() {
    const n = parseInt(this.getAttribute('columns'), 10);
    return Number.isFinite(n) && n > 0 ? n : 4;
  }

  get _noShimmer() {
    return this.hasAttribute('no-shimmer') ? ' no-shimmer' : '';
  }

  _render() {
    const preset = this._preset;
    const noShim = this._noShimmer;
    this.className = `hbd-skeleton-group hbd-skeleton-group--${preset}`;
    // Skeleton groups are decorative containers. The aria-busy live
    // region lives one level higher, on the author's loading
    // wrapper. We mark the group itself as aria-hidden to keep AT
    // from announcing the placeholder shapes individually.
    this.setAttribute('aria-hidden', 'true');

    let html = '';
    if (preset === 'avatar-text') html = this._renderAvatarText(noShim);
    else if (preset === 'card')   html = this._renderCard(noShim);
    else if (preset === 'list-item') html = this._renderListItem(noShim);
    else if (preset === 'table-row') html = this._renderTableRow(noShim);

    this.innerHTML = html;
  }

  _renderAvatarText(noShim) {
    return (
      `<hbd-skeleton variant="circle"${noShim}></hbd-skeleton>` +
      `<div class="hbd-skeleton-group__body">` +
        `<hbd-skeleton variant="text-lg" width="70%"${noShim}></hbd-skeleton>` +
        `<hbd-skeleton variant="text-sm" width="50%"${noShim}></hbd-skeleton>` +
      `</div>`
    );
  }

  _renderCard(noShim) {
    const lines = this._lines;
    const textLines = Math.max(1, lines - 1);
    let lineHtml = `<hbd-skeleton variant="text-lg" width="80%"${noShim}></hbd-skeleton>`;
    for (let i = 0; i < textLines; i += 1) {
      const w = LINE_WIDTHS[i % LINE_WIDTHS.length];
      lineHtml += `<hbd-skeleton variant="text" width="${w}%"${noShim}></hbd-skeleton>`;
    }
    lineHtml += `<hbd-skeleton variant="text-sm" width="40%"${noShim}></hbd-skeleton>`;
    return (
      `<hbd-skeleton variant="rect" height="160px"${noShim}></hbd-skeleton>` +
      `<div class="hbd-skeleton-group__card-body">` +
        lineHtml +
      `</div>`
    );
  }

  _renderListItem(noShim) {
    return (
      `<hbd-skeleton variant="circle"${noShim}></hbd-skeleton>` +
      `<div class="hbd-skeleton-group__body hbd-skeleton-group__body--tight">` +
        `<hbd-skeleton variant="text" width="60%"${noShim}></hbd-skeleton>` +
        `<hbd-skeleton variant="text-sm" width="40%"${noShim}></hbd-skeleton>` +
      `</div>` +
      `<hbd-skeleton variant="text-sm" width="48px"${noShim}></hbd-skeleton>`
    );
  }

  _renderTableRow(noShim) {
    const cols = this._columns;
    let cells = '';
    for (let i = 0; i < cols; i += 1) {
      cells += `<hbd-skeleton variant="rect"${noShim}></hbd-skeleton>`;
    }
    return cells;
  }
}

if (!customElements.get('hbd-skeleton-group')) {
  customElements.define('hbd-skeleton-group', HbdSkeletonGroup);
}
