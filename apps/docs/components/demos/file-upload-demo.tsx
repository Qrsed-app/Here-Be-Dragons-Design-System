"use client";

import * as React from "react";
import {
  FileUpload,
  type FileRecord,
  type RejectedFile,
} from "@/registry/new-york/file-upload/file-upload";

/**
 * Basic interactive dropzone — click to browse or drag-and-drop. Accepts
 * multiple files and surfaces the count below the field.
 */
export function FileUploadBasicDemo() {
  const [count, setCount] = React.useState(0);

  return (
    <FileUpload
      label="Upload artefacts"
      hint={count > 0 ? `${count} file(s) selected` : "PNG, JPG or PDF up to 5 MB"}
      accept="image/*,.pdf"
      multiple
      maxSize={5 * 1024 * 1024}
      maxFiles={4}
      onChange={({ files }) => setCount((n) => n + files.length)}
      onRemove={() => setCount((n) => Math.max(0, n - 1))}
      style={{ width: "100%", maxWidth: "28rem" }}
    />
  );
}

/**
 * Controlled file list with a simulated upload. Each newly idle record is
 * stepped to 100% via the `files` / `onFilesChange` API, then marked complete.
 */
export function FileUploadProgressDemo() {
  const [records, setRecords] = React.useState<FileRecord[]>([]);
  const recordsRef = React.useRef(records);
  recordsRef.current = records;

  React.useEffect(() => {
    const uploading = records.filter((r) => r.status === "uploading");
    if (uploading.length === 0) return;

    const timer = setInterval(() => {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.status !== "uploading") return r;
          const next = Math.min(100, r.progress + 20);
          return {
            ...r,
            progress: next,
            status: next >= 100 ? "complete" : "uploading",
          };
        }),
      );
    }, 350);

    return () => clearInterval(timer);
  }, [records]);

  const startUpload = (next: FileRecord[]) => {
    // Kick any freshly-added (idle) records into the uploading state.
    setRecords(next.map((r) => (r.status === "idle" ? { ...r, status: "uploading" } : r)));
  };

  return (
    <FileUpload
      label="Upload with progress"
      hint="Pick a file to watch a simulated upload."
      multiple
      files={records}
      onFilesChange={startUpload}
      style={{ width: "100%", maxWidth: "28rem" }}
    />
  );
}

/**
 * Restricted dropzone — rejects anything that is not an image and reports the
 * reason for each rejected file.
 */
export function FileUploadRejectionDemo() {
  const [rejected, setRejected] = React.useState<RejectedFile[]>([]);

  return (
    <div style={{ width: "100%", maxWidth: "28rem" }}>
      <FileUpload
        label="Images only"
        hint="Only image files under 1 MB are accepted."
        accept="image/*"
        maxSize={1024 * 1024}
        onRejected={({ rejected: r }) => setRejected(r)}
        onChange={() => setRejected([])}
      />
      {rejected.length > 0 ? (
        <ul className="hbd-field__error" style={{ marginTop: "0.5rem" }}>
          {rejected.map((r) => (
            <li key={r.name}>
              {r.name}: {r.reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
