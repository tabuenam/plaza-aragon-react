"use client";

import { useActionState, useEffect, useState } from "react";
import { updateLeaseAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { formatMoney } from "@/lib/format";
import type { AdminLease, FormState, Space, Tenant } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function EditLeaseModal({
  lease,
  spaces,
  tenants,
  activeSpaceIds = [],
}: {
  lease: AdminLease;
  spaces: Space[];
  tenants: Tenant[];
  activeSpaceIds?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(updateLeaseAction, initialState);

  const [spaceId, setSpaceId] = useState(lease.space_id);
  const [tenantId, setTenantId] = useState(lease.tenant_id);
  const [startDate, setStartDate] = useState(lease.start_date);
  const [endDate, setEndDate] = useState(lease.end_date);
  const [monthlyRent, setMonthlyRent] = useState<number | string>(lease.monthly_rent);
  const [isActive, setIsActive] = useState(lease.active);

  useEffect(() => {
    if (state.ok && state.message) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state]);

  function handleOpen() {
    setSpaceId(lease.space_id);
    setTenantId(lease.tenant_id);
    setStartDate(lease.start_date);
    setEndDate(lease.end_date);
    setMonthlyRent(lease.monthly_rent);
    setIsActive(lease.active);
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  const occupiedOtherSpaces = activeSpaceIds.filter((id) => id !== lease.space_id);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-crema bg-white px-3 py-1.5 text-xs font-semibold text-azul transition hover:bg-crema/40 active:scale-95"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        Modificar
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-lease-title-${lease.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        >
          <div
            className="fixed inset-0 bg-tinta/60 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          />

          <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-crema">
            <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
              <div>
                <h3 id={`edit-lease-title-${lease.id}`} className="font-display text-lg font-bold text-azul sm:text-xl">
                  Modificar Contrato · {lease.space.name}
                </h3>
                <p className="text-xs text-piedra">
                  Ajuste las condiciones, montos o estado del contrato de arrendamiento.
                </p>
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
              <input type="hidden" name="lease_id" value={lease.id} />

              <div>
                <label htmlFor={`edit-space-${lease.id}`} className="label">
                  Local comercial
                </label>
                <select
                  id={`edit-space-${lease.id}`}
                  name="space_id"
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  required
                  className="field min-h-11 text-sm"
                >
                  {spaces.map((s) => {
                    const isOccupiedByOther = occupiedOtherSpaces.includes(s.id);
                    return (
                      <option key={s.id} value={s.id} disabled={isOccupiedByOther}>
                        {s.name} · {formatMoney(s.price)} {isOccupiedByOther ? "(Ocupado por otro contrato)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor={`edit-tenant-${lease.id}`} className="label">
                  Inquilino / Arrendatario
                </label>
                <select
                  id={`edit-tenant-${lease.id}`}
                  name="tenant_id"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                  className="field min-h-11 text-sm"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.contact_info ? `(${t.contact_info})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`edit-start-date-${lease.id}`} className="label">
                    Fecha de inicio
                  </label>
                  <input
                    id={`edit-start-date-${lease.id}`}
                    name="start_date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="field min-h-11 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor={`edit-end-date-${lease.id}`} className="label">
                    Fecha de finalización
                  </label>
                  <input
                    id={`edit-end-date-${lease.id}`}
                    name="end_date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="field min-h-11 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`edit-monthly-rent-${lease.id}`} className="label">
                  Renta mensual pactada (HNL)
                </label>
                <input
                  id={`edit-monthly-rent-${lease.id}`}
                  name="monthly_rent"
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="field min-h-11 text-sm"
                />
              </div>

              <div className="rounded-2xl border border-crema bg-arena/40 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    value="true"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-5 w-5 rounded-md border-crema text-azul focus:ring-azul"
                  />
                  <div>
                    <span className="text-sm font-semibold text-tinta">Contrato Activo y Vigente</span>
                    <p className="text-xs text-piedra">
                      Si desmarca esta casilla, el contrato se marcará como inactivo y el local pasará a estar disponible.
                    </p>
                  </div>
                </label>
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
                  pendingText="Guardando cambios…"
                  className="btn-primary min-h-11 text-sm py-2 px-5"
                >
                  Guardar cambios
                </SubmitButton>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
