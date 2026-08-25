"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, CheckCircle2, Info, Loader2, ShieldAlert, Sparkles, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ConfirmDialogTone = "warning" | "danger" | "info" | "success" | "brand";

export type ConfirmDialogLayout = "centered" | "side";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  note?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  tone?: ConfirmDialogTone;
  layout?: ConfirmDialogLayout;
  icon?: React.ReactNode;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
};

const toneStyles: Record<
  ConfirmDialogTone,
  {
    iconWrapper: string;
    defaultIcon: React.ReactNode;
    confirmClass: string;
  }
> = {
  warning: {
    iconWrapper:
      "bg-gradient-to-br from-emerald-100 to-brand-100 ring-1 ring-emerald-500/30 text-emerald-800 shadow-[0_0_24px_rgba(16,185,129,0.22)] dark:from-emerald-950/80 dark:to-brand-950/80 dark:text-emerald-300 dark:ring-emerald-500/30",
    defaultIcon: <AlertTriangle size={26} className="text-emerald-700 dark:text-emerald-300 stroke-[2.2]" />,
    confirmClass:
      "bg-brand-500 hover:bg-brand-400 text-brand-950 font-black shadow-md shadow-brand-500/25 border-0 hover:shadow-raised"
  },
  brand: {
    iconWrapper:
      "bg-gradient-to-br from-emerald-100 to-brand-100 ring-1 ring-emerald-500/30 text-emerald-800 shadow-[0_0_24px_rgba(16,185,129,0.22)] dark:from-emerald-950/80 dark:to-brand-950/80 dark:text-emerald-300 dark:ring-emerald-500/30",
    defaultIcon: <Sparkles size={26} className="text-emerald-700 dark:text-emerald-300 stroke-[2.2]" />,
    confirmClass:
      "bg-brand-500 hover:bg-brand-400 text-brand-950 font-black shadow-md shadow-brand-500/25 border-0 hover:shadow-raised"
  },
  danger: {
    iconWrapper:
      "bg-rose-500/15 ring-1 ring-rose-500/30 text-rose-700 shadow-[0_0_24px_rgba(244,63,94,0.2)] dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-400/30",
    defaultIcon: <ShieldAlert size={26} className="text-rose-600 dark:text-rose-400 stroke-[2.2]" />,
    confirmClass:
      "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/25 border-0"
  },
  info: {
    iconWrapper:
      "bg-sky-500/15 ring-1 ring-sky-500/30 text-sky-700 shadow-[0_0_24px_rgba(14,165,233,0.2)] dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-400/30",
    defaultIcon: <Info size={26} className="text-sky-600 dark:text-sky-400 stroke-[2.2]" />,
    confirmClass:
      "bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/25 border-0"
  },
  success: {
    iconWrapper:
      "bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-700 shadow-[0_0_24px_rgba(16,185,129,0.2)] dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-400/30",
    defaultIcon: <CheckCircle2 size={26} className="text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />,
    confirmClass:
      "bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/25 border-0"
  }
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  note,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  closeLabel = "Close",
  tone = "warning",
  layout = "centered",
  icon,
  loading = false,
  onConfirm,
  onCancel,
  className
}: ConfirmDialogProps) {
  const toneStyle = toneStyles[tone] ?? toneStyles.warning;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(val) => {
        if (!loading) onOpenChange(val);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-brand-950/65 backdrop-blur-md data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-emerald-500/25 bg-white/95 p-6 shadow-[0_24px_60px_rgba(26,105,71,0.18)] backdrop-blur-2xl outline-none data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in sm:p-7 dark:border-emerald-500/20 dark:bg-[#07241a]/95 dark:shadow-[0_30px_70px_rgba(0,0,0,0.65)]",
            className
          )}
        >
          {/* Subtle Ambient Brand Glow */}
          <div className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-500/10" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 size-40 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />

          {/* Close X Button */}
          <DialogPrimitive.Close
            disabled={loading}
            className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full text-brand-700/60 transition hover:bg-brand-100/80 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-brand-300/60 dark:hover:bg-brand-900/60 dark:hover:text-brand-50"
          >
            <X size={16} />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>

          {layout === "centered" ? (
            /* Centered Modern Symmetrical Layout */
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Centered Top Icon Badge */}
              <div
                className={cn(
                  "mb-4 grid size-14 place-items-center rounded-2xl transition-transform duration-200 hover:scale-105",
                  toneStyle.iconWrapper
                )}
              >
                {icon ?? toneStyle.defaultIcon}
              </div>

              {/* Title */}
              <DialogPrimitive.Title className="text-xl font-black tracking-tight text-brand-950 sm:text-2xl dark:text-brand-50">
                {title}
              </DialogPrimitive.Title>

              {/* Description */}
              <DialogPrimitive.Description className="mt-2 text-sm font-medium leading-relaxed text-brand-950/80 dark:text-brand-100/80">
                {description}
              </DialogPrimitive.Description>

              {/* Security Note Callout */}
              {note ? (
                <div className="mt-4 w-full rounded-2xl border border-emerald-500/20 bg-emerald-50/75 p-3.5 text-xs font-medium leading-relaxed text-emerald-950 shadow-2xs dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-100">
                  {note}
                </div>
              ) : null}

              {/* Symmetrical 2-Column Action Buttons */}
              <div className="mt-6 grid w-full grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onCancel?.();
                    onOpenChange(false);
                  }}
                  disabled={loading}
                  className="flex min-h-11 items-center justify-center rounded-xl border border-brand-200/80 bg-white/90 px-4 text-sm font-bold text-brand-950 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-white active:translate-y-0 disabled:opacity-50 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-100 dark:hover:bg-brand-900/80"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onConfirm();
                    onOpenChange(false);
                  }}
                  disabled={loading}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50",
                    toneStyle.confirmClass
                  )}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>{confirmLabel}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Side-aligned / Header-aligned Layout */
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-2xl",
                    toneStyle.iconWrapper
                  )}
                >
                  {icon ?? toneStyle.defaultIcon}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <DialogPrimitive.Title className="text-lg font-black tracking-tight text-brand-950 dark:text-brand-50">
                    {title}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-1.5 text-sm font-medium leading-relaxed text-brand-950/80 dark:text-brand-100/80">
                    {description}
                  </DialogPrimitive.Description>
                </div>
              </div>

              {note ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/75 p-3.5 text-xs font-medium leading-relaxed text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-100">
                  {note}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onCancel?.();
                    onOpenChange(false);
                  }}
                  disabled={loading}
                  className="flex min-h-11 items-center justify-center rounded-xl border border-brand-200/80 bg-white/90 px-4 text-sm font-bold text-brand-950 shadow-xs transition hover:border-brand-400 hover:bg-white disabled:opacity-50 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-100"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onConfirm();
                    onOpenChange(false);
                  }}
                  disabled={loading}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm transition disabled:opacity-50",
                    toneStyle.confirmClass
                  )}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>{confirmLabel}</span>
                </button>
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const ConfirmModal = ConfirmDialog;
