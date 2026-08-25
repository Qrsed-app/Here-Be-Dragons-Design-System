"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-file-upload.js + the de-shadowed
// styles/components/file-upload.css. The WC ran in Shadow DOM; this React
// port renders in light DOM and emits the exact same legacy BEM classes +
// .is-* state classes so file-upload.css (plus the shared .hbd-field chrome
// from input.css) reproduces the HBD look 1:1.
//
// Two interaction modes are preserved: click-to-browse (the dropzone is a
// role="button") and HTML5 drag-and-drop on the dropzone. Supports single +
// multiple files, MIME/extension restriction, max-size, max-files, per-file
// progress, image thumbnails via FileReader, and per-file / field error states.
//
// Controlled-first: pass `files` + `onFilesChange` to drive the list, or rely
// on the uncontrolled `defaultFiles` fallback. The WC's hbd:* CustomEvents map
// to on* callbacks carrying the event.detail shape:
//   hbd:files-added  -> onChange({ files })
//   hbd:file-removed -> onRemove({ name, id })
//   hbd:rejected     -> onRejected({ rejected })
//
// Per-file progress / error mutation (the WC's setProgress / setFileError /
// getFiles public methods) is exposed via the imperative ref handle below.

// ── useControllableState (inline, controlled-first with uncontrolled fallback)
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const state = isControlled ? (value as T) : uncontrolled;

  const setState = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [state, setState];
}

let fileIdCounter = 0;
let uidCounter = 0;

export type FileStatus = "idle" | "uploading" | "complete" | "error";

/** Internal per-file record (mirrors the WC's `_files` entries). */
export interface FileRecord {
  id: string;
  file: File;
  status: FileStatus;
  error: string;
  progress: number;
}

export interface RejectedFile {
  name: string;
  reason: string;
}

export interface FilesAddedDetail {
  files: File[];
}
export interface FileRemovedDetail {
  name: string;
  id: string;
}
export interface RejectedDetail {
  rejected: RejectedFile[];
}

/** Imperative handle — the WC's public getFiles / setProgress / setFileError. */
export interface FileUploadHandle {
  /** Returns the current File objects (not the internal records). */
  getFiles: () => File[];
  /** Update progress on a file by its id (0–100). */
  setProgress: (fileId: string, percent: number) => void;
  /** Mark a file as errored with a message. */
  setFileError: (fileId: string, message: string) => void;
}

export interface FileUploadProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Visible field label (also the dropzone's accessible name). */
  label?: string;
  /** Helper text shown below the dropzone. */
  hint?: string;
  /** Field-level error message — sets the error state + aria-invalid. */
  error?: string;
  /** Comma-separated MIME types / extensions, e.g. "image/*,.pdf". */
  accept?: string;
  /** Allow selecting multiple files. */
  multiple?: boolean;
  /** Maximum bytes per file. */
  maxSize?: number;
  /** Maximum number of files. */
  maxFiles?: number;
  /** Disables the dropzone + native input. */
  disabled?: boolean;
  /** Native input name (for downstream FormData wiring). */
  name?: string;

  /** Controlled file records. */
  files?: FileRecord[];
  /** Uncontrolled initial file records. */
  defaultFiles?: FileRecord[];
  /** Fires whenever the records change (controlled-state plumbing). */
  onFilesChange?: (files: FileRecord[]) => void;

  /** hbd:files-added — fired with the newly accepted File[]. */
  onChange?: (detail: FilesAddedDetail) => void;
  /** hbd:file-removed — fired when a file row is removed. */
  onRemove?: (detail: FileRemovedDetail) => void;
  /** hbd:rejected — fired with files rejected by accept/size/count. */
  onRejected?: (detail: RejectedDetail) => void;
}

// ── Helpers (ports of the WC's private formatters) ───────────────────────
function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

function matchesAccept(file: File, acceptStr: string): boolean {
  if (!acceptStr) return true;
  const tokens = acceptStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const name = file.name || "";
  const type = file.type || "";
  const ext = "." + (name.split(".").pop() || "").toLowerCase();
  return tokens.some((tok) => {
    const t = tok.toLowerCase();
    if (t.startsWith(".")) return ext === t;
    if (t.endsWith("/*")) return type.toLowerCase().startsWith(t.slice(0, -1));
    return type.toLowerCase() === t;
  });
}

// ── Inline SVG icons (decorative — controls carry the aria-label) ────────
const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path
      d="M16 6v16M9 13l7-7 7 7M6 26h20"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const FileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M7 3h9l5 5v17H7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M16 3v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M4 9.5l3.2 3L14 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M9 2l8 14H1L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 7v4M9 13v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// ── Per-file row ─────────────────────────────────────────────────────────
