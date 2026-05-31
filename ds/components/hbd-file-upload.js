// ds/components/hbd-file-upload.js
// Here Be Dragons DS — <hbd-file-upload> custom element (CLAUDE.md §7).
//
// Two interaction modes: click-to-browse (the dropzone is a role="button")
// and drag-and-drop (HTML5 DnD events on the dropzone). Supports single +
// multiple files, MIME/extension restriction, max-size, max-files, per-file
// progress, image thumbnails via FileReader, and per-file/field error states.
//
// Shadow DOM. Styles via adopted stylesheets (../utils/shared-styles.js).
//
// Form association caveat: ElementInternals.setFormValue does not have a
// universally-supported representation for binary File data, so we expose a
// public getFiles() method instead of trying to round-trip files through
// the form value. Authors who need traditional form submission should use a
// real <input type="file"> in the form, or read the files via getFiles() and
// send them via fetch/FormData on submit. This is documented for downstream
// consumers, not silently swallowed.
//
// Live-region note for SC 1.3.1: the file list is aria-live="polite" so
// additions/removals are announced. File rejections fire the hbd:rejected
// event — the consuming app is responsible for routing those to its own
// live region or toast. The DS does not announce rejections itself because
// app-level UX (modal vs inline toast vs silent log) varies.

import { adoptStyles } from '../utils/shared-styles.js';

let uidCounter = 0;
let fileIdCounter = 0;

