import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminPayments } from "@/lib/data";
import { currentPeriod, formatDate, formatMoney, formatPeriod, MONTHS } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Historial Contable",
  description: "Libro histórico de pagos y transferencias en Plaza Aragón.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminHistorialPage(props: { searchParams: SearchParams }) {
  await connection();
  await requireAdmin();

  const searchParams = await props.searchParams;
  const cur = currentPeriod();
  const selectedYear = searchParams.ano ? Number(searchParams.ano) : cur.year;

  const payments = await getAdminPayments(selectedYear);

  const totalVerified = payments
    .filter((p) => p.status === "verified")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const monthlyTotals = MONTHS.map((name, idx) => {
    const monthNumber = idx + 1;
    const verifiedSum = payments
      .filter((p) => p.period_month === monthNumber && p.status === "verified")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { monthNumber, shortName: name.slice(0, 3), name, verifiedSum };
  });

  const maxMonthTotal = Math.max(...monthlyTotals.map((m) => m.verifiedSum), 1);

  const years = [cur.year - 1, cur.year, cur.year + 1];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow">Control Financiero · HNL</span>
          <h1 className="mt-1 font-display text-2xl font-bold text-azul sm:text-3xl">
            Historial Contable Anual · {selectedYear}
          </h1>
          <p className="mt-1 text-sm text-piedra">
            Registro cronológico de cobros e ingresos verificados por arrendamiento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {years.map((y) => (
            <Link
              key={y}
              href={`/admin/historial?ano=${y}`}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                y === selectedYear
                  ? "bg-azul text-white shadow-2xs"
                  : "bg-white text-piedra border border-crema hover:bg-crema/40"
              }`}
            >
              Año {y}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">
            Total Recaudado ({selectedYear})
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-selva sm:text-3xl">
            {formatMoney(totalVerified)}
          </p>
          <p className="mt-1 text-xs text-piedra">Pagos con comprobante verificado</p>
        </div>

        <div className="card bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">
            En Revisión ({selectedYear})
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-[#734d08] sm:text-3xl">
            {formatMoney(totalPending)}
          </p>
          <p className="mt-1 text-xs text-piedra">Transferencias pendientes de validar</p>
        </div>

        <div className="card bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">
            Transacciones Registradas
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-azul sm:text-3xl">
            {payments.length}
          </p>
          <p className="mt-1 text-xs text-piedra">Comprobantes procesados en el período</p>
        </div>
      </div>

      {/* ───────────── 12-MONTH REVENUE CHART ───────────── */}
      <section className="card">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-azul">
              Recaudación Mensual Verificada · {selectedYear}
            </h2>
            <p className="text-xs text-piedra">
              Toque cualquier mes para revisar sus comprobantes en el módulo de verificación.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-12">
          {monthlyTotals.map((m) => {
            const pct = m.verifiedSum > 0 ? Math.max(14, Math.round((m.verifiedSum / maxMonthTotal) * 100)) : 4;
            return (
              <Link
                key={m.monthNumber}
                href={`/admin/pagos?mes=${m.monthNumber}&ano=${selectedYear}`}
                title={`${m.name} ${selectedYear}: ${formatMoney(m.verifiedSum)}`}
                className="group flex flex-col items-center rounded-xl border border-crema/70 bg-arena/40 p-2 transition hover:border-azul/30 hover:bg-white"
              >
                <div className="flex h-20 w-full items-end justify-center rounded-lg bg-arena p-1">
                  <div
                    className={`w-full rounded-md transition-all ${
                      m.verifiedSum > 0
                        ? "bg-azul group-hover:bg-selva"
                        : "bg-crema"
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="mt-1.5 font-mono text-[10px] font-bold uppercase text-tinta">
                  {m.shortName}
                </span>
                <span className="text-[10px] font-semibold tabular-nums text-piedra">
                  {m.verifiedSum > 0 ? `L ${(m.verifiedSum / 1000).toFixed(1)}k` : "—"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="defer-section card p-0 overflow-hidden">
        <div className="p-5 border-b border-crema bg-white">
          <h2 className="font-display text-lg font-bold text-azul">Libro de Entradas</h2>
          <p className="text-xs text-piedra">Listado detallado de todas las transferencias registradas.</p>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-sm text-piedra">
            No hay registros de transferencias para el año {selectedYear}.
          </div>
        ) : (
          <div className="divide-y divide-crema">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-arena/30 transition"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-bold text-tinta">
                      {p.lease?.space?.name || "Local"}
                    </span>
                    <span className="text-xs text-piedra">·</span>
                    <span className="text-xs font-semibold text-azul">
                      {formatPeriod({ month: p.period_month, year: p.period_year })}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-tinta">
                    Inquilino: <span className="font-semibold">{p.lease?.tenant?.name || "Sin nombre"}</span>
                  </p>
                  <p className="text-[11px] text-piedra">
                    Fecha de pago: {formatDate(p.payment_date)}
                    {p.reviewed_at && ` · Verificado el ${formatDate(p.reviewed_at)}`}
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
        )}
      </section>
    </div>
  );
}

