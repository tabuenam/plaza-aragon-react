"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { upsertModuleFinancingAction } from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { formatMoney } from "@/lib/format";
import { calculateMonthlyDebtService } from "@/lib/profitability";
import type { FinancingMode, FormState, ModuleFinancing } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function ModuleFinancingModal({
  spaceId,
  spaceName,
  totalConstructionCost,
  financing,
}: {
  spaceId: string;
  spaceName: string;
  totalConstructionCost: number;
  financing: ModuleFinancing | null;
}) {
  const { notify } = useAdminToast();
  const dialogTitleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const [mode, setMode] = useState<FinancingMode>(financing?.financing_mode ?? "cash");
  const [loanAmount, setLoanAmount] = useState(
    financing?.loan_amount ? String(financing.loan_amount) : ""
  );
  const [annualRate, setAnnualRate] = useState(
    financing ? String(financing.annual_interest_rate) : "0"
  );
  const [termUnit, setTermUnit] = useState<"months" | "years">("months");
  const [termValue, setTermValue] = useState(
    financing?.term_months ? String(financing.term_months) : "60"
  );
  const [downPayment, setDownPayment] = useState(
    financing?.down_payment !== null && financing?.down_payment !== undefined
      ? String(financing.down_payment)
      : ""
  );
  const [monthlyOpEx, setMonthlyOpEx] = useState(
    financing?.monthly_operating_expense ? String(financing.monthly_operating_expense) : "0"
  );
  const [vacancyRate, setVacancyRate] = useState(
    financing?.vacancy_rate_pct !== undefined ? String(financing.vacancy_rate_pct) : "0"
  );
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setMode(financing?.financing_mode ?? "cash");
    setLoanAmount(financing?.loan_amount ? String(financing.loan_amount) : "");
    setAnnualRate(financing ? String(financing.annual_interest_rate) : "0");
    setTermUnit("months");
    setTermValue(financing?.term_months ? String(financing.term_months) : "60");
    setDownPayment(
      financing?.down_payment !== null && financing?.down_payment !== undefined
        ? String(financing.down_payment)
        : ""
    );
    setMonthlyOpEx(
      financing?.monthly_operating_expense ? String(financing.monthly_operating_expense) : "0"
    );
    setVacancyRate(
      financing?.vacancy_rate_pct !== undefined ? String(financing.vacancy_rate_pct) : "0"
    );
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await upsertModuleFinancingAction(prev, formData);
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

  const parsedLoan = Number(loanAmount) || 0;
  const parsedRate = Number(annualRate) || 0;
  const rawTerm = Number(termValue) || 0;
  const termMonths = termUnit === "years" ? Math.round(rawTerm * 12) : Math.round(rawTerm);
  const previewMonthlyDebt =
    mode === "financed" ? calculateMonthlyDebtService(parsedLoan, parsedRate, termMonths) : 0;

  const fallbackCashInvested = Math.max(0, totalConstructionCost - parsedLoan);
  const parsedMonthlyOpEx = Number(monthlyOpEx) || 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("space_id", spaceId);
    formData.set("financing_mode", mode);
    formData.set("monthly_operating_expense", monthlyOpEx.trim() || "0");
    formData.set("vacancy_rate_pct", vacancyRate.trim() || "0");
    if (mode === "financed") {
      formData.set("term_months", String(termMonths));
    } else {
      formData.set("loan_amount", "0");
      formData.set("annual_interest_rate", "0");
      formData.set("term_months", "0");
      formData.set("down_payment", "");
    }

    startTransition(async () => {
      await formAction(formData);
    });
  }

  const isFinanced = mode === "financed";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="btn-ghost min-h-11 px-3 py-2 text-xs font-semibold"
      >
        <svg className="h-3.5 w-3.5 shrink-0 text-azul" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span>Configurar finanzas y operación</span>
      </button>

      <AdminDialog open={isOpen} onClose={handleClose} labelledBy={dialogTitleId} className="max-w-lg">
        <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white">
          <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
            <div className="min-w-0 pr-2">
              <h2 id={dialogTitleId} className="font-display text-lg font-bold text-azul sm:text-xl">
                Configurar finanzas y operación · {spaceName}
              </h2>
              <p className="text-xs text-piedra">
                Defina el financiamiento, el gasto operativo mensual y la vacancia estimada del módulo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-piedra transition hover:bg-arena hover:text-tinta cursor-pointer"
              aria-label="Cerrar ventana"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <span className="label">Modalidad de inversión</span>
              <div
                role="group"
                aria-label="Modalidad de financiamiento"
                className="grid grid-cols-2 gap-1.5 rounded-2xl border border-crema bg-arena p-1"
              >
                <button
                  type="button"
                  aria-pressed={!isFinanced}
                  onClick={() => setMode("cash")}
                  className={`min-h-11 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    !isFinanced
                      ? "bg-azul text-white shadow-xs"
                      : "text-piedra hover:bg-white/80 hover:text-tinta"
                  }`}
                >
                  Contado (All-Cash)
                </button>
                <button
                  type="button"
                  aria-pressed={isFinanced}
                  onClick={() => setMode("financed")}
                  className={`min-h-11 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    isFinanced
                      ? "bg-maiz text-azul-oscuro shadow-xs ring-1 ring-maiz/50"
                      : "text-piedra hover:bg-white/80 hover:text-tinta"
                  }`}
                >
                  Financiado (Préstamo)
                </button>
              </div>
            </div>

            {isFinanced ? (
              <div className="space-y-4 rounded-2xl border border-crema bg-arena/40 p-4">
                <div>
                  <label htmlFor={`loan-amount-${spaceId}`} className="label">
                    Monto del préstamo (L)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-display font-bold text-piedra">
                      L
                    </span>
                    <input
                      id={`loan-amount-${spaceId}`}
                      name="loan_amount"
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      inputMode="decimal"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="Ej: 500000"
                      className="field min-h-11 pl-9 font-display font-bold tabular-nums text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`interest-rate-${spaceId}`} className="label">
                      Tasa de interés anual (%)
                    </label>
                    <input
                      id={`interest-rate-${spaceId}`}
                      name="annual_interest_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      inputMode="decimal"
                      value={annualRate}
                      onChange={(e) => setAnnualRate(e.target.value)}
                      placeholder="Ej: 12.5"
                      className="field min-h-11 font-display font-bold tabular-nums text-sm"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label htmlFor={`term-value-${spaceId}`} className="text-sm font-semibold text-tinta">
                        Plazo
                      </label>
                      <div className="inline-flex rounded-lg border border-crema bg-white p-0.5 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setTermUnit("months")}
                          className={`rounded-md px-2 py-0.5 cursor-pointer ${
                            termUnit === "months" ? "bg-azul text-white" : "text-piedra"
                          }`}
                        >
                          Meses
                        </button>
                        <button
                          type="button"
                          onClick={() => setTermUnit("years")}
                          className={`rounded-md px-2 py-0.5 cursor-pointer ${
                            termUnit === "years" ? "bg-azul text-white" : "text-piedra"
                          }`}
                        >
                          Años
                        </button>
                      </div>
                    </div>
                    <input
                      id={`term-value-${spaceId}`}
                      type="number"
                      step="1"
                      min="1"
                      max={termUnit === "years" ? 50 : 600}
                      required
                      inputMode="numeric"
                      value={termValue}
                      onChange={(e) => setTermValue(e.target.value)}
                      className="field min-h-11 font-display font-bold tabular-nums text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`down-payment-${spaceId}`} className="label">
                    Prima / Efectivo invertido (L) <span className="font-normal text-piedra">(opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-display font-bold text-piedra">
                      L
                    </span>
                    <input
                      id={`down-payment-${spaceId}`}
                      name="down_payment"
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      placeholder={String(fallbackCashInvested)}
                      className="field min-h-11 pl-9 font-display font-bold tabular-nums text-sm"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-piedra">
                    Si se deja vacío, se calcula automáticamente como Costo de construcción − Préstamo (
                    <strong className="text-tinta">{formatMoney(fallbackCashInvested)}</strong>).
                  </p>
                </div>

                <div className="rounded-xl border border-azul/15 bg-white p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-piedra">Cuota mensual estimada ({termMonths} meses)</span>
                    <span className="font-display text-base font-bold tabular-nums text-azul">
                      {formatMoney(previewMonthlyDebt)}/mes
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-piedra">
                    Servicio de deuda anual: <strong className="text-tinta">{formatMoney(previewMonthlyDebt * 12)}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-selva/20 bg-selva-claro/40 p-4 text-xs text-selva">
                <p className="font-bold">Inversión 100% al contado</p>
                <p className="mt-1 text-tinta/80">
                  No se descontará servicio de deuda del Ingreso Operativo Neto (NOI), y el retorno sobre
                  efectivo (Cash-on-Cash) será igual al Cap Rate sobre el costo de construcción.
                </p>
              </div>
            )}

            {/* Operating Expense & Vacancy Section */}
            <section className="space-y-4 rounded-2xl border border-crema bg-arena/35 p-4">
              <div>
                <h3 className="text-sm font-bold text-azul">Operación y vacancia</h3>
                <p className="mt-0.5 text-[11px] leading-snug text-piedra">
                  Ajuste los gastos fijos mensuales y el margen por meses desocupados para proyectar el NOI real.
                </p>
              </div>

              <div>
                <label htmlFor={`monthly-opex-${spaceId}`} className="label">
                  Gasto operativo mensual estimado (L)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-display font-bold text-piedra">
                    L
                  </span>
                  <input
                    id={`monthly-opex-${spaceId}`}
                    name="monthly_operating_expense"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={monthlyOpEx}
                    onChange={(e) => setMonthlyOpEx(e.target.value)}
                    placeholder="0"
                    className="field min-h-11 pl-9 font-display font-bold tabular-nums text-sm"
                  />
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-piedra">
                  Incluye mantenimiento, impuestos, seguros o administración. Si es mayor a L 0 (
                  {parsedMonthlyOpEx > 0
                    ? `${formatMoney(parsedMonthlyOpEx * 12)}/año`
                    : "actualmente usa recibos"}
                  ), reemplaza el cálculo automático de recibos operativos para evitar duplicados.
                </p>
              </div>

              <div>
                <label htmlFor={`vacancy-rate-${spaceId}`} className="label">
                  Porcentaje de vacancia estimado (%)
                </label>
                <div className="relative">
                  <input
                    id={`vacancy-rate-${spaceId}`}
                    name="vacancy_rate_pct"
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    inputMode="decimal"
                    value={vacancyRate}
                    onChange={(e) => setVacancyRate(e.target.value)}
                    placeholder="0"
                    className="field min-h-11 pr-9 font-display font-bold tabular-nums text-sm"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 font-display font-bold text-piedra">
                    %
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-piedra">
                  Rango permitido de 0% a 100%. Un <strong className="text-tinta">5% a 10%</strong> es común para contemplar meses sin inquilino entre contratos.
                </p>
              </div>
            </section>

            <FormMessage state={state} />

            <footer className="flex flex-col-reverse gap-2 border-t border-crema pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleClose} className="btn-ghost min-h-11 px-4 py-2 text-sm">
                Cancelar
              </button>
              <SubmitButton
                pendingText={isPending ? "Guardando…" : "Guardando…"}
                disabled={isPending}
                className="btn-primary min-h-11 px-5 py-2 text-sm"
              >
                Guardar configuración
              </SubmitButton>
            </footer>
          </form>
        </div>
      </AdminDialog>
    </>
  );
}
