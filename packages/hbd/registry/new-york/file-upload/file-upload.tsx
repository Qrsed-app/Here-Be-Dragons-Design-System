"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type FileStatus = "idle" | "uploading" | "complete" | "error";

type FileUploadContextValue = {
  files: File[];
  setFiles: (files: File[]) => void;
  openPicker: () => void;
  removeFile: (file: File) => void;
  accept?: string;
  multiple: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled: boolean;
  addFiles: (list: FileList | File[] | null) => void;
};

const FileUploadContext = React.createContext<FileUploadContextValue | null>(null);

function useFileUpload() {
  const context = React.useContext(FileUploadContext);
  if (!context) throw new Error("FileUpload parts must be used within <FileUpload>");
  return context;
}

type FileUploadItemContextValue = {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
};

const FileUploadItemContext = React.createContext<FileUploadItemContextValue | null>(null);

function useFileUploadItem() {
  const context = React.useContext(FileUploadItemContext);
  if (!context) throw new Error("FileUploadItem parts must be used within <FileUploadItem>");
  return context;
}

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

function matchesAccept(file: File, accept?: string) {
  const tokens = (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const extension = `.${(file.name.split(".").pop() ?? "").toLowerCase()}`;
  const type = (file.type || "").toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return extension === token;
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

function FileUpload({
  className,
  value,
  defaultValue,
  onValueChange,
  onFileReject,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled = false,
  name,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: File[];
  defaultValue?: File[];
  onValueChange?: (files: File[]) => void;
  /** Called for each file turned away by `accept`, `maxSize` or `maxFiles`. */
  onFileReject?: (file: File, reason: string) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  name?: string;
}) {
  const [uncontrolled, setUncontrolled] = React.useState<File[]>(defaultValue ?? []);
  const files = value ?? uncontrolled;
  const inputRef = React.useRef<HTMLInputElement>(null);

  const setFiles = React.useCallback(
    (next: File[]) => {
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    },
    [value, onValueChange],
  );

  const filesRef = React.useRef(files);
  filesRef.current = files;

  const addFiles = React.useCallback(
    (list: FileList | File[] | null) => {
      if (disabled) return;
      const incoming = Array.from(list ?? []).slice(0, multiple ? undefined : 1);
      const current = multiple ? filesRef.current : [];
      const room = maxFiles === undefined ? Infinity : Math.max(0, maxFiles - current.length);
      const accepted: File[] = [];

      for (const file of incoming) {
        if (!matchesAccept(file, accept)) {
          onFileReject?.(file, "Type not allowed");
          continue;
        }
        if (maxSize !== undefined && file.size > maxSize) {
          onFileReject?.(file, `Exceeds maximum size (${formatSize(maxSize)})`);
          continue;
        }
        if (accepted.length >= room) {
          onFileReject?.(file, "File limit reached");
          continue;
        }
        accepted.push(file);
      }

      if (accepted.length > 0) setFiles([...current, ...accepted]);
    },
    [accept, disabled, maxFiles, maxSize, multiple, onFileReject, setFiles],
  );

  const removeFile = React.useCallback(
    (file: File) => setFiles(filesRef.current.filter((entry) => entry !== file)),
    [setFiles],
  );

  const openPicker = React.useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  // A file dropped outside the dropzone would otherwise navigate the page to it.
  React.useEffect(() => {
    const prevent = (event: DragEvent) => event.preventDefault();
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
  }, []);

  const context = React.useMemo<FileUploadContextValue>(
    () => ({
      files,
      setFiles,
      openPicker,
      removeFile,
      addFiles,
      accept,
      multiple,
      maxSize,
      maxFiles,
      disabled,
    }),
    [
      files,
      setFiles,
      openPicker,
      removeFile,
      addFiles,
      accept,
      multiple,
      maxSize,
      maxFiles,
      disabled,
    ],
  );

  return (
    <FileUploadContext.Provider value={context}>
      <div
        data-slot="file-upload"
        data-disabled={disabled ? "true" : undefined}
        className={cn("flex w-full flex-col gap-2 font-sans", className)}
        {...props}
      >
        {children}
        <input
          ref={inputRef}
          type="file"
          data-slot="file-upload-input"
          className="sr-only pointer-events-none"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            addFiles(event.target.files);
            // Reset so picking the same file again still fires a change.
            event.target.value = "";
          }}
        />
      </div>
    </FileUploadContext.Provider>
  );
}

