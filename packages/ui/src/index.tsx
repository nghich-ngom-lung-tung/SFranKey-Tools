import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function Button({ className, asChild = false, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:pointer-events-none disabled:opacity-50", { "bg-brand-600 text-white shadow-sm hover:bg-brand-700 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200": variant === "primary", "border border-brand-200/80 bg-white/75 text-brand-950 hover:bg-brand-50 dark:border-brand-800/80 dark:bg-brand-950/70 dark:text-brand-100 dark:hover:bg-brand-900": variant === "secondary", "text-brand-800 hover:bg-brand-100/80 dark:text-brand-200 dark:hover:bg-brand-900/70": variant === "ghost", "bg-rose-600 text-white hover:bg-rose-700": variant === "danger" }, className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("rounded-2xl border border-brand-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-md dark:border-brand-800/80 dark:bg-brand-950/65", className)} {...props} />; }
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("min-h-10 w-full rounded-xl border border-brand-200/80 bg-white/80 px-3 text-sm text-brand-950 outline-none ring-brand-400 placeholder:text-brand-700/45 focus:ring-2 dark:border-brand-800 dark:bg-brand-950/70 dark:text-brand-50", className)} {...props} />; }
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn("min-h-32 w-full rounded-xl border border-brand-200/80 bg-white/80 p-3 text-sm text-brand-950 outline-none ring-brand-400 placeholder:text-brand-700/45 focus:ring-2 dark:border-brand-800 dark:bg-brand-950/70 dark:text-brand-50", className)} {...props} />; }
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) { return <label className={cn("mb-2 block text-sm font-medium text-brand-950 dark:text-brand-100", className)} {...props} />; }
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn("min-h-10 rounded-xl border border-brand-200/80 bg-white/80 px-3 text-sm text-brand-950 dark:border-brand-800 dark:bg-brand-950/70 dark:text-brand-50", className)} {...props} />; }
export function Badge({ children, className }: { children: React.ReactNode; className?: string }) { return <span className={cn("inline-flex items-center rounded-full border border-brand-200/80 bg-brand-100/80 px-3 py-1 text-xs font-semibold text-brand-800 dark:border-brand-700 dark:bg-brand-900/70 dark:text-brand-100", className)}>{children}</span>; }
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return <Button type="button" variant="secondary" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}>{copied ? "✓ Copied" : label}</Button>;
}
