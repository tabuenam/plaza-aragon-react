"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { StatusBadge } from "@/components/status-badge";
import {
  formatDate,
  formatMoney,
  formatPeriod,
  groupPaymentsByYear,
  MONTHS,
  shortMonth,
} from "@/lib/format";
import type { Payment, PaymentStatus } from "@/lib/types";

export type PortalPayment = Payment & {
  signedUrl?: string;
};

type ViewMode = "list" | "grid";
type StatusFilter = "all" | PaymentStatus;

const STATUS_PRIORITY: Record<PaymentStatus, number> = {
  verified: 3,
  pending: 2,
  rejected: 1,
};

function pickPrimaryPayment(list: PortalPayment[]): PortalPayment | undefined {
  if (list.length === 0) return undefined;
  return [...list].sort(
    (a, b) => STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status]
  )[0];
}

const STRIP_TONES: Record<PaymentStatus, string> = {
  verified:
    "border-selva/30 bg-selva-claro/80 text-selva hover:border-selva hover:bg-selva-claro",
  pending:
    "border-maiz/45 bg-maiz-claro/90 text-[#734d08] hover:border-maiz hover:bg-maiz-claro",
  rejected:
    "border-barro/35 bg-barro-claro/80 text-barro hover:border-barro hover:bg-barro-claro",
};

const DOT_TONES: Record<PaymentStatus, string> = {
  verified: "bg-selva",
  pending: "bg-maiz",
  rejected: "bg-barro",
};