const UploadGlyph = () => (
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

function FileUploadDropzone({
  className,
  children,
  onClick,
  onKeyDown,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: React.ComponentProps<"div">) {
  const { openPicker, addFiles, disabled, accept, maxSize, maxFiles } = useFileUpload();
  const [dragOver, setDragOver] = React.useState(false);

  const constraints = [
    accept ? `Accepted: ${accept}` : "",
    maxSize !== undefined ? `Max ${formatSize(maxSize)} per file` : "",
    maxFiles !== undefined ? `Up to ${maxFiles} files` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      data-slot="file-upload-dropzone"
      data-drag-over={dragOver ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong bg-surface-subtle p-6 text-center transition-[border-color,background-color,box-shadow] duration-120 ease-out outline-none hover:border-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-error-border",
        "data-[drag-over=true]:border-solid data-[drag-over=true]:border-primary data-[drag-over=true]:bg-background data-[drag-over=true]:shadow-[0_0_0_4px_var(--gold-deep)]",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) openPicker();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragEnter={(event) => {
        onDragEnter?.(event);
        if (disabled) return;
        event.preventDefault();
        setDragOver(true);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (disabled) return;
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        // dragleave also fires when the pointer crosses into a child, so only drop the state
        // once it has actually left the box.
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX <= box.left ||
          event.clientX >= box.right ||
          event.clientY <= box.top ||
          event.clientY >= box.bottom
        ) {
          setDragOver(false);
        }
      }}
      onDrop={(event) => {
        onDrop?.(event);
        if (disabled) return;
        event.preventDefault();
        setDragOver(false);
        addFiles(event.dataTransfer?.files ?? null);
      }}
      {...props}
    >
      {children ?? (
        <>
          <span
            data-slot="file-upload-icon"
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          >
            <UploadGlyph />
          </span>
          <p className="m-0 font-sans text-[1.0625rem] leading-[1.7] text-foreground-secondary">
            Drag files here or{" "}
            <span className="cursor-pointer font-medium text-foreground-emphasis underline">
              browse
            </span>
          </p>
          {constraints ? (
            <p
              data-slot="file-upload-constraints"
              className="m-0 font-sans text-[0.6875rem] leading-[1.7] text-muted-foreground"
            >
              {constraints}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Opens the file picker from anywhere — wrap a Button with `asChild`-style composition. */
function FileUploadTrigger({ className, onClick, ...props }: React.ComponentProps<"button">) {
  const { openPicker, disabled } = useFileUpload();
  return (
    <button
      type="button"
      data-slot="file-upload-trigger"
      disabled={disabled}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) openPicker();
      }}
      {...props}
    />
  );
}

function FileUploadList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="file-upload-list"
      aria-label="Selected files"
      aria-live="polite"
      className={cn("m-0 mt-3 flex list-none flex-col gap-2 p-0", className)}
      {...props}
    />
  );
}

function FileUploadItem({
  className,
  file,
  status = "idle",
  progress = 0,
  error,
  children,
  ...props
}: React.ComponentProps<"li"> & {
  file: File;
  status?: FileStatus;
  progress?: number;
  error?: string;
}) {
  const context = React.useMemo(
    () => ({ file, status, progress, error }),
    [file, status, progress, error],
  );

  return (
    <FileUploadItemContext.Provider value={context}>
      <li
        data-slot="file-upload-item"
        data-status={status}
        className={cn(
          "flex items-center gap-3 rounded-md border border-border-subtle bg-background px-3 py-2",
          className,
        )}
        {...props}
      >
        {children}
      </li>
    </FileUploadItemContext.Provider>
  );
}

const FileGlyph = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M7 3h9l5 5v17H7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M16 3v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

function FileUploadItemPreview({ className, children, ...props }: React.ComponentProps<"div">) {
  const { file } = useFileUploadItem();
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file.type?.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      data-slot="file-upload-item-preview"
      aria-hidden="true"
      className={cn(
        "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-surface-subtle text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ??
        (preview ? <img src={preview} alt="" className="size-full object-cover" /> : <FileGlyph />)}
    </div>
  );
}

function FileUploadItemMetadata({ className, children, ...props }: React.ComponentProps<"div">) {
  const { file, status, error } = useFileUploadItem();

  return (
    <div
      data-slot="file-upload-item-metadata"
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    >
      <span
        title={file.name}
        className="truncate font-sans text-[1.0625rem] leading-[1.7] text-foreground"
      >
        {file.name}
      </span>
      <span className="font-sans text-[0.6875rem] leading-[1.7] text-muted-foreground">
        {formatSize(file.size)}
      </span>
      {status === "error" && error ? (
        <span className="font-sans text-[0.6875rem] leading-[1.7] text-foreground-emphasis">
          {error}
        </span>
      ) : null}
      {/* Anything else for the text column — the progress bar belongs here. */}
      {children}
    </div>
  );
}

/** The 4px upload bar. Its own element rather than Progress: this track and fill are the file
 * row's, and the fill grows by width so both of its ends stay rounded. */
function FileUploadItemProgress({ className, ...props }: React.ComponentProps<"div">) {
  const { file, status, progress } = useFileUploadItem();
  const percent = Math.min(Math.max(progress, 0), 100);

  return (
    <div
      data-slot="file-upload-item-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-label={`Upload progress for ${file.name}`}
      className={cn("h-1 overflow-hidden rounded-full bg-border-subtle", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-200 ease-out",
          status === "complete" && "bg-success-border",
          status === "error" && "bg-error-border",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

const CheckGlyph = () => (
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

const AlertGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M9 2l8 14H1L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 7v4M9 13v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function FileUploadItemStatus({ className, children, ...props }: React.ComponentProps<"span">) {
  const { status } = useFileUploadItem();

  return (
    <span
      data-slot="file-upload-item-status"
      aria-hidden="true"
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center text-muted-foreground",
        status === "complete" && "text-success-border",
        status === "error" && "text-error-border",
        className,
      )}
      {...props}
    >
      {children ??
        (status === "complete" ? <CheckGlyph /> : status === "error" ? <AlertGlyph /> : null)}
    </span>
  );
}

const CloseGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

function FileUploadItemDelete({
  className,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  const { removeFile } = useFileUpload();
  const { file } = useFileUploadItem();

  return (
    <button
      type="button"
      data-slot="file-upload-item-delete"
      aria-label={`Remove ${file.name}`}
      className={cn(
        "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm p-2 text-muted-foreground transition-[background-color,color] duration-120 ease-out outline-none hover:bg-surface-subtle hover:text-foreground-emphasis focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) removeFile(file);
      }}
      {...props}
    >
      {children ?? <CloseGlyph />}
    </button>
  );
}

export {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemProgress,
  FileUploadItemStatus,
  FileUploadItemDelete,
};
