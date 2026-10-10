"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
};

export function SubmitButton({ children, pendingText = "Guardando…", className = "btn-primary", name, value }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