function FileItem({ record, onRemove }: { record: FileRecord; onRemove: (id: string) => void }) {
  const { file, status, error, progress } = record;
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file.type || !file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") setPreview(result);
    };
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);

  return (
    <li
      className={cn(
        "hbd-file-upload__file-item",
        status === "uploading" && "is-uploading",
        status === "complete" && "is-complete",
        status === "error" && "is-error",
      )}
      data-file-id={record.id}
    >
      <div className="hbd-file-upload__file-preview" aria-hidden="true">
        {preview ? <img src={preview} alt="" /> : <FileIcon />}
      </div>
      <div className="hbd-file-upload__file-info">
        <span className="hbd-file-upload__file-name" title={file.name}>
          {file.name}
        </span>
        <span className="hbd-file-upload__file-size">{formatSize(file.size)}</span>
        {status === "error" && error ? (
          <span className="hbd-file-upload__file-error">{error}</span>
        ) : null}
        <div
          className="hbd-file-upload__file-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={`Upload progress for ${file.name}`}
        >
          <div className="hbd-file-upload__file-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className="hbd-file-upload__file-status" aria-hidden="true">
        {status === "complete" ? <CheckIcon /> : status === "error" ? <AlertIcon /> : null}
      </span>
      <button
        type="button"
        className="hbd-file-upload__file-remove"
        data-file-id={record.id}
        aria-label={`Remove ${file.name}`}
        onClick={() => onRemove(record.id)}
      >
        <CloseIcon />
      </button>
    </li>
  );
}

