"use client";

import { useState } from "react";
import type { AdminPayment } from "@/lib/data";
import { formatDate, formatMoney, formatPeriod } from "@/lib/format";
import type { PaymentType } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export type SpaceColorConfig = {
  key: string;
  barClass: string;
  dotClass: string;
  borderClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
};

export type SpacePaymentGroup = {
  spaceId: string;
  spaceName: string;
  tenantNames: string[];
  color: SpaceColorConfig;
  verifiedTotal: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  payments: AdminPayment[];
};

export function SpacePaymentsAccordion({
  groups,
  selectedYear,
  totalPaymentsCount,
  paymentType = "rent",
}: {
  groups: SpacePaymentGroup[];
  selectedYear: number;
  totalPaymentsCount: number;
  paymentType?: PaymentType;
}) {
  const isElectricity = paymentType === "electricity";
  // All space groups start collapsed by default for a compact overview.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const allExpanded =
    groups.length > 0 && groups.every((g) => Boolean(openMap[g.spaceId]));

  function handleToggleAll() {
    const nextState = !allExpanded;
    const updated: Record<string, boolean> = {};
    for (const g of groups) {
      updated[g.spaceId] = nextState;
    }
    setOpenMap(updated);
  }

  function handleGroupToggle(spaceId: string, isOpen: boolean) {
    setOpenMap((prev) =>
      Boolean(prev[spaceId]) === isOpen ? prev : { ...prev, [spaceId]: isOpen }
    );
  }

  return (
    <section className="defer-section card p-0 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-crema bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-azul">
            {isElectricity ? "Registro de Recibos · Energía Eléctrica" : "Libro de Entradas · Renta"}
          </h2>
          <p className="text-xs text-piedra">
            {isElectricity
              ? `Listado detallado de recibos eléctricos agrupados por local (${totalPaymentsCount} ${totalPaymentsCount === 1 ? "registro" : "registros"}).`
              : `Listado detallado de transferencias de renta agrupadas por local (${totalPaymentsCount} ${totalPaymentsCount === 1 ? "registro" : "registros"}).`}
          </p>
        </div>

        {groups.length > 0 && (
          <button
            type="button"
            aria-expanded={allExpanded}
            onClick={handleToggleAll}
            className="inline-flex min-h-9 self-start sm:self-auto items-center gap-1.5 rounded-xl border border-crema bg-arena/50 px-3 py-1.5 text-xs font-semibold text-azul transition hover:border-turquesa hover:bg-turquesa-claro/30 cursor-pointer"
          >
            {allExpanded ? "Contraer todo" : "Expandir todo"}
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="p-12 text-center text-sm text-piedra">
          {isElectricity
            ? `No hay recibos de energía eléctrica registrados para el año ${selectedYear}.`
            : `No hay registros de transferencias de renta para el año ${selectedYear}.`}
        </div>
      ) : (
        <div className="year-accordion space-y-3 p-4 sm:p-5">
          {groups.map((group) => {
            const isOpen = Boolean(openMap[group.spaceId]);
            const tenantLabel =
              group.tenantNames.length > 0
                ? group.tenantNames.join(", ")
                : "Sin nombre";

            return (
              <details
                key={group.spaceId}
                open={isOpen}
                onToggle={(e) =>
                  handleGroupToggle(group.spaceId, e.currentTarget.open)
                }
                className="group overflow-hidden rounded-2xl border border-crema bg-white shadow-2xs"
              >
                <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center justify-between gap-3 bg-arena/55 px-4 py-3 transition hover:bg-arena [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 items-center gap-2.5">
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
                    <span
                      aria-hidden="true"
                      className={`h-3 w-3 shrink-0 rounded-full ${group.color.dotClass}`}
                    />
                    <div className="min-w-0">
                      <span className="block font-display text-base font-bold text-tinta sm:text-lg">
                        {group.spaceName}
                      </span>
                      <span className="block truncate text-xs text-piedra">
                        Inquilino: <strong className="font-semibold text-tinta">{tenantLabel}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pl-6 sm:pl-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
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
                    </div>

                    <span className="font-display text-base font-bold tabular-nums text-tinta sm:text-lg">
                      {formatMoney(group.verifiedTotal)}
                    </span>
                  </div>
                </summary>

                <div className="divide-y divide-crema/70 border-t border-crema/80">
                  {group.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-arena/30 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm font-bold text-tinta sm:text-base">
                            {formatPeriod({
                              month: p.period_month,
                              year: p.period_year,
                            })}
                          </span>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-xs text-tinta">
                          Inquilino:{" "}
                          <span className="font-semibold">
                            {p.lease?.tenant?.name || "Sin nombre"}
                          </span>
                        </p>
                        <p className="text-[11px] text-piedra">
                          Fecha de pago: {formatDate(p.payment_date)}
                          {p.reviewed_at &&
                            ` · ${p.status === "rejected" ? "Revisado el" : "Verificado el"} ${formatDate(p.reviewed_at)}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t border-crema/40 sm:border-0">
                        <div className="text-left sm:text-right">
                          <p className="font-display text-lg font-bold tabular-nums text-tinta">
                            {formatMoney(p.amount)}
                          </p>
                        </div>

                        {p.signed_receipt_url && (
                          <a
                            href={p.signed_receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-crema bg-white px-3.5 py-1.5 text-xs font-semibold text-azul shadow-2xs transition hover:border-turquesa hover:bg-turquesa-claro/40"
                          >
                            Comprobante ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
