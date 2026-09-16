"use client";

import * as React from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/new-york/field/field";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadItemStatus,
  FileUploadList,
} from "@/registry/new-york/file-upload/file-upload";

const width = "w-full max-w-md";

export function FileUploadDemo() {
  const [files, setFiles] = React.useState<File[]>([]);

  return (
    <FileUpload
      className={width}
      value={files}
      onValueChange={setFiles}
      accept="image/*,.pdf"
      multiple
      maxSize={5 * 1024 * 1024}
      maxFiles={4}
    >
      <FileUploadDropzone aria-label="Upload artefacts" />
      <FileUploadList>
        {files.map((file) => (
          <FileUploadItem key={file.name} file={file}>
            <FileUploadItemPreview />
            <FileUploadItemMetadata />
            <FileUploadItemStatus />
            <FileUploadItemDelete />
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
}

export function FileUploadProgressDemo() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [progress, setProgress] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (files.length === 0) return;
    const timer = setInterval(() => {
      setProgress((current) => {
        const next = { ...current };
        let moved = false;
        for (const file of files) {
          const value = next[file.name] ?? 0;
          if (value < 100) {
            next[file.name] = Math.min(100, value + 20);
            moved = true;
          }
        }
        return moved ? next : current;
      });
    }, 400);
    return () => clearInterval(timer);
  }, [files]);

  return (
    <FileUpload className={width} value={files} onValueChange={setFiles} multiple>
      <FileUploadDropzone aria-label="Upload with progress" />
      <FileUploadList>
        {files.map((file) => {
          const value = progress[file.name] ?? 0;
          return (
            <FileUploadItem
              key={file.name}
              file={file}
              progress={value}
              status={value >= 100 ? "complete" : "uploading"}
            >
              <FileUploadItemPreview />
              <FileUploadItemMetadata>
                <FileUploadItemProgress />
              </FileUploadItemMetadata>
              <FileUploadItemStatus />
              <FileUploadItemDelete />
            </FileUploadItem>
          );
        })}
      </FileUploadList>
    </FileUpload>
  );
}

export function FileUploadFieldDemo() {
  return (
    <Field className={width}>
      <FieldLabel htmlFor="evidence">Attach evidence</FieldLabel>
      <FileUpload name="evidence">
        <FileUploadDropzone id="evidence" />
        <FileUploadList />
      </FileUpload>
      <FieldDescription>Optional. One file at a time.</FieldDescription>
    </Field>
  );
}

export function FileUploadInvalidDemo() {
  return (
    <Field className={width} data-invalid="true">
      <FieldLabel htmlFor="map">Upload map</FieldLabel>
      <FileUpload name="map">
        <FileUploadDropzone id="map" aria-invalid />
        <FileUploadList />
      </FileUpload>
      <FieldError>A file is required before continuing.</FieldError>
    </Field>
  );
}

export function FileUploadDisabledDemo() {
  return (
    <Field className={width} data-disabled="true">
      <FieldLabel htmlFor="locked">Upload locked</FieldLabel>
      <FileUpload name="locked" disabled>
        <FileUploadDropzone id="locked" />
        <FileUploadList />
      </FileUpload>
      <FieldDescription>Sign in to upload.</FieldDescription>
    </Field>
  );
}

export function FileUploadRejectionDemo() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [rejected, setRejected] = React.useState<{ name: string; reason: string }[]>([]);

  return (
    <div className={width}>
      <FileUpload
        value={files}
        onValueChange={(next) => {
          setFiles(next);
          setRejected([]);
        }}
        onFileReject={(file, reason) =>
          setRejected((current) => [...current, { name: file.name, reason }])
        }
        accept="image/*"
        maxSize={1024 * 1024}
      >
        <FileUploadDropzone aria-label="Images only" />
        <FileUploadList>
          {files.map((file) => (
            <FileUploadItem key={file.name} file={file}>
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemStatus />
              <FileUploadItemDelete />
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
      {rejected.length > 0 ? (
        <ul className="mt-2 flex list-none flex-col gap-1 p-0 font-sans text-[0.8125rem] text-foreground-emphasis">
          {rejected.map((entry) => (
            <li key={entry.name}>
              {entry.name}: {entry.reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
