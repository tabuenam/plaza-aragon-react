"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { deleteModuleExpenseAction } from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { useAdminToast } from "@/app/admin/admin-toast";
import { CreateExpenseModal } from "@/app/admin/rentabilidad/create-expense-modal";
import { ModuleFinancingModal } from "@/app/admin/rentabilidad/module-financing-modal";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import type {
  FormState,
  ModuleExpense,
  ModuleProfitabilityMetrics,
  PlazaProfitabilitySummary,
} from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

type MetricKey =
  | "grm"
  | "one_percent"
  | "cap_rate"
  | "cash_flow"
  | "cash_on_cash"
  | "payback"
  | "occupancy";

function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

function ExpenseRow({ expense }: { expense: ModuleExpense }) {
  const { notify } = useAdminToast();
  const [isPending, startTransition] = useTransition();

  const [, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await deleteModuleExpenseAction(prev, formData);
    if (result.message) {
      notify(result.message, result.ok ? "success" : "error");
    }
    return result;
  }, initialState);

  function handleDelete() {
    if (!window.confirm(`¿Eliminar este gasto ("${expense.reason}")? Esta acción no se puede deshacer.`)) {
      return;
    }
    const fd = new FormData();
    fd.set("expense_id", expense.id);
    startTransition(async () => {
      await formAction(fd);
    });
  }

  const isConstruction = expense.category === "construction";

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-crema/90 bg-arena/40 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              isConstruction
                ? "bg-azul/10 text-azul ring-1 ring-azul/15"
                : "bg-barro-claro text-barro ring-1 ring-barro/20"
            }`}
          >
            {isConstruction ? "Construcción" : "Operación"}
          </span>
          <span className="text-xs font-medium text-piedra">{formatDate(expense.expense_date)}</span>
        </div>
        <p className="text-sm font-semibold text-tinta break-words">{expense.reason}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
        <span className="font-display text-base font-bold tabular-nums text-tinta">
          {formatMoney(expense.amount)}
        </span>

        <div className="flex items-center gap-1.5">
          {expense.signed_receipt_url && (
            <a
              href={expense.signed_receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-crema bg-white px-3 text-xs font-semibold text-azul transition hover:border-azul/30 hover:bg-turquesa-claro/30"
            >
              Comprobante ↗
            </a>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={`Eliminar gasto ${expense.reason}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-barro/20 bg-white px-3 text-xs font-semibold text-barro transition hover:bg-barro-claro/60 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </li>
  );
}

