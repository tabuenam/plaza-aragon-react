"use client";

import { useActionState, useState } from "react";
import { createTenantAction } from "@/app/admin/actions";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function CreateTenantModal() {
  const { notify } = useAdminToast();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await createTenantAction(prev, formData);
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

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-crema bg-white px-4 py-2 text-xs font-semibold text-azul transition hover:bg-crema/40 active:scale-95"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Nuevo inquilino
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-tenant-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        >
          <div
            className="fixed inset-0 bg-tinta/60 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          />

          <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-crema">
            <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
              <div>
                <h3 id="create-tenant-title" className="font-display text-lg font-bold text-azul sm:text-xl">
                  Registrar Nuevo Inquilino
                </h3>
                <p className="text-xs text-piedra">Cree un usuario y ficha de contacto para un nuevo arrendatario.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-piedra transition hover:bg-arena hover:text-tinta"
                aria-label="Cerrar ventana"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <form action={formAction} className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-4">
              <div>
                <label htmlFor="tenant-name" className="label">
                  Nombre completo o razón comercial
                </label>
                <input
                  id="tenant-name"
                  name="name"
                  type="text"
                  required
                  className="field min-h-11 text-sm"
                  placeholder="Ej. Distribuidora El Valle / Juan Pérez"
                />
              </div>

              <div>
                <label htmlFor="tenant-contact" className="label">
                  Teléfono / WhatsApp de contacto
                </label>
                <input
                  id="tenant-contact"
                  name="contact_info"
                  type="text"
                  className="field min-h-11 text-sm"
                  placeholder="Ej. +504 9876-5432"
                />
              </div>

              <div>
                <label htmlFor="tenant-email" className="label">
                  Correo electrónico (para inicio de sesión en portal)
                </label>
                <input
                  id="tenant-email"
                  name="email"
                  type="email"
                  required
                  className="field min-h-11 text-sm"
                  placeholder="inquilino@ejemplo.com"
                />
              </div>

              <div>
                <label htmlFor="tenant-password" className="label">
                  Contraseña temporal (opcional)
                </label>
                <input
                  id="tenant-password"
                  name="password"
                  type="text"
                  defaultValue="PlazaAragon2026!"
                  className="field min-h-11 text-sm"
                />
                <p className="mt-1 text-[11px] text-piedra">
                  Por defecto: PlazaAragon2026! El inquilino la usará para subir sus comprobantes.
                </p>
              </div>

              <FormMessage state={state} />

              <footer className="flex flex-col-reverse gap-2 border-t border-crema pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-ghost min-h-11 text-sm py-2 px-4"
                >
                  Cancelar
                </button>
                <SubmitButton
                  pendingText="Registrando…"
                  className="btn-primary min-h-11 text-sm py-2 px-5"
                >
                  Registrar inquilino
                </SubmitButton>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
