import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminPayments } from "@/lib/data";
import { currentPeriod, formatPeriod, MONTHS } from "@/lib/format";
import { PaymentReviewCard } from "@/components/payment-review-card";

export const metadata: Metadata = {
  title: "Verificación de Pagos",
  description: "Revisión y comprobación de transferencias bancarias de inquilinos.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminPagosPage(props: { searchParams: SearchParams }) {
  await requireAdmin();

  const searchParams = await props.searchParams;
  const cur = currentPeriod();

  const selectedMonth = searchParams.mes ? Number(searchParams.mes) : cur.month;
  const selectedYear = searchParams.ano ? Number(searchParams.ano) : cur.year;

  const payments = await getAdminPayments(selectedYear, selectedMonth);

  const pendingList = payments.filter((p) => p.status === "pending");
  const verifiedList = payments.filter((p) => p.status === "verified");
  const rejectedList = payments.filter((p) => p.status === "rejected");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-azul sm:text-3xl">
            Verificación de Pagos
          </h1>
          <p className="mt-1 text-sm text-piedra">
            Revisión de comprobantes transferidos para {formatPeriod({ month: selectedMonth, year: selectedYear })}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {MONTHS.map((name, index) => {
            const m = index + 1;
            const isSelected = m === selectedMonth;
            return (
              <Link
                key={m}
                href={`/admin/pagos?mes=${m}&ano=${selectedYear}`}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
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
      </div>

      <div className="grid grid-cols-3 gap-3">
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
      </div>

      {payments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-piedra">
            No se han registrado pagos para {formatPeriod({ month: selectedMonth, year: selectedYear })}.
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
    </div>
  );
}
