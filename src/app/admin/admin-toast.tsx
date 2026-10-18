"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({
  notify: () => {},
});

export function useAdminToast() {
  return useContext(ToastContext);
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: ToastType = "success") => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4200);
    },
    [dismiss]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if ("popover" in HTMLElement.prototype) {
      try {
        if (toasts.length > 0 && !el.matches(":popover-open")) {
          el.showPopover();
        } else if (toasts.length === 0 && el.matches(":popover-open")) {
          el.hidePopover();
        }
      } catch {
        // Fallback relies on standard fixed positioning
      }
    }
  }, [toasts.length]);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        ref={containerRef}
        popover="manual"
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed top-auto right-4 bottom-4 left-4 z-50 m-0 flex flex-col items-end gap-2 bg-transparent p-0 sm:left-auto sm:max-w-sm"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ring-1 transition-all ${
                isSuccess
                  ? "border-selva/30 bg-white text-tinta ring-selva/15"
                  : "border-barro/30 bg-white text-tinta ring-barro/15"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isSuccess
                    ? "bg-selva-claro text-selva"
                    : "bg-barro-claro text-barro"
                }`}
              >
                {isSuccess ? "✓" : "!"}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-bold ${
                    isSuccess ? "text-selva" : "text-barro"
                  }`}
                >
                  {isSuccess ? "Cambios guardados" : "Atención"}
                </p>
                <p className="mt-0.5 text-xs text-tinta leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar notificación"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-piedra transition hover:bg-arena hover:text-tinta"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
