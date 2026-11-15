import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getActiveLeases, getAdminPayments, type AdminPayment } from "@/lib/data";
import {
  comparePeriods,
  currentPeriod,
  formatDate,
  formatMoney,
  formatPeriod,
  getElectricityDelinquentLeases,
  MONTHS,
  periodOfDate,
  shortMonth,
} from "@/lib/format";
import type { PaymentStatus, PaymentType } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { CreatePaymentModal } from "@/app/admin/pagos/create-payment-modal";
import { PaymentReviewCard } from "@/app/admin/pagos/payment-review-card";

export const metadata: Metadata = {
  title: "Verificación de Pagos",
  description: "Revisión y comprobación de transferencias bancarias y recibos de energía eléctrica.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const STATUS_PRIORITY: Record<PaymentStatus, number> = {
  verified: 3,
  pending: 2,
  rejected: 1,
};

function pickPrimaryPayment(list: AdminPayment[]): AdminPayment | undefined {
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status])[0];
}

function AdminPagosSkeleton() {
  return (
    <div
      className="space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Cargando verificación de pagos…"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-3.5 w-48 rounded bg-crema/70" />
          <div className="h-8 w-64 rounded-lg bg-crema/80" />
          <div className="h-4 w-72 max-w-full rounded bg-crema/60" />
        </div>
        <div className="h-10 w-44 rounded-xl bg-crema/80" />
      </div>

      <div className="card bg-white p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-36 rounded-xl bg-arena" />
          <div className="h-9 w-40 rounded-xl bg-arena" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-9 w-24 rounded-xl bg-crema/60" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card bg-white p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="h-5 w-40 rounded bg-crema/80" />
              <div className="h-6 w-24 rounded-full bg-arena" />
            </div>
            <div className="h-16 rounded-xl bg-arena/50" />
            <div className="flex gap-2">
              <div className="h-9 w-28 rounded-xl bg-crema/70" />
              <div className="h-9 w-28 rounded-xl bg-crema/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPagosPage(props: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdminPagosSkeleton />}>
      <AdminPagosContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function AdminPagosContent(props: { searchParams: SearchParams }) {
  await requireAdmin();

  const searchParams = await props.searchParams;
  const cur = currentPeriod();

  const selectedType: PaymentType = searchParams.tipo === "electricity" ? "electricity" : "rent";
  const selectedMonth = searchParams.mes ? Number(searchParams.mes) : cur.month;
  const selectedYear = searchParams.ano ? Number(searchParams.ano) : cur.year;

  const [allPayments, activeLeases] = await Promise.all([
    getAdminPayments(),
    getActiveLeases(),
  ]);

  const delinquentElectricity = getElectricityDelinquentLeases(activeLeases, allPayments, cur);
  const delinquentLeaseIds = new Set(delinquentElectricity.map((d) => d.leaseId));

  const periodPayments = allPayments.filter(
    (p) => p.period_year === selectedYear && p.period_month === selectedMonth
  );

  const rentPendingCount = periodPayments.filter(
    (p) => (p.payment_type ?? "rent") === "rent" && p.status === "pending"
  ).length;
  const electricityPendingCount = periodPayments.filter(
    (p) => p.payment_type === "electricity" && p.status === "pending"
  ).length;

  const payments = periodPayments.filter((p) => (p.payment_type ?? "rent") === selectedType);

  const pendingList = payments.filter((p) => p.status === "pending");
  const verifiedList = payments.filter((p) => p.status === "verified");
  const rejectedList = payments.filter((p) => p.status === "rejected");

  const verifiedTotal = verifiedList.reduce((acc, p) => acc + Number(p.amount), 0);
  const isElectricity = selectedType === "electricity";

  const years = Array.from(new Set([cur.year - 1, cur.year, cur.year + 1, selectedYear])).sort(
    (a, b) => a - b
  );

  const allElectricityPayments = allPayments.filter((p) => p.payment_type === "electricity");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="eyebrow">
            {isElectricity ? "Control de Servicio Eléctrico · Cuenta Separada" : "Ingresos por Arrendamiento"}
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-azul sm:text-3xl">
            Verificación de Pagos
          </h1>
          <p className="mt-1 text-sm text-piedra">
            {isElectricity
              ? `Revisión de recibos de energía eléctrica para ${formatPeriod({ month: selectedMonth, year: selectedYear })} en cuenta independiente de la renta.`
              : `Revisión y registro de comprobantes de renta para ${formatPeriod({ month: selectedMonth, year: selectedYear })}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/admin/historial?tipo=${selectedType}&ano=${selectedYear}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-crema bg-white px-3.5 py-2 text-xs font-bold text-azul shadow-2xs transition hover:bg-arena"
          >
            Historial {isElectricity ? "Eléctrico" : "Contable"} →
          </Link>
          <CreatePaymentModal
            activeLeases={activeLeases}
            defaultMonth={selectedMonth}
            defaultYear={selectedYear}
            defaultPaymentType={selectedType}
          />
        </div>
      </div>

      {delinquentElectricity.length > 0 && (
        <section
          role="alert"
          aria-labelledby="alerta-electricidad-pagos"
          className="card border-2 border-barro bg-barro-claro/30 space-y-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-barro">
                <span className="h-2 w-2 rounded-full bg-barro animate-pulse" />
                Notificación · Energía Eléctrica (3 Meses Pendientes)
              </span>
              <h2 id="alerta-electricidad-pagos" className="mt-0.5 font-display text-base font-bold text-tinta sm:text-lg">
                {delinquentElectricity.length}{" "}
                {delinquentElectricity.length === 1
                  ? "inquilino no ha subido recibo de energía en los últimos 3 meses"
                  : "inquilinos no han subido recibos de energía en los últimos 3 meses"}
              </h2>
            </div>

            {!isElectricity && (
              <Link
                href={`/admin/pagos?tipo=electricity&mes=${selectedMonth}&ano=${selectedYear}`}
                className="btn-accent min-h-11 shrink-0 px-4 py-2 text-xs self-start sm:self-auto"
              >
                Ir a Energía Eléctrica →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {delinquentElectricity.map((item) => (
              <div
                key={item.leaseId}
                className="flex flex-col justify-between gap-1.5 rounded-2xl border border-barro/25 bg-white p-3.5 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-azul">
                    {item.spaceName} · {item.tenantName}
                  </span>
                  {item.tenantContact && (
                    <span className="text-xs font-medium text-piedra">{item.tenantContact}</span>
                  )}
                </div>
                <p className="text-xs text-piedra">
                  Debe pagar y cargar recibo correspondiente a:{" "}
                  <strong className="text-barro">
                    {item.missingPeriods.map((p) => formatPeriod(p)).join(" · ")}
                  </strong>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───────────── ACCOUNT CATEGORY SWITCHER ───────────── */}
      <nav
        aria-label="Cuentas de verificación"
        className="grid grid-cols-1 gap-2 rounded-2xl border border-crema bg-white p-1.5 shadow-2xs sm:grid-cols-2"
      >
        <Link
          href={`/admin/pagos?tipo=rent&mes=${selectedMonth}&ano=${selectedYear}`}
          aria-current={!isElectricity ? "page" : undefined}
          className={`flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 ${
            !isElectricity
              ? "bg-azul text-white shadow-xs"
              : "bg-arena/50 text-tinta hover:bg-arena"
          }`}
        >
          <div className="min-w-0">
            <span className="block font-display text-sm font-bold">Cuenta de Renta Mensual</span>
            <span className={`block text-[11px] ${!isElectricity ? "text-crema/85" : "text-piedra"}`}>
              Ingresos de arrendamiento por local
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
              !isElectricity
                ? "bg-white/20 text-white"
                : rentPendingCount > 0
                  ? "bg-maiz-claro text-[#734d08]"
                  : "bg-white text-piedra ring-1 ring-crema"
            }`}
          >
            {rentPendingCount} pend.
          </span>
        </Link>

        <Link
          href={`/admin/pagos?tipo=electricity&mes=${selectedMonth}&ano=${selectedYear}`}
          aria-current={isElectricity ? "page" : undefined}
          className={`flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 ${
            isElectricity
              ? "bg-maiz text-azul-oscuro shadow-xs ring-1 ring-maiz/50"
              : "bg-arena/50 text-tinta hover:bg-arena"
          }`}
        >
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 font-display text-sm font-bold">
              <span aria-hidden="true">⚡</span>
              <span>Energía Eléctrica</span>
            </span>
            <span className={`block text-[11px] ${isElectricity ? "text-azul-oscuro/80" : "text-piedra"}`}>
              Recibos mensuales (cuenta separada)
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
              isElectricity
                ? "bg-azul-oscuro/15 text-azul-oscuro"
                : electricityPendingCount > 0 || delinquentElectricity.length > 0
                  ? "bg-barro-claro text-barro"
                  : "bg-white text-piedra ring-1 ring-crema"
            }`}
          >
            {electricityPendingCount} pend.
          </span>
        </Link>
      </nav>

      {/* ───────────── MONTH & YEAR FILTER ───────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {MONTHS.map((name, index) => {
            const m = index + 1;
            const isSelected = m === selectedMonth;
            return (
              <Link
                key={m}
                href={`/admin/pagos?tipo=${selectedType}&mes=${m}&ano=${selectedYear}`}
                className={`inline-flex min-h-9 items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-azul text-white"
                    : "bg-white text-piedra border border-crema hover:bg-crema/40"
                }`}
              >
                {name.slice(0, 3)}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          {years.map((y) => {
            const isSelected = y === selectedYear;
            return (
              <Link
                key={y}
                href={`/admin/pagos?tipo=${selectedType}&mes=${selectedMonth}&ano=${y}`}
                className={`inline-flex min-h-9 items-center rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-azul text-white"
                    : "bg-white text-piedra border border-crema hover:bg-crema/40"
                }`}
              >
                {y}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ───────────── PERIOD KPI CARDS ───────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card bg-white p-3 text-center sm:p-4">
          <p className="text-[11px] font-semibold uppercase text-piedra">Pendientes</p>
          <p className="mt-1 font-display text-xl font-bold text-[#7a5410] sm:text-2xl">
            {pendingList.length}
          </p>
        </div>
        <div className="card bg-white p-3 text-center sm:p-4">
          <p className="text-[11px] font-semibold uppercase text-piedra">Verificados</p>
          <p className="mt-1 font-display text-xl font-bold text-selva sm:text-2xl">
            {verifiedList.length}
          </p>
        </div>
        <div className="card bg-white p-3 text-center sm:p-4">
          <p className="text-[11px] font-semibold uppercase text-piedra">Rechazados</p>
          <p className="mt-1 font-display text-xl font-bold text-barro sm:text-2xl">
            {rejectedList.length}
          </p>
        </div>
        <div className="card bg-white p-3 text-center sm:p-4">
          <p className="text-[11px] font-semibold uppercase text-piedra">
            {isElectricity ? "Total Recibos Verif." : "Renta Verificada"}
          </p>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-azul sm:text-2xl">
            {formatMoney(verifiedTotal)}
          </p>
        </div>
      </div>

      {/* ───────────── VERIFICATION QUEUES ───────────── */}
      {payments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-piedra">
            {isElectricity
              ? `No se han registrado recibos de energía eléctrica para ${formatPeriod({ month: selectedMonth, year: selectedYear })}.`
              : `No se han registrado pagos de renta para ${formatPeriod({ month: selectedMonth, year: selectedYear })}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingList.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-[#7a5410]">
                Por Revisar ({pendingList.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {pendingList.map((p) => (
                  <PaymentReviewCard key={p.id} payment={p} />
                ))}
              </div>
            </div>
          )}

          {verifiedList.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-selva">
                Verificados ({verifiedList.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {verifiedList.map((p) => (
                  <PaymentReviewCard key={p.id} payment={p} />
                ))}
              </div>
            </div>
          )}

          {rejectedList.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-barro">
                Rechazados ({rejectedList.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {rejectedList.map((p) => (
                  <PaymentReviewCard key={p.id} payment={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────── PAST ELECTRICITY OVERVIEW PER TENANT / MODULE ───────────── */}
      {isElectricity && (
        <section className="card space-y-5">
          <div className="flex flex-col gap-2 border-b border-crema/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="eyebrow">Historial por Inquilino · {selectedYear}</span>
              <h2 className="mt-1 font-display text-xl font-bold text-azul">
                Resumen de Pagos de Energía Eléctrica
              </h2>
              <p className="mt-0.5 text-xs text-piedra">
                Seguimiento anual de recibos de luz por módulo arrendado (cuenta independiente de los ingresos por renta).
              </p>
            </div>
            <Link
              href={`/admin/historial?tipo=electricity&ano=${selectedYear}`}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-crema bg-arena/60 px-3.5 py-2 text-xs font-bold text-azul transition hover:bg-arena self-start sm:self-auto"
            >
              Libro anual de electricidad →
            </Link>
          </div>

          {activeLeases.length === 0 ? (
            <p className="py-6 text-center text-sm text-piedra">
              No hay contratos activos registrados en este momento.
            </p>
          ) : (
            <div className="space-y-4">
              {activeLeases.map((lease) => {
                const leasePaymentsAll = allElectricityPayments.filter((p) => p.lease_id === lease.id);
                const leaseYearPayments = leasePaymentsAll.filter((p) => p.period_year === selectedYear);
                const recentPastPayments =
                  leaseYearPayments.length > 0 ? leaseYearPayments : leasePaymentsAll.slice(0, 6);

                const yearVerifiedAmount = leaseYearPayments
                  .filter((p) => p.status === "verified")
                  .reduce((sum, p) => sum + Number(p.amount), 0);

                const isDelinquent = delinquentLeaseIds.has(lease.id);
                const startPeriod = periodOfDate(lease.start_date);
                const endPeriod = periodOfDate(lease.end_date);

                const monthMap = new Map<number, AdminPayment[]>();
                for (const p of leaseYearPayments) {
                  const arr = monthMap.get(p.period_month) ?? [];
                  arr.push(p);
                  monthMap.set(p.period_month, arr);
                }

                return (
                  <article
                    key={lease.id}
                    className={`rounded-2xl border p-4 space-y-4 ${
                      isDelinquent ? "border-barro/45 bg-barro-claro/15" : "border-crema bg-arena/30"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-bold text-azul sm:text-lg">
                            {lease.space.name}
                          </h3>
                          {isDelinquent ? (
                            <span className="rounded-full bg-barro-claro px-2.5 py-0.5 text-[10px] font-bold text-barro uppercase">
                              Sin recibo últimos 3 meses
                            </span>
                          ) : (
                            <span className="rounded-full bg-selva-claro px-2.5 py-0.5 text-[10px] font-bold text-selva uppercase">
                              Seguimiento activo
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-tinta">{lease.tenant.name}</p>
                        {lease.tenant.contact_info && (
                          <p className="text-xs text-piedra">Contacto: {lease.tenant.contact_info}</p>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-[11px] font-semibold uppercase text-piedra">
                          Verificado en luz ({selectedYear})
                        </p>
                        <p className="font-display text-lg font-bold tabular-nums text-azul">
                          {formatMoney(yearVerifiedAmount)}
                        </p>
                        <p className="text-[11px] text-piedra">
                          {leaseYearPayments.length}{" "}
                          {leaseYearPayments.length === 1 ? "recibo" : "recibos"} en {selectedYear}
                        </p>
                      </div>
                    </div>

                    {/* 12-Month Compliance Strip */}
                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
                      {MONTHS.map((monthName, idx) => {
                        const m = idx + 1;
                        const slotPeriod = { month: m, year: selectedYear };
                        const primary = pickPrimaryPayment(monthMap.get(m) ?? []);
                        const outsideContract =
                          comparePeriods(slotPeriod, startPeriod) < 0 ||
                          comparePeriods(slotPeriod, endPeriod) > 0;
                        const isFuture = comparePeriods(slotPeriod, cur) > 0;

                        let pillClass = "border-crema/70 bg-white/70 text-piedra";
                        let dotClass = "bg-crema";
                        let statusTitle = "Sin recibo";

                        if (primary) {
                          if (primary.status === "verified") {
                            pillClass = "border-selva/35 bg-selva-claro/80 text-selva";
                            dotClass = "bg-selva";
                            statusTitle = `Verificado (${formatMoney(primary.amount)})`;
                          } else if (primary.status === "pending") {
                            pillClass = "border-maiz/50 bg-maiz-claro text-[#734d08]";
                            dotClass = "bg-maiz";
                            statusTitle = `En revisión (${formatMoney(primary.amount)})`;
                          } else {
                            pillClass = "border-barro/40 bg-barro-claro text-barro";
                            dotClass = "bg-barro";
                            statusTitle = "Rechazado";
                          }
                        } else if (outsideContract || isFuture) {
                          pillClass = "border-crema/50 bg-arena/40 text-piedra/50";
                          dotClass = "bg-crema/70";
                          statusTitle = outsideContract ? "Fuera de vigencia" : "Mes futuro";
                        } else {
                          pillClass = "border-dashed border-barro/45 bg-white text-barro";
                          dotClass = "bg-barro/60";
                          statusTitle = "Sin recibo cargado";
                        }

                        return (
                          <Link
                            key={m}
                            href={`/admin/pagos?tipo=electricity&mes=${m}&ano=${selectedYear}`}
                            title={`${monthName} ${selectedYear}: ${statusTitle}`}
                            className={`flex flex-col items-center justify-center rounded-lg border py-1.5 text-[10px] font-bold transition hover:brightness-95 ${pillClass}`}
                          >
                            <span>{shortMonth(m)}</span>
                            <span aria-hidden="true" className={`mt-0.5 h-1.5 w-1.5 rounded-full ${dotClass}`} />
                          </Link>
                        );
                      })}
                    </div>

                    {/* Past Electricity Payments List */}
                    {recentPastPayments.length > 0 ? (
                      <div className="divide-y divide-crema/70 overflow-hidden rounded-xl border border-crema bg-white">
                        {recentPastPayments.map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-col gap-2 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display text-xs font-bold text-tinta sm:text-sm">
                                {formatPeriod({ month: p.period_month, year: p.period_year })}
                              </span>
                              <StatusBadge status={p.status} />
                              <span className="text-[11px] text-piedra">
                                Subido: {formatDate(p.payment_date)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                              <span className="font-display text-sm font-bold tabular-nums text-azul">
                                {formatMoney(p.amount)}
                              </span>
                              {p.signed_receipt_url && (
                                <a
                                  href={p.signed_receipt_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-8 items-center rounded-lg border border-crema bg-arena/60 px-2.5 py-1 text-xs font-semibold text-azul transition hover:border-turquesa hover:bg-turquesa-claro/40"
                                >
                                  Ver recibo ↗
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-crema bg-white/80 px-4 py-3 text-xs text-piedra">
                        Este inquilino aún no ha registrado recibos de energía eléctrica.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
