"use client";

import * as React from "react";
import { cn, FileCheck, HardDrive, ArrowDown } from "@sfrankey/ui";

export type FileErrorCode = "type" | "size";
export type FileDropzoneProps = {
  id: string;
  accept: string[];
  maxBytes: number;
  file?: File | null;
  disabled?: boolean;
  labels: { idle: string; active: string; browse: string; remove: string };
  onFile: (file: File) => void;
  onRejected: (code: FileErrorCode) => void;
  onClear?: () => void;
};

function isAccepted(file: File, accept: string[]) {
  return accept.some(
    (item) =>
      item === "*/*" ||
      item === file.type ||
      (item.endsWith("/*") && file.type.startsWith(item.slice(0, -1))) ||
      (item.startsWith(".") &&
        file.name.toLowerCase().endsWith(item.toLowerCase())),
  );
}

export function FileDropzone({
  id,
  accept,
  maxBytes,
  file,
  disabled,
  labels,
  onFile,
  onRejected,
  onClear,
}: FileDropzoneProps) {
  const [active, setActive] = React.useState(false);
  const choose = React.useCallback(
    (candidate: File | undefined) => {
      if (disabled || !candidate) return;
      if (!isAccepted(candidate, accept)) {
        onRejected("type");
        return;
      }
      if (candidate.size > maxBytes) {
        onRejected("size");
        return;
      }
      onFile(candidate);
    },
    [accept, disabled, maxBytes, onFile, onRejected],
  );

  return (
    <div
      className={cn(
        "relative grid min-h-36 place-items-center rounded-[var(--radius-lg)] border-2 border-dashed border-brand-300/80 bg-brand-50/50 p-6 text-center transition-all duration-200 hover:border-brand-400 hover:bg-brand-50 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-400/60 focus-within:ring-offset-2 focus-within:ring-offset-[var(--surface-page)] dark:border-brand-700/80 dark:bg-brand-950/30 dark:hover:bg-brand-950/50",
        active &&
          "scale-[1.01] border-brand-500 bg-brand-100/90 shadow-glow ring-4 ring-brand-400/30 dark:bg-brand-900/90",
        disabled && "pointer-events-none opacity-55",
      )}
      aria-disabled={disabled || undefined}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setActive(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        choose(event.dataTransfer.files[0]);
      }}
    >
      <input
        id={id}
        className="sr-only"
        type="file"
        accept={accept.join(",")}
        disabled={disabled}
        onChange={(event) => {
          choose(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      {file ? (
        <div className="grid place-items-center gap-2.5 text-sm animate-fade-in">
          <span className="grid size-11 place-items-center rounded-2xl bg-brand-500/15 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300">
            <FileCheck size={22} />
          </span>
          <div className="max-w-xs sm:max-w-md">
            <strong className="block truncate font-semibold text-brand-950 dark:text-brand-50" title={file.name}>
              {file.name}
            </strong>
            <span className="mt-0.5 block text-xs text-brand-800/65 dark:text-brand-200/65">
              {(file.size / 1024 / 1024).toFixed(2)} MiB · {file.type || "file"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <label
              htmlFor={id}
              className="inline-flex min-h-10 cursor-pointer items-center rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {labels.browse}
            </label>
            {onClear ? (
              <button
                type="button"
                className="inline-flex min-h-10 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100/60 dark:text-brand-200 dark:hover:bg-brand-900/60"
                onClick={onClear}
              >
                {labels.remove}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <label htmlFor={id} className="grid cursor-pointer place-items-center gap-2 text-sm">
          <span className={cn("grid size-12 place-items-center rounded-2xl bg-brand-200/60 text-brand-700 transition-transform duration-200 dark:bg-brand-900/60 dark:text-brand-300", active && "scale-110")}>
            <ArrowDown size={20} className={cn("transition-transform duration-200", active && "translate-y-0.5")} />
          </span>
          <span className="font-semibold text-brand-950 dark:text-brand-50">
            {active ? labels.active : labels.idle}
          </span>
          <span className="text-xs text-brand-800/65 dark:text-brand-200/65">
            {labels.browse}
          </span>
        </label>
      )}
    </div>
  );
}
