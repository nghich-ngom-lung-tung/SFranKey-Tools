"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
  X,
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
      duration = 3000,
    }: Omit<ToastMessage, "id">) => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      setToasts((current) => [
        ...current.slice(-4),
        { id, title, description, variant, duration },
      ]);
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
              onOpenChange={(open) => {
                if (!open) removeToast(item.id);
              }}
              className="group border border-[var(--border-strong)] bg-[var(--surface-dialog)] shadow-raised"
            >
              <div className="flex items-start gap-3">
                {isSuccess ? (
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                ) : isDestructive || isWarning ? (
                  <AlertTriangle
                    size={18}
                    className={`mt-0.5 shrink-0 ${
                      isDestructive ? "text-rose-500" : "text-amber-500"
                    }`}
                  />
                ) : null}
                <div className="grid gap-1">
                  <ToastTitle className="text-sm font-semibold">
                    {item.title}
                  </ToastTitle>
                  {item.description ? (
                    <ToastDescription className="text-xs text-[var(--ink-muted)]">
                      {item.description}
                    </ToastDescription>
                  ) : null}
                </div>
              </div>
              <ToastClose className="rounded-md p-1 opacity-70 transition hover:opacity-100">
                <X size={14} />
              </ToastClose>
            </Toast>
          );
        })}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}