function MetricTile({
  label,
  value,
  hint,
  badge,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  badge?: { text: string; tone: "positive" | "warning" | "neutral" };
  tone?: "positive" | "negative" | "neutral";
  onClick: () => void;
}) {
  const valueClass =
    tone === "positive" ? "text-selva" : tone === "negative" ? "text-barro" : "text-azul";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-11 w-full min-w-0 flex-col justify-between rounded-2xl border border-crema bg-arena/35 p-3.5 text-left transition hover:border-azul/35 hover:bg-white hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul cursor-pointer"
    >
      <div className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-piedra">{label}</span>
          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                badge.tone === "positive"
                  ? "bg-selva-claro text-selva"
                  : badge.tone === "warning"
                    ? "bg-maiz-claro text-[#734d08]"
                    : "bg-crema/70 text-piedra"
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>
        <p className={`mt-1.5 font-display text-xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      </div>
      <div className="mt-2 w-full space-y-1.5">
        <p className="text-[11px] leading-snug text-piedra">{hint}</p>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-azul/80 group-hover:text-azul">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Toca para ver explicación</span>
        </span>
      </div>
    </button>
  );
}

type CalculationStep = {
  label: string;
  value: string;
  highlight?: boolean;
};

type MetricEducationContent = {
  title: string;
  currentValue: string;
  meaning: string;
  formula: string;
  steps: CalculationStep[];
  importance: string;
};

function buildMetricEducation(mod: ModuleProfitabilityMetrics, metric: MetricKey): MetricEducationContent {
  const vacancyAmount = mod.grossAnnualRent - mod.effectiveAnnualRent;
  const opExSourceLabel = mod.usesBudgetedOperatingExpense
    ? `Presupuesto fijo (${formatMoney(mod.monthlyOperatingExpense)}/mes × 12)`
    : "Recibos operativos (últimos 12 meses)";

  const baseNoiSteps: CalculationStep[] = [
    {
      label: `Renta mensual ${mod.isProjectedRent ? "(proyectada)" : "(contrato activo)"}`,
      value: `${formatMoney(mod.monthlyRent)}/mes`,
    },
    {
      label: "Renta bruta anual (× 12 meses)",
      value: formatMoney(mod.grossAnnualRent),
    },
    {
      label: `Reserva por vacancia (${mod.vacancyRatePct.toFixed(1)}%)`,
      value: `− ${formatMoney(vacancyAmount)}`,
    },
    {
      label: "Ingreso efectivo anual (EGI)",
      value: formatMoney(mod.effectiveAnnualRent),
    },
    {
      label: `Gastos operativos anuales · ${opExSourceLabel}`,
      value: `− ${formatMoney(mod.annualOperatingExpenses)}`,
    },
    {
      label: "NOI (Ingreso Operativo Neto)",
      value: formatMoney(mod.noi),
    },
  ];

  switch (metric) {
    case "grm":
      return {
        title: "GRM (Multiplicador de Renta Bruta)",
        currentValue: mod.grm !== null ? `${mod.grm.toFixed(1)}x` : "—",
        meaning:
          "El GRM (Gross Rent Multiplier) indica cuántos años de renta bruta anual se necesitan para igualar el costo de construcción del módulo, sin descontar vacancia, gastos operativos ni financiamiento.",
        formula: "GRM = Costo de construcción ÷ Renta bruta anual (Renta mensual × 12)",
        steps: [
          { label: "Costo de construcción registrado", value: formatMoney(mod.totalConstructionCost) },
          {
            label: `Renta mensual ${mod.isProjectedRent ? "(proyectada)" : "(activa)"}`,
            value: `${formatMoney(mod.monthlyRent)}/mes`,
          },
          { label: "Renta bruta anual", value: formatMoney(mod.grossAnnualRent) },
          {
            label: "Resultado GRM",
            value: mod.grm !== null ? `${mod.grm.toFixed(2)}x años` : "Requiere costo de construcción > L 0",
            highlight: true,
          },
        ],
        importance:
          "Es una regla rápida para comparar locales entre sí: mientras más bajo sea el GRM, más rápido recuperas la obra en términos brutos. En locales comerciales, un GRM entre 6x y 10x suele considerarse atractivo; úsalo junto al Cap Rate porque el GRM ignora gastos y vacancia.",
      };

    case "one_percent":
      return {
        title: "Regla del 1%",
        currentValue: formatPercent(mod.onePercentRulePct, 2),
        meaning:
          "Compara el alquiler mensual bruto contra el costo total de construcción del local. Si el resultado es 1.00% o más, el módulo cumple este estándar clásico de inversión inmobiliaria.",
        formula: "Regla del 1% = (Renta mensual ÷ Costo de construcción) × 100",
        steps: [
          {
            label: `Renta mensual ${mod.isProjectedRent ? "(proyectada)" : "(activa)"}`,
            value: formatMoney(mod.monthlyRent),
          },
          { label: "Costo de construcción registrado", value: formatMoney(mod.totalConstructionCost) },
          {
            label: "Porcentaje mensual obtenido",
            value:
              mod.onePercentRulePct !== null
                ? `${mod.onePercentRulePct.toFixed(2)}% (${mod.meetsOnePercentRule ? "Cumple ≥ 1%" : "Por debajo de 1%"})`
                : "Requiere costo de construcción > L 0",
            highlight: true,
          },
        ],
        importance:
          "Una renta mensual igual o superior al 1% del costo de obra suele dar suficiente colchón para cubrir mantenimiento, meses de vacancia y préstamo bancario con flujo positivo. Si está por debajo del 1%, conviene revisar gastos o ajustar el precio al renovar contrato.",
      };

    case "cap_rate":
      return {
        title: "Cap Rate (Tasa de Capitalización)",
        currentValue: formatPercent(mod.capRatePct),
        meaning:
          "Mide la rentabilidad anual pura del local sobre su costo de construcción, ya descontando vacancia estimada y gastos operativos (NOI), pero antes de pagar intereses o capital de préstamo.",
        formula: "Cap Rate = (NOI ÷ Costo de construcción) × 100, donde NOI = EGI − OpEx anual",
        steps: [
          ...baseNoiSteps,
          { label: "Costo de construcción registrado", value: formatMoney(mod.totalConstructionCost) },
          {
            label: "Cap Rate resultante",
            value:
              mod.capRatePct !== null
                ? `${mod.capRatePct.toFixed(1)}% anual`
                : "Requiere costo de construcción > L 0",
            highlight: true,
          },
        ],
        importance:
          "Es el indicador estándar para comparar propiedades sin importar cómo se financiaron (al contado o con banco). En locales comerciales de Olanchito, un Cap Rate de 8% a 12%+ anual suele reflejar un activo sólido frente a tasas bancarias o depósitos a plazo.",
      };

    case "cash_flow":
      return {
        title: "Ingreso Neto tras Financiamiento",
        currentValue: `${formatMoney(mod.monthlyCashFlow)}/mes`,
        meaning:
          "Representa el dinero libre real que genera el módulo cada año y cada mes después de descontar la reserva por vacancia, los gastos operativos anuales y la cuota del préstamo bancario (si aplica).",
        formula: "Flujo Neto Anual = NOI − Servicio de deuda anual  |  Mensual = Flujo Anual ÷ 12",
        steps: [
          ...baseNoiSteps,
          {
            label:
              mod.financingMode === "financed"
                ? `Servicio de deuda anual (${formatMoney(mod.monthlyDebtService)}/mes × 12)`
                : "Servicio de deuda anual (Contado)",
            value: `− ${formatMoney(mod.annualDebtService)}`,
          },
          {
            label: "Ingreso neto anual tras financiamiento",
            value: `${formatMoney(mod.annualCashFlow)}/año`,
            highlight: true,
          },
          {
            label: "Equivalente mensual en caja",
            value: `${formatMoney(mod.monthlyCashFlow)}/mes`,
            highlight: true,
          },
        ],
        importance:
          "Es el pulso directo de liquidez para Plaza Aragón: un flujo neto positivo significa que el local se sostiene solo (paga sus gastos, reserva vacancia y cuota bancaria) y aporta ganancia real cada mes. Un valor negativo indica que el módulo requiere subsidio de otros locales.",
      };

    case "cash_on_cash":
      return {
        title: "Cash-on-Cash Return (Retorno sobre Efectivo)",
        currentValue: formatPercent(mod.cashOnCashPct),
        meaning:
          "Calcula qué porcentaje anual estás ganando exclusivamente sobre el efectivo real que salió de tu bolsa (la prima en caso de préstamo, o el costo total de construcción si se pagó al contado).",
        formula: "Cash-on-Cash = (Ingreso Neto Anual tras Financiamiento ÷ Efectivo invertido) × 100",
        steps: [
          ...baseNoiSteps,
          {
            label:
              mod.financingMode === "financed"
                ? `Servicio de deuda anual (${formatMoney(mod.monthlyDebtService)}/mes × 12)`
                : "Servicio de deuda anual (Contado)",
            value: `− ${formatMoney(mod.annualDebtService)}`,
          },
          {
            label: "Ingreso neto anual tras financiamiento",
            value: formatMoney(mod.annualCashFlow),
          },
          {
            label:
              mod.financingMode === "financed"
                ? "Efectivo invertido (prima / capital propio)"
                : "Efectivo invertido (100% construcción al contado)",
            value: formatMoney(mod.cashInvested),
          },
          {
            label: "Retorno Cash-on-Cash",
            value:
              mod.cashOnCashPct !== null
                ? `${mod.cashOnCashPct.toFixed(1)}% anual`
                : "Requiere efectivo invertido > L 0",
            highlight: true,
          },
        ],
        importance:
          "Te muestra la eficiencia real de tu capital propio. Si la tasa del préstamo es menor que el Cap Rate del módulo, el apalancamiento eleva tu Cash-on-Cash; si la deuda es muy cara, este retorno cae por debajo del Cap Rate.",
      };

    case "payback": {
      const remainingToRecover = Math.max(0, mod.totalSpent - mod.totalCollectedRent);
      const monthlyNetContribution = mod.noi / 12 - mod.monthlyDebtService;
      return {
        title: "Tiempo de recuperación (Payback)",
        currentValue:
          mod.paybackPercent !== null ? `${mod.paybackPercent.toFixed(1)}% recuperado` : "Sin inversión",
        meaning:
          "Muestra qué porcentaje de todo lo gastado (construcción + operación histórica) ya se ha recuperado con rentas verificadas cobradas, y estima cuántos meses faltan al ritmo de flujo neto mensual actual.",
        formula:
          "Recuperado (%) = (Total cobrado ÷ Total gastado) × 100  |  Meses restantes = Saldo pendiente ÷ Contribución neta mensual",
        steps: [
          {
            label: "Total invertido / gastado (Construcción + Operación)",
            value: formatMoney(mod.totalSpent),
          },
          {
            label: "Total cobrado en rentas verificadas",
            value: formatMoney(mod.totalCollectedRent),
          },
          {
            label: "Saldo pendiente por recuperar",
            value: formatMoney(remainingToRecover),
          },
          {
            label: "NOI mensual promedio (tras vacancia y OpEx)",
            value: `${formatMoney(mod.noi / 12)}/mes`,
          },
          {
            label: "Cuota mensual de deuda",
            value: `− ${formatMoney(mod.monthlyDebtService)}/mes`,
          },
          {
            label: "Contribución neta mensual estimada",
            value: `${formatMoney(monthlyNetContribution)}/mes`,
          },
          {
            label: "Estado y plazo estimado",
            value:
              mod.paybackMonthsRemaining === 0
                ? "100% recuperado (0 meses restantes)"
                : mod.paybackMonthsRemaining !== null
                  ? `${formatPercent(mod.paybackPercent)} · ~${mod.paybackMonthsRemaining} meses restantes`
                  : "No estimable (flujo neto ≤ L 0 o sin inversión)",
            highlight: true,
          },
        ],
        importance:
          "Permite medir el horizonte real para recuperar el capital puesto en Plaza Aragón considerando tanto lo que ya cobraste como el desgaste de vacancia, operación y préstamo hacia adelante.",
      };
    }

    case "occupancy":
      return {
        title: "Tasa de ocupación histórica",
        currentValue:
          mod.occupancyRate !== null
            ? `${mod.occupancyRate.toFixed(0)}% (${mod.occupiedMonths}/${mod.trackedMonths} meses)`
            : "Sin contratos",
        meaning:
          "Indica el porcentaje de meses que el módulo ha estado arrendado desde el inicio de su primer contrato registrado hasta el mes actual en Honduras.",
        formula: "Ocupación (%) = (Meses con contrato vigente ÷ Meses totales rastreados) × 100",
        steps: [
          { label: "Meses ocupados con contrato", value: `${mod.occupiedMonths} meses` },
          { label: "Meses rastreados desde el primer contrato", value: `${mod.trackedMonths} meses` },
          {
            label: "Vacancia histórica observada",
            value:
              mod.occupancyRate !== null
                ? `${(100 - mod.occupancyRate).toFixed(1)}%`
                : "Sin historial aún",
          },
          {
            label: "Vacancia preventiva configurada en proyección",
            value: `${mod.vacancyRatePct.toFixed(1)}%`,
          },
          {
            label: "Tasa de ocupación histórica",
            value:
              mod.occupancyRate !== null
                ? `${mod.occupancyRate.toFixed(1)}% (${mod.occupiedMonths}/${mod.trackedMonths} meses)`
                : "Sin contratos registrados",
            highlight: true,
          },
        ],
        importance:
          "Comparar tu ocupación real histórica contra la vacancia estimada (usualmente 5%–10%) te confirma si tus proyecciones de NOI son conservadoras o si un local pasa demasiado tiempo desocupado y requiere ajustes de precio o promoción.",
      };
  }
}

export function ProfitabilityDashboard({
  summary,
  modules,
}: {
  summary: PlazaProfitabilitySummary;
  modules: ModuleProfitabilityMetrics[];
}) {
  const spaceOptions = modules.map((m) => ({ id: m.spaceId, name: m.spaceName }));
  const overallPaybackBar =
    summary.overallPaybackPercent !== null ? Math.min(100, Math.max(0, summary.overallPaybackPercent)) : 0;

  const eduDialogTitleId = useId();
  const [activeEducation, setActiveEducation] = useState<{
    module: ModuleProfitabilityMetrics;
    metric: MetricKey;
  } | null>(null);

  const educationContent = activeEducation
    ? buildMetricEducation(activeEducation.module, activeEducation.metric)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="eyebrow">Control Financiero · Plaza Aragón</span>
          <h1 className="mt-1 font-display text-2xl font-bold text-azul sm:text-3xl">
            Rentabilidad y Gastos
          </h1>
          <p className="mt-1 text-sm text-piedra">
            Inversión acumulada, gastos operativos, recuperación real de capital y métricas por módulo comercial.
          </p>
        </div>

        <div className="shrink-0">
          <CreateExpenseModal spaces={spaceOptions} />
        </div>
      </div>

      {/* Plaza-Wide Rollup Card */}
      <section aria-label="Resumen global de la plaza" className="card border border-azul/15 bg-white">
        <div className="flex flex-col gap-4 border-b border-crema pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-turquesa">
              Balance Consolidado de la Plaza
            </span>
            <h2 className="mt-0.5 font-display text-xl font-bold text-azul">
              Panorama General de Inversión y Retorno
            </h2>
          </div>

          {summary.topPerformingModule && (
            <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-selva/20 bg-selva-claro/50 px-3.5 py-2 text-xs">
              <span className="font-bold text-selva uppercase tracking-wide">Módulo líder:</span>
              <span className="font-bold text-tinta">{summary.topPerformingModule.spaceName}</span>
              {summary.topPerformingModule.capRatePct !== null && (
                <span className="rounded-full bg-white px-2 py-0.5 font-bold tabular-nums text-selva ring-1 ring-selva/20">
                  {formatPercent(summary.topPerformingModule.capRatePct)} Cap Rate
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-crema bg-arena/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-piedra">Total invertido</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-tinta">
              {formatMoney(summary.totalInvested)}
            </p>
            <p className="mt-1 text-[11px] text-piedra">
              Construcción: {formatMoney(summary.totalConstructionCost)} · Operación:{" "}
              {formatMoney(summary.totalOperatingExpenses)}
            </p>
          </div>

          <div className="rounded-2xl border border-crema bg-arena/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-piedra">
              Renta verificada cobrada
            </p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-selva">
              {formatMoney(summary.totalCollectedRent)}
            </p>
            <p className="mt-1 text-[11px] text-piedra">
              Histórico real (excluye recibos de energía eléctrica)
            </p>
          </div>

          <div className="rounded-2xl border border-crema bg-arena/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-piedra">Balance neto global</p>
            <p
              className={`mt-1 font-display text-2xl font-bold tabular-nums ${
                summary.overallNetBalance >= 0 ? "text-selva" : "text-barro"
              }`}
            >
              {formatMoney(summary.overallNetBalance)}
            </p>
            <p className="mt-1 text-[11px] text-piedra">Total cobrado menos total gastado</p>
          </div>

          <div className="rounded-2xl border border-crema bg-arena/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-piedra">Cap Rate combinado</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-azul">
              {formatPercent(summary.blendedCapRatePct)}
            </p>
            <p className="mt-1 text-[11px] text-piedra">
              NOI anual: {formatMoney(summary.totalAnnualNoi)} (EGI:{" "}
              {formatMoney(summary.totalEffectiveAnnualRent)} − OpEx:{" "}
              {formatMoney(summary.totalAnnualOperatingExpenses)})
            </p>
          </div>
        </div>

        {/* Overall Payback Bar */}
        <div className="mt-5 rounded-2xl border border-crema bg-arena/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-tinta">Recuperación acumulada de la plaza</span>
            <span className="font-display font-bold tabular-nums text-azul">
              {summary.overallPaybackPercent !== null
                ? `${summary.overallPaybackPercent.toFixed(1)}% recuperado`
                : "Sin inversión registrada"}
            </span>
          </div>
          <div
            className="mt-2 h-3 w-full overflow-hidden rounded-full bg-crema/70"
            role="progressbar"
            aria-valuenow={Math.round(overallPaybackBar)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Porcentaje de recuperación global de la plaza"
          >
            <div
              className="h-full rounded-full bg-selva transition-all duration-500"
              style={{ width: `${overallPaybackBar}%` }}
            />
          </div>
        </div>
      </section>

      {/* Per-Module Cards */}
      {modules.length === 0 ? (
        <div className="card text-center text-sm text-piedra">
          No hay locales registrados en Plaza Aragón.
        </div>
      ) : (
        <section aria-label="Rentabilidad por módulo" className="space-y-6">
          {modules.map((mod) => {
            const paybackWidth =
              mod.paybackPercent !== null ? Math.min(100, Math.max(0, mod.paybackPercent)) : 0;

            return (
              <article key={mod.spaceId} className="card space-y-5">
                {/* Module Header */}
                <div className="flex flex-col gap-3 border-b border-crema pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-bold text-azul">{mod.spaceName}</h3>
                      <StatusBadge status={mod.spaceStatus} />
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          mod.financingMode === "financed"
                            ? "bg-maiz-claro text-[#734d08] ring-1 ring-maiz/35"
                            : "bg-arena text-piedra ring-1 ring-crema"
                        }`}
                      >
                        {mod.financingMode === "financed"
                          ? `Financiado · ${formatMoney(mod.monthlyDebtService)}/mes`
                          : "Contado (All-Cash)"}
                      </span>
                      {mod.usesBudgetedOperatingExpense && (
                        <span className="inline-flex items-center rounded-full bg-turquesa-claro/60 px-2.5 py-0.5 text-[11px] font-bold text-azul ring-1 ring-turquesa/25">
                          OpEx fijo: {formatMoney(mod.monthlyOperatingExpense)}/mes
                        </span>
                      )}
                      {mod.vacancyRatePct > 0 && (
                        <span className="inline-flex items-center rounded-full bg-maiz-claro/80 px-2.5 py-0.5 text-[11px] font-bold text-[#734d08] ring-1 ring-maiz/35">
                          Vacancia: {mod.vacancyRatePct.toFixed(1)}%
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-piedra">
                      <span>
                        Renta base:{" "}
                        <strong className="font-display text-sm text-tinta">
                          {formatMoney(mod.monthlyRent)}/mes
                        </strong>
                      </span>
                      {mod.isProjectedRent && (
                        <span
                          title="Calculado usando el precio publicado del módulo porque no hay contrato activo."
                          className="inline-flex items-center rounded-full bg-maiz-claro px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#734d08]"
                        >
                          Proyectado
                        </span>
                      )}
                      <span>·</span>
                      <span>
                        Ingreso efectivo anual (EGI):{" "}
                        <strong className="text-tinta">{formatMoney(mod.effectiveAnnualRent)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <CreateExpenseModal
                      spaces={spaceOptions}
                      defaultSpaceId={mod.spaceId}
                      defaultCategory="operating"
                      triggerLabel="Agregar gasto"
                      triggerClassName="btn-ghost min-h-11 px-3 py-2 text-xs font-semibold"
                    />
                    <ModuleFinancingModal
                      spaceId={mod.spaceId}
                      spaceName={mod.spaceName}
                      totalConstructionCost={mod.totalConstructionCost}
                      financing={mod.financing}
                    />
                  </div>
                </div>

                {/* Lifetime Spent vs Collected + Net Balance */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-crema bg-arena/35 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-piedra">
                      Total invertido / gastado
                    </span>
                    <p className="mt-1 font-display text-xl font-bold tabular-nums text-tinta">
                      {formatMoney(mod.totalSpent)}
                    </p>
                    <p className="mt-1 text-[11px] text-piedra">
                      Construcción: {formatMoney(mod.totalConstructionCost)} · Operación:{" "}
                      {formatMoney(mod.totalOperatingExpenses)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-crema bg-arena/35 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-piedra">
                      Total cobrado (histórico)
                    </span>
                    <p className="mt-1 font-display text-xl font-bold tabular-nums text-selva">
                      {formatMoney(mod.totalCollectedRent)}
                    </p>
                    {mod.collectedByYear.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {mod.collectedByYear.map((yr) => (
                          <span
                            key={yr.year}
                            className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-tinta ring-1 ring-crema"
                          >
                            {yr.year}: {formatMoney(yr.amount)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-piedra">Sin rentas verificadas aún</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-crema bg-arena/35 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-piedra">
                      Balance neto acumulado
                    </span>
                    <p
                      className={`mt-1 font-display text-xl font-bold tabular-nums ${
                        mod.netBalance >= 0 ? "text-selva" : "text-barro"
                      }`}
                    >
                      {formatMoney(mod.netBalance)}
                    </p>
                    <p className="mt-1 text-[11px] text-piedra">
                      {mod.paybackMonthsRemaining === 0
                        ? "Inversión 100% recuperada"
                        : mod.paybackMonthsRemaining !== null
                          ? `Estimado: ~${mod.paybackMonthsRemaining} meses para recuperar`
                          : "Registre inversión y renta para estimar retorno"}
                    </p>
                  </div>
                </div>

                {/* Clickable Payback & Occupancy Row */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setActiveEducation({ module: mod, metric: "payback" })}
                    className="group flex min-h-11 w-full flex-col justify-between rounded-2xl border border-crema bg-white p-3.5 text-left transition hover:border-azul/35 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul cursor-pointer"
                  >
                    <div className="w-full">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-tinta">Tiempo de recuperación (Payback)</span>
                        <span className="font-display font-bold tabular-nums text-azul">
                          {mod.paybackPercent !== null
                            ? `${mod.paybackPercent.toFixed(1)}% recuperado`
                            : "Sin gastos registrados"}
                        </span>
                      </div>
                      <div
                        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-crema/70"
                        role="progressbar"
                        aria-valuenow={Math.round(paybackWidth)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Recuperación de ${mod.spaceName}`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            paybackWidth >= 100 ? "bg-selva" : "bg-turquesa"
                          }`}
                          style={{ width: `${paybackWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-piedra">
                        {mod.paybackMonthsRemaining === 0
                          ? "Capital recuperado al 100%"
                          : mod.paybackMonthsRemaining !== null
                            ? `Faltan ~${mod.paybackMonthsRemaining} meses al ritmo actual`
                            : "Sin plazo estimado aún"}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-azul/80 group-hover:text-azul">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Toca para ver explicación</span>
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEducation({ module: mod, metric: "occupancy" })}
                    className="group flex min-h-11 w-full flex-col justify-between rounded-2xl border border-crema bg-white p-3.5 text-left transition hover:border-azul/35 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul cursor-pointer"
                  >
                    <div className="w-full">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-tinta">Tasa de ocupación</span>
                        <span className="font-display font-bold tabular-nums text-azul">
                          {mod.occupancyRate !== null
                            ? `${mod.occupancyRate.toFixed(0)}% (${mod.occupiedMonths}/${mod.trackedMonths} meses)`
                            : "Sin contratos"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-snug text-piedra">
                        Meses arrendados respecto al historial desde el primer contrato · Vacancia preventiva configurada:{" "}
                        <strong className="text-tinta">{mod.vacancyRatePct.toFixed(1)}%</strong>.
                      </p>
                    </div>
                    <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-azul/80 group-hover:text-azul">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Toca para ver explicación</span>
                    </span>
                  </button>
                </div>

                {/* Construction Cost Helper Banner (when missing) */}
                {mod.totalConstructionCost <= 0 && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-maiz bg-maiz-claro/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#734d08]">
                        Registra el costo de construcción para completar todas las métricas
                      </p>
                      <p className="mt-0.5 text-xs text-piedra">
                        GRM, Regla del 1%, Cap Rate y Cash-on-Cash requieren una inversión inicial de construcción. Puedes tocar cualquier tarjeta para ver su fórmula.
                      </p>
                    </div>
                    <CreateExpenseModal
                      spaces={spaceOptions}
                      defaultSpaceId={mod.spaceId}
                      defaultCategory="construction"
                      triggerLabel="Registrar inversión inicial"
                      triggerClassName="btn-primary min-h-11 shrink-0 px-4 py-2 text-xs"
                    />
                  </div>
                )}

                {/* 5 Clickable Core Financial Metrics */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <MetricTile
                    label="GRM"
                    value={mod.grm !== null ? `${mod.grm.toFixed(1)}x` : "—"}
                    hint="Años de renta bruta para cubrir el costo de construcción."
                    onClick={() => setActiveEducation({ module: mod, metric: "grm" })}
                  />
                  <MetricTile
                    label="Regla del 1%"
                    value={formatPercent(mod.onePercentRulePct, 2)}
                    hint="Renta mensual ÷ costo de construcción."
                    badge={
                      mod.meetsOnePercentRule === null
                        ? undefined
                        : mod.meetsOnePercentRule
                          ? { text: "Cumple ≥ 1%", tone: "positive" }
                          : { text: "Por debajo del 1%", tone: "warning" }
                    }
                    tone={mod.meetsOnePercentRule ? "positive" : "neutral"}
                    onClick={() => setActiveEducation({ module: mod, metric: "one_percent" })}
                  />
                  <MetricTile
                    label="Cap Rate"
                    value={formatPercent(mod.capRatePct)}
                    hint={`NOI anual (${formatMoney(mod.noi)}) ÷ construcción.`}
                    tone={(mod.capRatePct ?? 0) >= 8 ? "positive" : "neutral"}
                    onClick={() => setActiveEducation({ module: mod, metric: "cap_rate" })}
                  />
                  <MetricTile
                    label="Ingreso Neto tras Financiamiento"
                    value={`${formatMoney(mod.monthlyCashFlow)}/mes`}
                    hint={`${formatMoney(mod.annualCashFlow)}/año tras deuda, vacancia y OpEx.`}
                    tone={mod.annualCashFlow >= 0 ? "positive" : "negative"}
                    onClick={() => setActiveEducation({ module: mod, metric: "cash_flow" })}
                  />
                  <MetricTile
                    label="Cash-on-Cash"
                    value={formatPercent(mod.cashOnCashPct)}
                    hint={`Retorno anual sobre ${formatMoney(mod.cashInvested)} en efectivo.`}
                    tone={(mod.cashOnCashPct ?? 0) >= 0 ? "positive" : "negative"}
                    onClick={() => setActiveEducation({ module: mod, metric: "cash_on_cash" })}
                  />
                </div>

                {/* Expandable Expense History */}
                <details className="group rounded-2xl border border-crema bg-white">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-xs font-bold text-azul transition hover:bg-arena/50">
                    <span>
                      Historial de gastos registrados ({mod.expenses.length})
                    </span>
                    <span className="text-piedra transition group-open:rotate-180" aria-hidden="true">
                      ▼
                    </span>
                  </summary>
                  <div className="border-t border-crema p-4">
                    {mod.expenses.length === 0 ? (
                      <p className="text-xs text-piedra">
                        Aún no hay gastos registrados para este módulo.
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {mod.expenses.map((expense) => (
                          <ExpenseRow key={expense.id} expense={expense} />
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              </article>
            );
          })}
        </section>
      )}

      {/* Educational Metric Breakdown Dialog */}
      <AdminDialog
        open={activeEducation !== null}
        onClose={() => setActiveEducation(null)}
        labelledBy={eduDialogTitleId}
        className="max-w-lg"
      >
        {activeEducation && educationContent && (
          <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white">
            <header className="flex items-start justify-between gap-3 border-b border-crema px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-turquesa">
                  {activeEducation.module.spaceName}
                </span>
                <h2 id={eduDialogTitleId} className="mt-0.5 font-display text-lg font-bold text-azul sm:text-xl">
                  {educationContent.title}
                </h2>
                <p className="mt-1 inline-flex items-center rounded-full bg-arena px-2.5 py-0.5 font-display text-xs font-bold tabular-nums text-tinta ring-1 ring-crema">
                  Valor actual: {educationContent.currentValue}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveEducation(null)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-piedra transition hover:bg-arena hover:text-tinta cursor-pointer"
                aria-label="Cerrar explicación"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              <section className="rounded-2xl border border-crema bg-arena/35 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-azul">
                  1. ¿Qué es y qué significa?
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-tinta">
                  {educationContent.meaning}
                </p>
              </section>

              <section className="rounded-2xl border border-crema bg-white p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-azul">
                  2. ¿Cómo se calcula?
                </h3>
                <div className="mt-2 rounded-xl border border-azul/15 bg-arena/45 px-3 py-2 font-mono text-xs font-semibold text-azul-oscuro break-words">
                  {educationContent.formula}
                </div>

                <dl className="mt-3 divide-y divide-crema/80 text-xs">
                  {educationContent.steps.map((step) => (
                    <div
                      key={step.label}
                      className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2 ${
                        step.highlight ? "rounded-lg bg-selva-claro/45 px-2.5 font-bold text-selva" : ""
                      }`}
                    >
                      <dt className={step.highlight ? "text-tinta" : "text-piedra"}>{step.label}</dt>
                      <dd
                        className={`font-display tabular-nums ${
                          step.highlight ? "text-sm font-bold text-selva" : "font-semibold text-tinta"
                        }`}
                      >
                        {step.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-2xl border border-maiz/35 bg-maiz-claro/35 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#734d08]">
                  3. ¿Por qué es importante?
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-tinta">
                  {educationContent.importance}
                </p>
              </section>
            </div>

            <footer className="flex justify-end border-t border-crema px-5 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={() => setActiveEducation(null)}
                className="btn-primary min-h-11 px-5 py-2 text-sm"
              >
                Entendido
              </button>
            </footer>
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
