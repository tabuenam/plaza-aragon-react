"use client";

import { useActionState, useState } from "react";
import { terminateLeaseAction } from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { useAdminToast } from "@/app/admin/admin-toast";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function TerminateLeaseButton({ leaseId, spaceName }: { leaseId: string; spaceName: string }) {
  const { notify } = useAdminToast();
  const [isOpen, setIsOpen] = useState(false);
  const titleId = `terminate-title-${leaseId}`;
  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await terminateLeaseAction(prev, formData);
      if (result.message) {
        notify(result.message, result.ok ? "success" : "error");
      }
      if (result.ok) {
        setIsOpen(false);
      }
      return result;
    },
    initialState
  );

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-barro/30 bg-white px-3 py-1.5 text-xs font-semibold text-barro transition hover:bg-barro/10 active:scale-95 cursor-pointer"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Terminar contrato
      </button>

      <AdminDialog open={isOpen} onClose={handleClose} labelledBy={titleId} className="max-w-md">
        <div className="p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-barro-claro text-barro font-bold text-xl">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div>
            <h3 id={titleId} className="font-display text-lg font-bold text-tinta">
              ¿Finalizar contrato de {spaceName}?
            </h3>
            <p className="mt-1 text-xs text-piedra leading-relaxed">
              Esta acción marcará el contrato como terminado y actualizará automáticamente la disponibilidad de {spaceName} a <strong className="text-selva">Disponible</strong>.
            </p>
          </div>

          {!state.ok && state.message && (
            <p className="rounded-xl bg-barro-claro px-3 py-2 text-xs font-semibold text-barro">
              {state.message}
            </p>
          )}

          <form action={formAction} className="flex items-center justify-end gap-2 pt-2">
            <input type="hidden" name="lease_id" value={leaseId} />
            <button
              type="button"
              onClick={handleClose}
              className="btn-ghost min-h-10 text-xs py-2 px-3"
            >
              Cancelar
            </button>
            <SubmitButton
              pendingText="Finalizando…"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-barro px-4 py-2 text-xs font-semibold text-white transition hover:bg-barro/90 cursor-pointer"
            >
              Confirmar terminación
            </SubmitButton>
          </form>
        </div>
      </AdminDialog>
    </>
  );
}
