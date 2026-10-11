"use client";

import { useActionState, useEffect, useState } from "react";
import { createLeaseAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { formatMoney, todayInHonduras } from "@/lib/format";
import type { FormState, Space, Tenant } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

function defaultEndDate(startDateStr: string) {
  if (!startDateStr) return "";
  const parts = startDateStr.split("-").map(Number);
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  const nextYear = year + 1;
  return `${nextYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CreateLeaseModal({
  spaces,
  tenants,
  activeSpaceIds = [],
  initialSpaceId,
}: {
  spaces: Space[];
  tenants: Tenant[];
  activeSpaceIds?: string[];
  initialSpaceId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(createLeaseAction, initialState);

  const availableSpaces = spaces.filter((s) => !activeSpaceIds.includes(s.id));
  const defaultSpace = initialSpaceId
    ? spaces.find((s) => s.id === initialSpaceId)
    : (availableSpaces[0] || spaces[0]);

  const [selectedSpaceId, setSelectedSpaceId] = useState(defaultSpace?.id || "");
  const [rentAmount, setRentAmount] = useState(defaultSpace?.price || 8000);
  const [startDate, setStartDate] = useState(todayInHonduras());
  const [endDate, setEndDate] = useState(defaultEndDate(todayInHonduras()));

  useEffect(() => {
    if (state.ok && state.message) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state]);

  function handleOpen() {
    const candidate = initialSpaceId
      ? spaces.find((s) => s.id === initialSpaceId)
      : (availableSpaces[0] || spaces[0]);

    if (candidate) {
      setSelectedSpaceId(candidate.id);
      setRentAmount(candidate.price);
    }
    const today = todayInHonduras();
    setStartDate(today);
    setEndDate(defaultEndDate(today));
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  function handleSpaceChange(newSpaceId: string) {
    setSelectedSpaceId(newSpaceId);
    const space = spaces.find((s) => s.id === newSpaceId);
    if (space) {
      setRentAmount(space.price);
    }
  }

  function handleStartDateChange(newStartDate: string) {
    setStartDate(newStartDate);
    setEndDate(defaultEndDate(newStartDate));
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-azul px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-azul-oscuro active:scale-95"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo contrato
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-lease-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        >
          <div
            className="fixed inset-0 bg-tinta/60 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          />

          <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-crema">
            <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
              <div>
                <h3 id="create-lease-title" className="font-display text-lg font-bold text-azul sm:text-xl">
                  Registrar Contrato de Arrendamiento
                </h3>
                <p className="text-xs text-piedra">
                  Asigne un local comercial a un inquilino con vigencia y monto mensual.
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
              <div>
                <label htmlFor="create-space-id" className="label">
                  Local comercial
                </label>
                <select
                  id="create-space-id"
                  name="space_id"
                  value={selectedSpaceId}
                  onChange={(e) => handleSpaceChange(e.target.value)}
                  required
                  className="field min-h-11 text-sm"
                >
                  {spaces.map((s) => {
                    const hasActive = activeSpaceIds.includes(s.id);
                    return (
                      <option key={s.id} value={s.id} disabled={hasActive}>
                        {s.name} · {formatMoney(s.price)} {hasActive ? "(Ya tiene contrato activo)" : `(${s.status === "available" ? "Disponible" : s.status})`}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-[11px] text-piedra">
                  Al formalizar el contrato, el local pasará automáticamente a estado Ocupado.
                </p>
              </div>

              <div>
                <label htmlFor="create-tenant-id" className="label">
                  Inquilino / Arrendatario
                </label>
                {tenants.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-crema p-3 text-xs text-barro">
                    No hay inquilinos registrados. Cree primero un inquilino con el botón correspondiente.
                  </div>
                ) : (
                  <select
                    id="create-tenant-id"
                    name="tenant_id"
                    required
                    className="field min-h-11 text-sm"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.contact_info ? `(${t.contact_info})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="create-start-date" className="label">
                    Fecha de inicio
                  </label>
                  <input
                    id="create-start-date"
                    name="start_date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="field min-h-11 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="create-end-date" className="label">
                    Fecha de finalización
                  </label>
                  <input
                    id="create-end-date"
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
                <label htmlFor="create-monthly-rent" className="label">
                  Renta mensual pactada (HNL)
                </label>
                <input
                  id="create-monthly-rent"
                  name="monthly_rent"
                  type="number"
                  min="1"
                  step="100"
                  required
                  value={rentAmount}
                  onChange={(e) => setRentAmount(Number(e.target.value))}
                  className="field min-h-11 text-sm"
                />
                <p className="mt-1 text-[11px] text-piedra">
                  Monto acordado en lempiras para el cobro mensual del alquiler.
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
                  pendingText="Creando contrato…"
                  className="btn-primary min-h-11 text-sm py-2 px-5"
                >
                  Crear contrato
                </SubmitButton>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