const FileUpload = React.forwardRef<FileUploadHandle, FileUploadProps>(
  (
    {
      className,
      label = "",
      hint,
      error,
      accept = "",
      multiple = false,
      maxSize,
      maxFiles,
      disabled = false,
      name,
      files: filesProp,
      defaultFiles,
      onFilesChange,
      onChange,
      onRemove,
      onRejected,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    const uid = React.useMemo(() => `hbd-file-upload-${++uidCounter}`, []);

    const [records, setRecords] = useControllableState<FileRecord[]>({
      value: filesProp,
      defaultValue: defaultFiles ?? [],
      onChange: onFilesChange,
    });

    const inputRef = React.useRef<HTMLInputElement>(null);
    const dropzoneRef = React.useRef<HTMLDivElement>(null);
    const [dragOver, setDragOver] = React.useState(false);

    // Keep a live ref so the imperative handle always sees the latest records.
    const recordsRef = React.useRef(records);
    recordsRef.current = records;

    const hasError = error != null && error !== "";
    const hasHint = hint != null && hint !== "";

    // Constraints summary line (port of _constraintsText).
    const constraints = React.useMemo(() => {
      const parts: string[] = [];
      if (accept) parts.push(`Accepted: ${accept}`);
      if (maxSize != null) parts.push(`Max ${formatSize(maxSize)} per file`);
      if (maxFiles != null) parts.push(`Up to ${maxFiles} files`);
      return parts.join(" · ");
    }, [accept, maxSize, maxFiles]);

    const describedBy = [
      constraints ? `constraints-${reactId}` : "",
      hasHint ? `hint-${reactId}` : "",
      hasError ? `error-${reactId}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const dropzoneAriaLabel = label || "Upload files";

    // ── Imperative API (getFiles / setProgress / setFileError) ───────────
    React.useImperativeHandle(
      ref,
      () => ({
        getFiles: () => recordsRef.current.map((r) => r.file),
        setProgress: (fileId, percent) => {
          const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
          setRecords(
            recordsRef.current.map((r) =>
              r.id === fileId
                ? {
                    ...r,
                    progress: clamped,
                    status: clamped >= 100 ? "complete" : r.status,
                  }
                : r,
            ),
          );
        },
        setFileError: (fileId, message) => {
          setRecords(
            recordsRef.current.map((r) =>
              r.id === fileId ? { ...r, status: "error", error: message || "Upload failed" } : r,
            ),
          );
        },
      }),
      [setRecords],
    );

    // ── File handling (port of _handleFiles) ─────────────────────────────
    const handleFiles = React.useCallback(
      (fileList: FileList | null) => {
        let incoming = Array.from(fileList || []);
        if (!multiple) incoming = incoming.slice(0, 1);

        const maxSizeNum = maxSize != null ? maxSize : null;
        const limit = maxFiles != null ? maxFiles : null;
        const current = recordsRef.current;
        const room = limit != null ? Math.max(0, limit - current.length) : Infinity;

        const accepted: File[] = [];
        const rejected: RejectedFile[] = [];

        incoming.forEach((file) => {
          if (!matchesAccept(file, accept)) {
            rejected.push({ name: file.name, reason: "Type not allowed" });
            return;
          }
          if (maxSizeNum != null && file.size > maxSizeNum) {
            rejected.push({
              name: file.name,
              reason: `Exceeds maximum size (${formatSize(maxSizeNum)})`,
            });
            return;
          }
          if (accepted.length >= room) {
            rejected.push({ name: file.name, reason: "File limit reached" });
            return;
          }
          accepted.push(file);
        });

        // In single mode, replace any existing file.
        const base = !multiple && accepted.length > 0 ? [] : current;
        const newRecords: FileRecord[] = accepted.map((file) => ({
          id: `f-${++fileIdCounter}`,
          file,
          status: "idle",
          error: "",
          progress: 0,
        }));

        if (newRecords.length > 0) {
          setRecords([...base, ...newRecords]);
        }

        if (rejected.length > 0) {
          onRejected?.({ rejected });
        }
        if (accepted.length > 0) {
          onChange?.({ files: accepted });
        }
      },
      [accept, maxSize, maxFiles, multiple, onChange, onRejected, setRecords],
    );

    const removeFile = React.useCallback(
      (fileId: string) => {
        const current = recordsRef.current;
        const rec = current.find((r) => r.id === fileId);
        if (!rec) return;
        setRecords(current.filter((r) => r.id !== fileId));
        onRemove?.({ name: rec.file.name, id: fileId });
      },
      [onRemove, setRecords],
    );

    // ── Dropzone interactions ────────────────────────────────────────────
    const openPicker = () => {
      if (disabled) return;
      inputRef.current?.click();
    };

    const onDropzoneKeydown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPicker();
      }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset so re-selecting the same file fires change again.
      e.target.value = "";
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      setDragOver(true);
    };
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
    };
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      // dragleave fires when the cursor enters a child; only clear if the
      // cursor is actually leaving the dropzone box.
      const dz = e.currentTarget;
      const rect = dz.getBoundingClientRect();
      if (
        e.clientX <= rect.left ||
        e.clientX >= rect.right ||
        e.clientY <= rect.top ||
        e.clientY >= rect.bottom
      ) {
        setDragOver(false);
      }
    };
    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer && e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    };

    // Prevent the browser from navigating away when a file is dropped outside
    // our dropzone (port of the document-level dragover/drop guards).
    React.useEffect(() => {
      const prevent = (e: DragEvent) => e.preventDefault();
      document.addEventListener("dragover", prevent);
      document.addEventListener("drop", prevent);
      return () => {
        document.removeEventListener("dragover", prevent);
        document.removeEventListener("drop", prevent);
      };
    }, []);

    return (
      <div
        className={cn(
          "hbd-field",
          hasError && "hbd-field--error",
          disabled && "hbd-field--disabled",
          className,
        )}
        {...props}
      >
        {label ? (
          <label className="hbd-field__label" htmlFor={`file-input-${uid}`}>
            {label}
          </label>
        ) : null}

        <div
          className={cn(
            "hbd-file-upload",
            hasError && "hbd-file-upload--error",
            disabled && "hbd-file-upload--disabled",
            dragOver && "hbd-file-upload--drag-over",
          )}
        >
          <div
            ref={dropzoneRef}
            className="hbd-file-upload__dropzone"
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={dropzoneAriaLabel}
            aria-describedby={describedBy || undefined}
            aria-invalid={hasError || undefined}
            aria-disabled={disabled || undefined}
            onClick={openPicker}
            onKeyDown={onDropzoneKeydown}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <span className="hbd-file-upload__icon" aria-hidden="true">
              <UploadIcon />
            </span>

            <p className="hbd-file-upload__prompt">
              Drag files here or <span className="hbd-file-upload__browse">browse</span>
            </p>

            {constraints ? (
              <p className="hbd-file-upload__constraints" id={`constraints-${reactId}`}>
                {constraints}
              </p>
            ) : null}
          </div>

          <input
            ref={inputRef}
            className="hbd-file-upload__input hbd-sr-only"
            type="file"
            id={`file-input-${uid}`}
            name={name}
            multiple={multiple}
            accept={accept || undefined}
            disabled={disabled}
            aria-hidden="true"
            tabIndex={-1}
            onChange={onInputChange}
          />

          <ul
            className="hbd-file-upload__file-list"
            aria-label="Selected files"
            aria-live="polite"
            aria-relevant="additions removals"
          >
            {records.map((rec) => (
              <FileItem key={rec.id} record={rec} onRemove={removeFile} />
            ))}
          </ul>
        </div>

        <div className="hbd-field__footer">
          {hasHint ? (
            <span className="hbd-field__hint" id={`hint-${reactId}`}>
              {hint}
            </span>
          ) : null}
          {hasError ? (
            <span className="hbd-field__error" id={`error-${reactId}`} role="alert">
              {error}
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);
FileUpload.displayName = "FileUpload";

export { FileUpload };
