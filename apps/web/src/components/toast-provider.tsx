"use client";

import * as React from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import {
  Toast,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
} from "@sfrankey/ui";

export type ToastVariant = "default" | "success" | "warning" | "destructive";

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  toast: (message: Omit<ToastMessage, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue>({
  toast: () => undefined,
});

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback(
    ({
      title,
      description,
      variant = "default",
      duration = 2200,
    }: Omit<ToastMessage, "id">) => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      setToasts((current) => {
        const filtered = current.filter((t) => t.title !== title);
        return [...filtered.slice(-1), { id, title, description, variant, duration }];
      });
    },
    [],
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToastProvider swipeDirection="right">
        {children}
        {toasts.map((item) => {
          const isSuccess = item.variant === "success";
          const isDestructive = item.variant === "destructive";
          const isWarning = item.variant === "warning";
          return (
            <Toast
              key={item.id}
              duration={item.duration}
              onClick={() => removeToast(item.id)}
              onOpenChange={(open) => {
                if (!open) removeToast(item.id);
              }}
              className="cursor-pointer select-none transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              <div className="flex flex-1 min-w-0 items-center gap-3">
                {isSuccess ? (
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <Check size={16} className="stroke-[2.8]" />
                  </span>
                ) : isDestructive ? (
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/25 dark:bg-rose-400/15 dark:text-rose-300">
                    <AlertTriangle size={16} className="stroke-[2.5]" />
                  </span>
                ) : isWarning ? (
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/25 dark:bg-amber-400/15 dark:text-amber-300">
                    <AlertTriangle size={16} className="stroke-[2.5]" />
                  </span>
                ) : (
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-700 ring-1 ring-brand-500/25 dark:bg-brand-400/15 dark:text-brand-300">
                    <Info size={16} className="stroke-[2.5]" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <ToastTitle className="text-sm font-black tracking-tight text-brand-950 dark:text-brand-50 truncate">
                    {item.title}
                  </ToastTitle>
                  {item.description ? (
                    <ToastDescription className="text-xs font-medium leading-relaxed text-brand-900/75 dark:text-brand-100/75 truncate mt-0.5">
                      {item.description}
                    </ToastDescription>
                  ) : null}
                </div>
              </div>
            </Toast>
          );
        })}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}