class HbdFileUpload extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      'label', 'hint', 'error', 'accept', 'multiple',
      'max-size', 'max-files', 'disabled', 'name',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();
    this._uid = `hbd-file-upload-${++uidCounter}`;
    this._files = []; // { id, file, status, error, progress }
    this._ready = false;

    this._onDropzoneClick = this._onDropzoneClick.bind(this);
    this._onDropzoneKeydown = this._onDropzoneKeydown.bind(this);
    this._onInputChange = this._onInputChange.bind(this);
    this._onDragEnter = this._onDragEnter.bind(this);
    this._onDragOver = this._onDragOver.bind(this);
    this._onDragLeave = this._onDragLeave.bind(this);
    this._onDrop = this._onDrop.bind(this);
    this._onDocDragOver = this._onDocDragOver.bind(this);
    this._onDocDrop = this._onDocDrop.bind(this);
    this._onListClick = this._onListClick.bind(this);
  }

  connectedCallback() {
    adoptStyles(this.shadowRoot, [
      '/tokens/tokens.css',
      '/ds/styles/foundations/accessibility.css',
      '/ds/styles/components/input.css',
      '/ds/styles/components/file-upload.css',
    ]);
    this._ready = true;
    this._render();

    // Prevent the browser from navigating away when a file is dropped
    // outside our dropzone. Cleaned up on disconnect.
    document.addEventListener('dragover', this._onDocDragOver);
    document.addEventListener('drop', this._onDocDrop);
  }

  disconnectedCallback() {
    this._removeListeners();
    document.removeEventListener('dragover', this._onDocDragOver);
    document.removeEventListener('drop', this._onDocDrop);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (this._ready) this._render();
  }

  // ── Public API ──────────────────────────────────────────────────────
  /** Returns the current File objects (not the internal records). */
  getFiles() {
    return this._files.map((r) => r.file);
  }

  /** Update progress on a file by its id (0–100). */
  setProgress(fileId, percent) {
    const rec = this._files.find((r) => r.id === fileId);
    if (!rec) return;
    const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
    rec.progress = clamped;
    if (clamped >= 100) rec.status = 'complete';
    this._syncFileItem(rec);
  }

  /** Mark a file as errored with a message. */
  setFileError(fileId, message) {
    const rec = this._files.find((r) => r.id === fileId);
    if (!rec) return;
    rec.status = 'error';
    rec.error = message || 'Upload failed';
    this._syncFileItem(rec);
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _describedBy(ids) {
    return ids.filter(Boolean).join(' ');
  }

  _formatSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  }

  _constraintsText() {
    const accept = this.getAttribute('accept');
    const maxSize = this.getAttribute('max-size');
    const maxFiles = this.getAttribute('max-files');
    const parts = [];
    if (accept) parts.push(`Accepted: ${accept}`);
    if (maxSize) parts.push(`Max ${this._formatSize(parseInt(maxSize, 10))} per file`);
    if (maxFiles) parts.push(`Up to ${maxFiles} files`);
    return parts.join(' · ');
  }

  _matchesAccept(file, acceptStr) {
    if (!acceptStr) return true;
    const tokens = acceptStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (tokens.length === 0) return true;
    const name = file.name || '';
    const type = file.type || '';
    const ext = '.' + (name.split('.').pop() || '').toLowerCase();
    return tokens.some((tok) => {
      const t = tok.toLowerCase();
      if (t.startsWith('.')) return ext === t;
      if (t.endsWith('/*')) return type.toLowerCase().startsWith(t.slice(0, -1));
      return type.toLowerCase() === t;
    });
  }

  _removeListeners() {
    const dz = this.shadowRoot.querySelector('.hbd-file-upload__dropzone');
    if (dz) {
      dz.removeEventListener('click', this._onDropzoneClick);
      dz.removeEventListener('keydown', this._onDropzoneKeydown);
      dz.removeEventListener('dragenter', this._onDragEnter);
      dz.removeEventListener('dragover', this._onDragOver);
      dz.removeEventListener('dragleave', this._onDragLeave);
      dz.removeEventListener('drop', this._onDrop);
    }
    const input = this.shadowRoot.querySelector('.hbd-file-upload__input');
    if (input) input.removeEventListener('change', this._onInputChange);
    const list = this.shadowRoot.querySelector('.hbd-file-upload__file-list');
    if (list) list.removeEventListener('click', this._onListClick);
  }

  // ── Render ──────────────────────────────────────────────────────────
  _render() {
    this._removeListeners();

    const uid = this._uid;
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint');
    const error = this.getAttribute('error');
    const accept = this.getAttribute('accept') || '';
    const multiple = this.hasAttribute('multiple');
    const disabled = this.hasAttribute('disabled');

    const hasError = error != null && error !== '';
    const hasHint = hint != null && hint !== '';
    const constraints = this._constraintsText();

    const fieldClasses = ['hbd-field'];
    if (hasError) fieldClasses.push('hbd-field--error');
    if (disabled) fieldClasses.push('hbd-field--disabled');

    const uploadClasses = ['hbd-file-upload'];
    if (hasError) uploadClasses.push('hbd-file-upload--error');
    if (disabled) uploadClasses.push('hbd-file-upload--disabled');

    const describedBy = this._describedBy([
      constraints ? `constraints-${uid}` : '',
      hasHint ? `hint-${uid}` : '',
      hasError ? `error-${uid}` : '',
    ]);

    const dropzoneAriaLabel = label || 'Upload files';

    this.shadowRoot.innerHTML = `
      <div class="${fieldClasses.join(' ')}">
        ${label ? `
        <label class="hbd-field__label" for="file-input-${uid}">
          ${this._esc(label)}
        </label>` : ''}

        <div class="${uploadClasses.join(' ')}">

          <div class="hbd-file-upload__dropzone"
               role="button"
               tabindex="${disabled ? '-1' : '0'}"
               aria-label="${this._esc(dropzoneAriaLabel)}"
               ${describedBy ? `aria-describedby="${describedBy}"` : ''}
               ${disabled ? 'aria-disabled="true"' : ''}>

            <span class="hbd-file-upload__icon" aria-hidden="true">${this._iconUpload()}</span>

            <p class="hbd-file-upload__prompt">
              Drag files here or
              <span class="hbd-file-upload__browse">browse</span>
            </p>

            ${constraints ? `
            <p class="hbd-file-upload__constraints" id="constraints-${uid}">
              ${this._esc(constraints)}
            </p>` : ''}

          </div>

          <input class="hbd-file-upload__input hbd-sr-only"
                 type="file"
                 id="file-input-${uid}"
                 ${multiple ? 'multiple' : ''}
                 ${accept ? `accept="${this._esc(accept)}"` : ''}
                 ${disabled ? 'disabled' : ''}
                 aria-hidden="true"
                 tabindex="-1">

          <ul class="hbd-file-upload__file-list"
              aria-label="Selected files"
              aria-live="polite"
              aria-relevant="additions removals"></ul>

        </div>

        <div class="hbd-field__footer">
          ${hasHint ? `<span class="hbd-field__hint" id="hint-${uid}">${this._esc(hint)}</span>` : ''}
          ${hasError ? `<span class="hbd-field__error" id="error-${uid}" role="alert">${this._esc(error)}</span>` : ''}
        </div>
      </div>
    `;

    // Wire listeners on freshly-rendered nodes.
    const dz = this.shadowRoot.querySelector('.hbd-file-upload__dropzone');
    dz.addEventListener('click', this._onDropzoneClick);
    dz.addEventListener('keydown', this._onDropzoneKeydown);
    dz.addEventListener('dragenter', this._onDragEnter);
    dz.addEventListener('dragover', this._onDragOver);
    dz.addEventListener('dragleave', this._onDragLeave);
    dz.addEventListener('drop', this._onDrop);

    const input = this.shadowRoot.querySelector('.hbd-file-upload__input');
    input.addEventListener('change', this._onInputChange);

    const list = this.shadowRoot.querySelector('.hbd-file-upload__file-list');
    list.addEventListener('click', this._onListClick);

    // Re-render existing files (e.g. after attribute change forces _render).
    this._files.forEach((rec) => this._appendFileItem(rec));
  }

  // ── Dropzone interactions ───────────────────────────────────────────
  _onDropzoneClick() {
    if (this.hasAttribute('disabled')) return;
    const input = this.shadowRoot.querySelector('.hbd-file-upload__input');
    if (input) input.click();
  }

  _onDropzoneKeydown(e) {
    if (this.hasAttribute('disabled')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._onDropzoneClick();
    }
  }

  _onInputChange(e) {
    this._handleFiles(e.target.files);
    // Reset the input so re-selecting the same file fires change again.
    e.target.value = '';
  }

  _onDragEnter(e) {
    if (this.hasAttribute('disabled')) return;
    e.preventDefault();
    const upload = this.shadowRoot.querySelector('.hbd-file-upload');
    if (upload) upload.classList.add('hbd-file-upload--drag-over');
  }

  _onDragOver(e) {
    if (this.hasAttribute('disabled')) return;
    e.preventDefault();
  }

  _onDragLeave(e) {
    // dragleave fires when the cursor enters a child; only clear if the
    // cursor is actually leaving the dropzone box.
    const dz = e.currentTarget;
    if (!dz) return;
    const rect = dz.getBoundingClientRect();
    if (e.clientX <= rect.left || e.clientX >= rect.right ||
        e.clientY <= rect.top  || e.clientY >= rect.bottom) {
      const upload = this.shadowRoot.querySelector('.hbd-file-upload');
      if (upload) upload.classList.remove('hbd-file-upload--drag-over');
    }
  }

  _onDrop(e) {
    if (this.hasAttribute('disabled')) return;
    e.preventDefault();
    const upload = this.shadowRoot.querySelector('.hbd-file-upload');
    if (upload) upload.classList.remove('hbd-file-upload--drag-over');
    if (e.dataTransfer && e.dataTransfer.files) {
      this._handleFiles(e.dataTransfer.files);
    }
  }

  _onDocDragOver(e) { e.preventDefault(); }
  _onDocDrop(e) { e.preventDefault(); }

  _onListClick(e) {
    const btn = e.target.closest('.hbd-file-upload__file-remove');
    if (!btn) return;
    const fileId = btn.getAttribute('data-file-id');
    if (!fileId) return;
    this._removeFile(fileId);
  }

  // ── File handling ───────────────────────────────────────────────────
  _handleFiles(fileList) {
    const accept = this.getAttribute('accept') || '';
    const maxSize = this.getAttribute('max-size');
    const maxFiles = this.getAttribute('max-files');
    const multiple = this.hasAttribute('multiple');

    let incoming = Array.from(fileList || []);
    if (!multiple) incoming = incoming.slice(0, 1);

    const maxSizeNum = maxSize ? parseInt(maxSize, 10) : null;
    const maxFilesNum = maxFiles ? parseInt(maxFiles, 10) : null;
    const room = maxFilesNum != null
      ? Math.max(0, maxFilesNum - this._files.length)
      : Infinity;

    const accepted = [];
    const rejected = [];

    incoming.forEach((file) => {
      if (!this._matchesAccept(file, accept)) {
        rejected.push({ name: file.name, reason: 'Type not allowed' });
        return;
      }
      if (maxSizeNum != null && file.size > maxSizeNum) {
        rejected.push({
          name: file.name,
          reason: `Exceeds maximum size (${this._formatSize(maxSizeNum)})`,
        });
        return;
      }
      if (accepted.length >= room) {
        rejected.push({ name: file.name, reason: 'File limit reached' });
        return;
      }
      accepted.push(file);
    });

    // In single mode, replace any existing file.
    if (!multiple && accepted.length > 0) {
      this._files.forEach((rec) => this._removeFileItemNode(rec.id));
      this._files = [];
    }

    accepted.forEach((file) => {
      const rec = {
        id: `f-${++fileIdCounter}`,
        file,
        status: 'idle',
        error: '',
        progress: 0,
      };
      this._files.push(rec);
      this._appendFileItem(rec);
    });

    if (rejected.length > 0) {
      this.dispatchEvent(new CustomEvent('hbd:rejected', {
        detail: { rejected },
        bubbles: true,
        composed: true,
      }));
    }

    if (accepted.length > 0) {
      this.dispatchEvent(new CustomEvent('hbd:files-added', {
        detail: { files: accepted },
        bubbles: true,
        composed: true,
      }));
    }
  }

  _removeFile(fileId) {
    const idx = this._files.findIndex((r) => r.id === fileId);
    if (idx === -1) return;
    const rec = this._files[idx];
    this._files.splice(idx, 1);
    this._removeFileItemNode(fileId);
    this.dispatchEvent(new CustomEvent('hbd:file-removed', {
      detail: { name: rec.file.name, id: fileId },
      bubbles: true,
      composed: true,
    }));
  }

  _removeFileItemNode(fileId) {
    const list = this.shadowRoot.querySelector('.hbd-file-upload__file-list');
    if (!list) return;
    const node = list.querySelector(`[data-file-id="${fileId}"]`);
    if (node) node.remove();
  }

  // ── Per-file rendering ──────────────────────────────────────────────
  _appendFileItem(rec) {
    const list = this.shadowRoot.querySelector('.hbd-file-upload__file-list');
    if (!list) return;
    const li = document.createElement('li');
    li.className = 'hbd-file-upload__file-item';
    li.setAttribute('data-file-id', rec.id);
    li.innerHTML = `
      <div class="hbd-file-upload__file-preview" aria-hidden="true">
        ${this._iconFile()}
      </div>
      <div class="hbd-file-upload__file-info">
        <span class="hbd-file-upload__file-name" title="${this._esc(rec.file.name)}">${this._esc(rec.file.name)}</span>
        <span class="hbd-file-upload__file-size">${this._esc(this._formatSize(rec.file.size))}</span>
        <div class="hbd-file-upload__file-progress" role="progressbar"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
             aria-label="Upload progress for ${this._esc(rec.file.name)}">
          <div class="hbd-file-upload__file-bar"></div>
        </div>
      </div>
      <span class="hbd-file-upload__file-status" aria-hidden="true"></span>
      <button type="button" class="hbd-file-upload__file-remove"
              data-file-id="${rec.id}"
              aria-label="Remove ${this._esc(rec.file.name)}">
        ${this._iconClose()}
      </button>
    `;
    list.appendChild(li);

    // Image preview via FileReader when applicable.
    if (rec.file.type && rec.file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = li.querySelector('.hbd-file-upload__file-preview');
        if (!preview) return;
        preview.innerHTML = `<img src="${e.target.result}" alt="">`;
      };
      reader.readAsDataURL(rec.file);
    }

    this._syncFileItem(rec);
  }

  _syncFileItem(rec) {
    const list = this.shadowRoot.querySelector('.hbd-file-upload__file-list');
    if (!list) return;
    const li = list.querySelector(`[data-file-id="${rec.id}"]`);
    if (!li) return;

    li.classList.toggle('is-uploading', rec.status === 'uploading');
    li.classList.toggle('is-complete', rec.status === 'complete');
    li.classList.toggle('is-error', rec.status === 'error');

    const bar = li.querySelector('.hbd-file-upload__file-bar');
    const progress = li.querySelector('.hbd-file-upload__file-progress');
    if (bar) bar.style.width = `${rec.progress}%`;
    if (progress) progress.setAttribute('aria-valuenow', String(Math.round(rec.progress)));

    // Per-file error message — appended once after the size line.
    let errEl = li.querySelector('.hbd-file-upload__file-error');
    if (rec.status === 'error' && rec.error) {
      if (!errEl) {
        errEl = document.createElement('span');
        errEl.className = 'hbd-file-upload__file-error';
        const info = li.querySelector('.hbd-file-upload__file-info');
        const sizeEl = li.querySelector('.hbd-file-upload__file-size');
        if (info && sizeEl) info.insertBefore(errEl, sizeEl.nextSibling);
        else if (info) info.appendChild(errEl);
      }
      errEl.textContent = rec.error;
    } else if (errEl) {
      errEl.remove();
    }

    const status = li.querySelector('.hbd-file-upload__file-status');
    if (status) {
      if (rec.status === 'complete') status.innerHTML = this._iconCheck();
      else if (rec.status === 'error') status.innerHTML = this._iconAlert();
      else status.innerHTML = '';
    }
  }

  // ── Inline SVG icons (decorative — buttons carry the aria-label) ────
  _iconUpload() {
    return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 6v16M9 13l7-7 7 7M6 26h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  _iconFile() {
    return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M7 3h9l5 5v17H7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M16 3v5h5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    </svg>`;
  }
  _iconCheck() {
    return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 9.5l3.2 3L14 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  _iconAlert() {
    return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2l8 14H1L9 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M9 7v4M9 13v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  }
  _iconClose() {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;
  }
}

if (!customElements.get('hbd-file-upload')) {
  customElements.define('hbd-file-upload', HbdFileUpload);
}
