"use client";

import { useActionState, useId, useState } from "react";
import { updateTenantAction } from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { AdminTenant, FormState } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function EditTenantModal({ tenant }: { tenant: AdminTenant }) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Editar inquilino ${tenant.name}`}
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-crema bg-white px-3 py-1.5 text-xs font-semibold text-azul transition hover:bg-crema/40 active:scale-95"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        Editar
      </button>

      <AdminDialog open={isOpen} onClose={() => setIsOpen(false)} labelledBy={titleId} className="max-w-lg">
        <EditTenantForm tenant={tenant} titleId={titleId} onDone={() => setIsOpen(false)} />
      </AdminDialog>
    </>
  );
}

function EditTenantForm({
  tenant,
  titleId,
  onDone,
}: {
  tenant: AdminTenant;
  titleId: string;
  onDone: () => void;
}) {
  const { notify } = useAdminToast();
  const fieldId = useId();
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await updateTenantAction(prev, formData);
    if (result.message) {
      notify(result.message, result.ok ? "success" : "error");
    }
    if (result.ok) onDone();
    return result;
  }, initialState);

  return (
    <div className="flex max-h-[92vh] flex-col">
      <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
        <div>
          <h3 id={titleId} className="font-display text-lg font-bold text-azul sm:text-xl">
            Editar Inquilino
          </h3>
          <p className="text-xs text-piedra">Actualice los datos de contacto y acceso al portal.</p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-piedra transition hover:bg-arena hover:text-tinta"
          aria-label="Cerrar ventana"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <form action={formAction} className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
        <input type="hidden" name="tenant_id" value={tenant.id} />

        <div>
          <label htmlFor={`${fieldId}-name`} className="label">
            Nombre completo o razón comercial
          </label>
          <input
            id={`${fieldId}-name`}
            name="name"
            type="text"
            required
            defaultValue={tenant.name}
            autoComplete="off"
            className="field min-h-11 text-sm"
          />
        </div>

        <div>
          <label htmlFor={`${fieldId}-contact`} className="label">
            Teléfono / WhatsApp de contacto
          </label>
          <input
            id={`${fieldId}-contact`}
            name="contact_info"
            type="tel"
            defaultValue={tenant.contact_info}
            autoComplete="off"
            className="field min-h-11 text-sm"
            placeholder="Ej. +504 9876-5432"
          />
        </div>

        <div>
          <label htmlFor={`${fieldId}-email`} className="label">
            Correo electrónico (inicio de sesión en portal)
          </label>
          <input
            id={`${fieldId}-email`}
            name="email"
            type="email"
            required
            defaultValue={tenant.email ?? ""}
            autoComplete="off"
            className="field min-h-11 text-sm"
          />
        </div>

        <div>
          <label htmlFor={`${fieldId}-password`} className="label">
            Nueva contraseña (opcional)
          </label>
          <input
            id={`${fieldId}-password`}
            name="password"
            type="text"
            minLength={6}
            autoComplete="new-password"
            className="field min-h-11 text-sm"
            placeholder="Dejar vacío para conservar la actual"
          />
        </div>

        <FormMessage state={state} />

        <footer className="flex flex-col-reverse gap-2 border-t border-crema pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onDone} className="btn-ghost min-h-11 px-4 py-2 text-sm">
            Cancelar
          </button>
          <SubmitButton pendingText="Guardando…" className="btn-primary min-h-11 px-5 py-2 text-sm">
            Guardar cambios
          </SubmitButton>
        </footer>
      </form>
    </div>
  );
}
