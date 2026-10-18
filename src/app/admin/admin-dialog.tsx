"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

/**
 * Native modal `<dialog>` opened with `showModal()`: renders in the top layer
 * (never clipped by table/overflow containers), traps focus and closes on Esc.
 * Children mount only while open, so form state resets on every opening.
 */
export function AdminDialog({
  open,
  onClose,
  labelledBy,
  ariaLabel,
  className = "max-w-md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Light dismiss (backdrop click) where supported; fallback in handleClick.
    dialog.setAttribute("closedby", "any");
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = ref.current;
    if (!dialog || event.target !== dialog) return;
    if ("closedBy" in HTMLDialogElement.prototype) return;
    const rect = dialog.getBoundingClientRect();
    const isDialogContent =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isDialogContent) dialog.close();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      onClose={onClose}
      onClick={handleClick}
      className={`m-auto max-h-[92vh] w-[calc(100%-1.5rem)] overflow-hidden rounded-3xl bg-white p-0 text-tinta shadow-2xl ring-1 ring-crema backdrop:bg-tinta/60 backdrop:backdrop-blur-xs ${className}`}
    >
      {open && children}
    </dialog>
  );
}
