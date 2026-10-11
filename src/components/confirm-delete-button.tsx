"use client";

import { useActionState, useId, useState, type ReactNode } from "react";
import { AdminDialog } from "@/components/admin-dialog";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/types";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const initialState: FormState = { ok: true, message: "" };

export function ConfirmDeleteButton({
  action,
  fields,
  triggerLabel = "Eliminar",
  ariaLabel,
  title,
  description,
  confirmLabel = "Eliminar definitivamente",
  pendingLabel = "Eliminando…",
  blockedReason,
}: {
  action: Action;
  fields: Record<string, string>;
  triggerLabel?: string;
  ariaLabel?: string;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  /** When set, the dialog explains why deletion is not possible and hides the confirm button. */
  blockedReason?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={ariaLabel}
        className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-barro/30 bg-white px-3 py-1.5 text-xs font-semibold text-barro transition hover:bg-barro/10 active:scale-95"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        {triggerLabel}
      </button>

      <AdminDialog open={isOpen} onClose={() => setIsOpen(false)} labelledBy={titleId}>
        <ConfirmDeleteBody
          action={action}
          fields={fields}
          titleId={titleId}
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          pendingLabel={pendingLabel}
          blockedReason={blockedReason}
          onDone={() => setIsOpen(false)}
        />
      </AdminDialog>
    </>
  );
}

function ConfirmDeleteBody({
  action,
  fields,
  titleId,
  title,
  description,
  confirmLabel,
  pendingLabel,
  blockedReason,
  onDone,
}: {
  action: Action;
  fields: Record<string, string>;
  titleId: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  blockedReason?: string;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.ok) onDone();
    return result;
  }, initialState);

  return (
    <div className="space-y-4 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-barro-claro text-barro">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div>
        <h3 id={titleId} className="font-display text-lg font-bold text-tinta">
          {title}
        </h3>
        <div className="mt-1 text-xs leading-relaxed text-piedra">{description}</div>
      </div>

      {blockedReason && (
        <p className="rounded-xl bg-maiz-claro px-3 py-2 text-xs font-semibold text-[#7a5410]">{blockedReason}</p>
      )}

      {!state.ok && state.message && (
        <p aria-live="polite" className="rounded-xl bg-barro-claro px-3 py-2 text-xs font-semibold text-barro">
          {state.message}
        </p>
      )}

      <form action={formAction} className="flex items-center justify-end gap-2 pt-2">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button type="button" onClick={onDone} className="btn-ghost min-h-10 px-3 py-2 text-xs">
          {blockedReason ? "Entendido" : "Cancelar"}
        </button>
        {!blockedReason && (
          <SubmitButton
            pendingText={pendingLabel}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-barro px-4 py-2 text-xs font-semibold text-white transition hover:bg-barro/90 disabled:opacity-60"
          >
            {confirmLabel}
          </SubmitButton>
        )}
      </form>
    </div>
  );
}
