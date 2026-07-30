"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "destructive";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((items) => [...items, { ...input, id }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[70] grid w-[calc(100%-2rem)] max-w-sm gap-3">
        {toasts.map((item) => {
          const Icon = item.variant === "success" ? CheckCircle2 : XCircle;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border bg-card p-4 text-sm shadow-card",
                item.variant === "success" && "border-success/20",
                item.variant === "destructive" && "border-destructive/20",
              )}
            >
              <div className="flex gap-3">
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    item.variant === "success" && "text-success",
                    item.variant === "destructive" && "text-destructive",
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 leading-6 text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
