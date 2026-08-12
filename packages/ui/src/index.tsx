import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function Button({ className, asChild = false, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:pointer-events-none disabled:opacity-50", { "bg-brand-500 text-white shadow-sm hover:bg-brand-600": variant === "primary", "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800": variant === "secondary", "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800": variant === "ghost", "bg-rose-600 text-white hover:bg-rose-700": variant === "danger" }, className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900", className)} {...props} />; }
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-brand-400 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", className)} {...props} />; }
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn("min-h-32 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none ring-brand-400 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", className)} {...props} />; }
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) { return <label className={cn("mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", className)} {...props} />; }
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn("min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950", className)} {...props} />; }
export function Badge({ children, className }: { children: React.ReactNode; className?: string }) { return <span className={cn("inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-200", className)}>{children}</span>; }
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return <Button type="button" variant="secondary" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}>{copied ? "✓ Copied" : label}</Button>;
}