export function PaymentHistory({
  payments,
  currentYear,
  currentMonth,
}: {
  payments: PortalPayment[];
  currentYear: number;
  currentMonth: number;
}) {
  const allYearGroups = useMemo(() => groupPaymentsByYear(payments), [payments]);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedYear, setSelectedYear] = useState<"all" | number>("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [activePayment, setActivePayment] = useState<PortalPayment | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const [openYears, setOpenYears] = useState<Record<number, boolean>>({});

  const dialogTitleId = useId();

  const yearScopedPayments = useMemo(
    () =>
      selectedYear === "all"
        ? payments
        : payments.filter((p) => p.period_year === selectedYear),
    [payments, selectedYear]
  );

  const statusCounts = useMemo(() => {
    let verified = 0;
    let pending = 0;
    let rejected = 0;
    for (const p of yearScopedPayments) {
      if (p.status === "verified") verified += 1;
      else if (p.status === "pending") pending += 1;
      else if (p.status === "rejected") rejected += 1;
    }
    return {
      all: yearScopedPayments.length,
      verified,
      pending,
      rejected,
    };
  }, [yearScopedPayments]);

  const visibleGroups = useMemo(() => {
    const filtered =
      selectedStatus === "all"
        ? yearScopedPayments
        : yearScopedPayments.filter((p) => p.status === selectedStatus);
    return groupPaymentsByYear(filtered);
  }, [yearScopedPayments, selectedStatus]);

  const hasMultipleYears = allYearGroups.length > 1;
  const isForcedOpen = selectedYear !== "all" || selectedStatus !== "all";
  const canToggleAll = !isForcedOpen && visibleGroups.length > 1;

  function isGroupOpen(
    group: (typeof visibleGroups)[number],
    idx: number
  ): boolean {
    if (isForcedOpen) return true;
    const defaultOpen =
      idx === 0 || group.pendingCount > 0 || group.rejectedCount > 0;
    return openYears[group.year] ?? defaultOpen;
  }

  const allExpanded =
    visibleGroups.length > 0 &&
    visibleGroups.every((g, idx) => isGroupOpen(g, idx));

  function handleToggleAll() {
    const nextState = !allExpanded;
    setOpenYears((prev) => {
      const updated = { ...prev };
      for (const g of visibleGroups) {
        updated[g.year] = nextState;
      }
      return updated;
    });
  }

  function handleYearToggle(
    year: number,
    isOpen: boolean,
    defaultOpen: boolean
  ) {
    setOpenYears((prev) => {
      const current = prev[year] ?? defaultOpen;
      if (current === isOpen) return prev;
      return { ...prev, [year]: isOpen };
    });
  }

  function handleJumpToPayment(paymentId: string) {
    setHighlightedId(paymentId);
    const el = document.getElementById(`payment-${paymentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    window.setTimeout(() => {
      setHighlightedId((prev) => (prev === paymentId ? null : prev));
    }, 1800);
  }

  const activeIsPdf = Boolean(
    activePayment?.receipt_path?.toLowerCase().endsWith(".pdf")
  );

  return (
    <div className="space-y-5">
      {/* ───────────── HEADER & VIEW SWITCHER ───────────── */}
      <div className="flex flex-col gap-3 border-b border-crema/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="eyebrow">Estado de Cuenta</span>
          <h2
            id="estado-de-cuenta-heading"
            className="mt-1 font-display text-xl font-bold text-azul"
          >
            Historial de Pagos Reportados
          </h2>
          <p className="mt-0.5 text-xs text-piedra">
            Consulte sus comprobantes agrupados por año y su estado de verificación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className="rounded-xl bg-arena px-3 py-1.5 font-mono text-xs font-bold text-azul ring-1 ring-crema">
            {payments.length} {payments.length === 1 ? "registro" : "registros"}
          </span>

          {payments.length > 0 && (
            <div
              role="group"
              aria-label="Modo de visualización"
              className="inline-flex rounded-xl border border-crema bg-arena p-0.5"
            >
              <button
                type="button"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-azul shadow-2xs"
                    : "text-piedra hover:text-tinta"
                }`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                Lista
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-azul shadow-2xs"
                    : "text-piedra hover:text-tinta"
                }`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
                12 Meses
              </button>
            </div>
          )}
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-crema bg-arena/40 p-10 text-center">
          <p className="font-display text-base font-bold text-tinta">
            Sin comprobantes registrados aún
          </p>
          <p className="mt-1 text-xs text-piedra">
            Utilice el formulario para subir su primer comprobante de transferencia bancaria.
          </p>
        </div>
      ) : (
        <>
          {/* ───────────── YEAR & STATUS NAVIGATION BAR ───────────── */}
          <div className="flex flex-col gap-2.5">
            {hasMultipleYears && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  role="group"
                  aria-label="Filtrar por año"
                  className="flex flex-wrap items-center gap-1.5"
                >
                  <button
                    type="button"
                    aria-pressed={selectedYear === "all"}
                    onClick={() => setSelectedYear("all")}
                    className={`min-h-8 rounded-xl px-3 py-1 text-xs font-bold transition cursor-pointer ${
                      selectedYear === "all"
                        ? "bg-azul text-white shadow-2xs"
                        : "border border-crema bg-arena/60 text-piedra hover:bg-arena hover:text-azul"
                    }`}
                  >
                    Todos ({payments.length})
                  </button>
                  {allYearGroups.map((g) => (
                    <button
                      key={g.year}
                      type="button"
                      aria-pressed={selectedYear === g.year}
                      onClick={() => {
                        setSelectedYear(g.year);
                        setOpenYears((prev) => ({ ...prev, [g.year]: true }));
                      }}
                      className={`min-h-8 rounded-xl px-3 py-1 text-xs font-bold transition cursor-pointer ${
                        selectedYear === g.year
                          ? "bg-azul text-white shadow-2xs"
                          : "border border-crema bg-arena/60 text-piedra hover:bg-arena hover:text-azul"
                      }`}
                    >
                      {g.year} ({g.payments.length})
                    </button>
                  ))}
                </div>

                {canToggleAll && (
                  <button
                    type="button"
                    aria-expanded={allExpanded}
                    onClick={handleToggleAll}
                    className="inline-flex min-h-8 items-center gap-1 rounded-xl border border-crema bg-white px-2.5 py-1 text-xs font-semibold text-azul transition hover:border-turquesa hover:bg-turquesa-claro/30 cursor-pointer"
                  >
                    {allExpanded ? "Contraer todo" : "Expandir todo"}
                  </button>
                )}
              </div>
            )}

            {(statusCounts.pending > 0 || statusCounts.rejected > 0) && (
              <div
                role="group"
                aria-label="Filtrar por estado"
                className="flex flex-wrap items-center gap-1.5"
              >
                <button
                  type="button"
                  aria-pressed={selectedStatus === "all"}
                  onClick={() => setSelectedStatus("all")}
                  className={`min-h-7 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                    selectedStatus === "all"
                      ? "bg-tinta text-white"
                      : "bg-arena text-piedra hover:text-tinta"
                  }`}
                >
                  Todos ({statusCounts.all})
                </button>
                {statusCounts.verified > 0 && (
                  <button
                    type="button"
                    aria-pressed={selectedStatus === "verified"}
                    onClick={() => setSelectedStatus("verified")}
                    className={`min-h-7 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      selectedStatus === "verified"
                        ? "bg-selva text-white"
                        : "bg-selva-claro/70 text-selva hover:bg-selva-claro"
                    }`}
                  >
                    Verificados ({statusCounts.verified})
                  </button>
                )}
                {statusCounts.pending > 0 && (
                  <button
                    type="button"
                    aria-pressed={selectedStatus === "pending"}
                    onClick={() => setSelectedStatus("pending")}
                    className={`min-h-7 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      selectedStatus === "pending"
                        ? "bg-maiz text-azul-oscuro"
                        : "bg-maiz-claro text-[#734d08] hover:bg-maiz/30"
                    }`}
                  >
                    En revisión ({statusCounts.pending})
                  </button>
                )}
                {statusCounts.rejected > 0 && (
                  <button
                    type="button"
                    aria-pressed={selectedStatus === "rejected"}
                    onClick={() => setSelectedStatus("rejected")}
                    className={`min-h-7 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      selectedStatus === "rejected"
                        ? "bg-barro text-white"
                        : "bg-barro-claro text-barro hover:bg-barro/20"
                    }`}
                  >
                    Rechazados ({statusCounts.rejected})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ───────────── YEAR-GROUPED ACCORDION LIST ───────────── */}
          {visibleGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-crema bg-arena/40 p-8 text-center">
              <p className="text-sm font-semibold text-tinta">
                No hay pagos que coincidan con el filtro seleccionado.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedYear("all");
                  setSelectedStatus("all");
                }}
                className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl border border-crema bg-white px-4 py-1.5 text-xs font-bold text-azul transition hover:border-turquesa cursor-pointer"
              >
                Mostrar todos los pagos
              </button>
            </div>
          ) : (
            <div className="year-accordion space-y-3">
              {visibleGroups.map((group, idx) => {
                const defaultOpen =
                  idx === 0 ||
                  group.pendingCount > 0 ||
                  group.rejectedCount > 0;
                const isOpen = isGroupOpen(group, idx);

                const monthMap = new Map<number, PortalPayment[]>();
                for (const p of group.payments) {
                  const arr = monthMap.get(p.period_month) ?? [];
                  arr.push(p);
                  monthMap.set(p.period_month, arr);
                }

                const coveredMonths = monthMap.size;

                return (
                  <details
                    key={group.year}
                    open={isOpen}
                    onToggle={(e) => {
                      if (!isForcedOpen) {
                        handleYearToggle(
                          group.year,
                          e.currentTarget.open,
                          defaultOpen
                        );
                      }
                    }}
                    className="group overflow-hidden rounded-2xl border border-crema bg-white shadow-2xs"
                  >
                    <summary className="flex min-h-13 cursor-pointer list-none flex-wrap items-center justify-between gap-2 bg-arena/55 px-4 py-3 transition hover:bg-arena [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-2 font-display text-base font-bold text-azul sm:text-lg">
                        <svg
                          className="h-4 w-4 shrink-0 text-piedra -rotate-90 transition-transform duration-200 group-open:rotate-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        <span>Año {group.year}</span>
                        {group.year === currentYear && (
                          <span className="rounded-full bg-turquesa-claro px-2 py-0.5 font-sans text-[10px] font-bold tracking-wide text-azul uppercase">
                            Actual
                          </span>
                        )}
                      </span>

                      <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-piedra ring-1 ring-crema">
                          {coveredMonths}{" "}
                          {coveredMonths === 1 ? "mes" : "meses"} de 12
                        </span>
                        {group.verifiedCount > 0 && (
                          <span className="rounded-full bg-selva-claro px-2.5 py-0.5 font-bold text-selva">
                            {group.verifiedCount}{" "}
                            {group.verifiedCount === 1
                              ? "verificado"
                              : "verificados"}
                          </span>
                        )}
                        {group.pendingCount > 0 && (
                          <span className="rounded-full bg-maiz-claro px-2.5 py-0.5 font-bold text-[#734d08]">
                            {group.pendingCount} en revisión
                          </span>
                        )}
                        {group.rejectedCount > 0 && (
                          <span className="rounded-full bg-barro-claro px-2.5 py-0.5 font-bold text-barro">
                            {group.rejectedCount}{" "}
                            {group.rejectedCount === 1
                              ? "rechazado"
                              : "rechazados"}
                          </span>
                        )}
                      </span>
                    </summary>

                    <div className="border-t border-crema/80">
                      {viewMode === "list" ? (
                        <div>
                          {/* 12-Month Quick Strip */}
                          <div className="border-b border-crema/70 bg-arena/25 px-3 py-2.5 sm:px-4">
                            <div className="grid grid-cols-6 gap-1 sm:grid-cols-12">
                              {MONTHS.map((monthName, idx) => {
                                const monthNum = idx + 1;
                                const entries = monthMap.get(monthNum) ?? [];
                                const primary = pickPrimaryPayment(entries);
                                const isCurrentMonth =
                                  group.year === currentYear &&
                                  monthNum === currentMonth;

                                if (!primary) {
                                  return (
                                    <span
                                      key={monthNum}
                                      title={`${monthName} ${group.year}: sin registro`}
                                      className={`flex flex-col items-center justify-center rounded-lg border py-1 text-[10px] font-semibold ${
                                        isCurrentMonth
                                          ? "border-dashed border-barro/45 bg-barro-claro/25 text-barro"
                                          : "border-crema/60 bg-white/60 text-piedra/65"
                                      }`}
                                    >
                                      <span>{shortMonth(monthNum)}</span>
                                      <span
                                        aria-hidden="true"
                                        className="mt-0.5 h-1.5 w-1.5 rounded-full bg-crema"
                                      />
                                    </span>
                                  );
                                }

                                return (
                                  <button
                                    key={monthNum}
                                    type="button"
                                    onClick={() =>
                                      handleJumpToPayment(primary.id)
                                    }
                                    title={`Ir a ${monthName} ${group.year}`}
                                    aria-label={`Ir a ${monthName} ${group.year}`}
                                    className={`flex flex-col items-center justify-center rounded-lg border py-1 text-[10px] font-bold transition cursor-pointer ${STRIP_TONES[primary.status]}`}
                                  >
                                    <span>{shortMonth(monthNum)}</span>
                                    <span
                                      aria-hidden="true"
                                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${DOT_TONES[primary.status]}`}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Compact Payment Rows */}
                          <div className="divide-y divide-crema/70">
                            {group.payments.map((payment) => {
                              const isHighlighted =
                                highlightedId === payment.id;
                              return (
                                <article
                                  key={payment.id}
                                  id={`payment-${payment.id}`}
                                  className={`flex flex-col gap-3 px-4 py-3 transition sm:flex-row sm:items-center sm:justify-between ${
                                    isHighlighted
                                      ? "bg-turquesa-claro/35 ring-2 ring-inset ring-turquesa"
                                      : "hover:bg-arena/35"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      aria-hidden="true"
                                      className="hidden h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-crema bg-arena text-center sm:flex"
                                    >
                                      <span className="text-[10px] font-bold leading-none text-azul uppercase">
                                        {shortMonth(payment.period_month)}
                                      </span>
                                      <span className="mt-0.5 font-mono text-[10px] font-semibold leading-none text-piedra">
                                        {String(payment.period_month).padStart(
                                          2,
                                          "0"
                                        )}
                                      </span>
                                    </div>

                                    <div className="min-w-0 space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-display text-sm font-bold text-tinta sm:text-base">
                                          {formatPeriod({
                                            month: payment.period_month,
                                            year: payment.period_year,
                                          })}
                                        </span>
                                        <StatusBadge status={payment.status} />
                                      </div>

                                      <p className="text-xs text-piedra">
                                        Reportado el{" "}
                                        {formatDate(payment.payment_date)} ·
                                        Monto:{" "}
                                        <span className="font-display font-bold tabular-nums text-azul">
                                          {formatMoney(payment.amount)}
                                        </span>
                                      </p>

                                      {payment.admin_note && (
                                        <div className="mt-1.5 rounded-xl border border-barro/20 bg-barro-claro/60 px-3 py-2 text-xs text-barro">
                                          <strong className="font-bold">
                                            Observación de administración:
                                          </strong>{" "}
                                          {payment.admin_note}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {payment.signedUrl && (
                                    <div className="flex items-center gap-1.5 border-t border-crema/50 pt-2 sm:shrink-0 sm:border-0 sm:pt-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActivePayment(payment)
                                        }
                                        className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-crema bg-white px-3.5 py-1.5 text-xs font-semibold text-azul shadow-2xs transition hover:border-turquesa hover:bg-turquesa-claro/40 sm:flex-initial cursor-pointer"
                                      >
                                        <span>Ver recibo</span>
                                      </button>
                                      <a
                                        href={payment.signedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Abrir recibo de ${formatPeriod({
                                          month: payment.period_month,
                                          year: payment.period_year,
                                        })} en nueva pestaña`}
                                        title="Abrir en nueva pestaña"
                                        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl border border-crema bg-arena/60 px-2 text-xs font-bold text-piedra transition hover:border-turquesa hover:bg-white hover:text-azul"
                                      >
                                        <span aria-hidden="true">↗</span>
                                      </a>
                                    </div>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* ───────────── 12-MONTH CALENDAR GRID VIEW ───────────── */
                        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 sm:p-4">
                          {MONTHS.map((monthName, idx) => {
                            const monthNum = idx + 1;
                            const entries = monthMap.get(monthNum) ?? [];
                            const primary = pickPrimaryPayment(entries);
                            const isCurrentMonth =
                              group.year === currentYear &&
                              monthNum === currentMonth;

                            if (!primary) {
                              const canReport =
                                group.year < currentYear ||
                                (group.year === currentYear &&
                                  monthNum <= currentMonth);
                              return (
                                <div
                                  key={monthNum}
                                  className={`flex flex-col justify-between rounded-xl border p-3 ${
                                    isCurrentMonth
                                      ? "border-dashed border-barro/45 bg-barro-claro/20"
                                      : "border-crema/70 bg-arena/30"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-display text-sm font-bold text-piedra">
                                        {monthName}
                                      </span>
                                      {isCurrentMonth && (
                                        <span className="rounded-full bg-barro-claro px-1.5 py-0.5 text-[9px] font-bold text-barro uppercase">
                                          Actual
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-piedra/80">
                                      Sin comprobante
                                    </p>
                                  </div>

                                  {canReport && (
                                    <a
                                      href="#registrar-pago"
                                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-barro hover:underline"
                                    >
                                      Reportar ↓
                                    </a>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <div
                                key={monthNum}
                                className="flex flex-col justify-between rounded-xl border border-crema bg-white p-3 shadow-2xs transition hover:border-turquesa/60"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-display text-sm font-bold text-tinta">
                                      {monthName}
                                    </span>
                                    {entries.length > 1 && (
                                      <span className="rounded-full bg-arena px-1.5 py-0.5 font-mono text-[10px] font-bold text-piedra">
                                        {entries.length} envíos
                                      </span>
                                    )}
                                  </div>

                                  <StatusBadge status={primary.status} />

                                  <p className="font-display text-sm font-bold tabular-nums text-azul">
                                    {formatMoney(primary.amount)}
                                  </p>
                                  <p className="text-[11px] text-piedra">
                                    {formatDate(primary.payment_date)}
                                  </p>
                                </div>

                                {primary.signedUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setActivePayment(primary)}
                                    className="mt-3 inline-flex min-h-8 w-full items-center justify-center gap-1 rounded-lg border border-crema bg-arena/50 px-2.5 py-1 text-xs font-semibold text-azul transition hover:border-turquesa hover:bg-turquesa-claro/40 cursor-pointer"
                                  >
                                    Ver recibo
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ───────────── IN-PAGE RECEIPT LIGHTBOX MODAL ───────────── */}
      <AdminDialog
        open={activePayment !== null}
        onClose={() => setActivePayment(null)}
        labelledBy={dialogTitleId}
        className="max-w-2xl"
      >
        {activePayment && (
          <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-crema px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id={dialogTitleId}
                    className="font-display text-base font-bold text-azul"
                  >
                    Comprobante ·{" "}
                    {formatPeriod({
                      month: activePayment.period_month,
                      year: activePayment.period_year,
                    })}
                  </h3>
                  <StatusBadge status={activePayment.status} />
                </div>
                <p className="mt-0.5 text-xs text-piedra">
                  Reportado el {formatDate(activePayment.payment_date)} · Monto:{" "}
                  <strong className="font-display tabular-nums text-azul">
                    {formatMoney(activePayment.amount)}
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activePayment.signedUrl && (
                  <a
                    href={activePayment.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-8 items-center rounded-lg border border-crema bg-arena/60 px-2.5 py-1 text-xs font-semibold text-azul transition hover:border-turquesa hover:bg-white"
                  >
                    Abrir original ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActivePayment(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-piedra transition hover:bg-arena hover:text-tinta cursor-pointer"
                  aria-label="Cerrar vista previa del recibo"
                >
                  ✕
                </button>
              </div>
            </div>

            {activePayment.admin_note && (
              <div className="border-b border-barro/20 bg-barro-claro/50 px-4 py-2 text-xs text-barro sm:px-5">
                <strong className="font-bold">Observación de administración:</strong>{" "}
                {activePayment.admin_note}
              </div>
            )}

            {activePayment.signedUrl && activeIsPdf ? (
              <div className="flex flex-col items-center justify-center gap-3 bg-arena/40 p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-barro-claro font-display text-sm font-bold text-barro">
                  PDF
                </span>
                <p className="text-sm font-semibold text-tinta">
                  El comprobante está en formato PDF.
                </p>
                <a
                  href={activePayment.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary min-h-10 px-4 py-2 text-xs"
                >
                  Abrir comprobante en PDF ↗
                </a>
              </div>
            ) : (
              activePayment.signedUrl && (
                <div className="relative aspect-3/4 max-h-[72vh] w-full bg-arena/45 sm:aspect-4/3">
                  <Image
                    src={activePayment.signedUrl}
                    alt={`Comprobante de pago de ${formatPeriod({
                      month: activePayment.period_month,
                      year: activePayment.period_year,
                    })}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 672px"
                    className="object-contain p-2"
                  />
                </div>
              )
            )}
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
