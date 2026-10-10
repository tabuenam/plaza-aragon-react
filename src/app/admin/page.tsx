import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminPayments, getAllSpacesWithActiveLease } from "@/lib/data";
import { currentPeriod, formatMoney, formatPeriod } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { PaymentReviewCard } from "@/components/payment-review-card";
import { SpaceStatusForm } from "@/components/space-status-form";

export const metadata: Metadata = {
  title: "Administración",
  description: "Panel general de control y ocupación de Plaza Aragón.",
};

export default async function AdminOverviewPage() {
  await requireAdmin();

  const cur = currentPeriod();
  const spaces = await getAllSpacesWithActiveLease();
  const currentMonthPayments = await getAdminPayments(cur.year, cur.month);

  const occupiedCount = spaces.filter((s) => s.status === "occupied").length;
  const constructionCount = spaces.filter((s) => s.status === "construction").length;
  const availableCount = spaces.filter((s) => s.status === "available").length;

  const pendingPayments = currentMonthPayments.filter((p) => p.status === "pending");
  const verifiedPayments = currentMonthPayments.filter((p) => p.status === "verified");
  const verifiedAmount = verifiedPayments.reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-azul sm:text-3xl">
          Panel de Control · {formatPeriod(cur)}
        </h1>
        <p className="mt-1 text-sm text-piedra">
          Resumen de ocupación de locales y pagos correspondientes al mes en curso.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Locales Totales</p>
          <p className="mt-2 font-display text-2xl font-bold text-azul sm:text-3xl">{spaces.length}</p>
          <p className="mt-1 text-xs text-piedra">{occupiedCount} ocupados · {constructionCount} en obra</p>
        </div>

        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Disponibles</p>
          <p className="mt-2 font-display text-2xl font-bold text-selva sm:text-3xl">{availableCount}</p>
          <p className="mt-1 text-xs text-piedra">Listos para arrendar</p>
        </div>

        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Por Verificar</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#7a5410] sm:text-3xl">
            {pendingPayments.length}
          </p>
          <p className="mt-1 text-xs text-piedra">Comprobantes pendientes</p>
        </div>

        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Recaudado este mes</p>
          <p className="mt-2 font-display text-xl font-bold text-azul sm:text-2xl">
            {formatMoney(verifiedAmount)}
          </p>
          <p className="mt-1 text-xs text-piedra">{verifiedPayments.length} pagos verificados</p>
        </div>
      </section>

      {pendingPayments.length > 0 && (
        <section className="card border-2 border-maiz bg-maiz-claro/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[#7a5410]">
                Comprobantes pendientes de revisión ({pendingPayments.length})
              </h2>
              <p className="text-xs text-piedra">
                Verifique los depósitos de los inquilinos para el mes de {formatPeriod(cur)}.
              </p>
            </div>
            <Link
              href="/admin/pagos"
              className="text-xs font-bold text-azul hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pendingPayments.map((payment) => (
              <PaymentReviewCard key={payment.id} payment={payment} />
            ))}
          </div>
        </section>
      )}

      <section className="card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-azul">Estado de los 5 Locales</h2>
            <p className="mt-0.5 text-xs text-piedra">
              Supervisión de inquilinos actuales y configuración de disponibilidad.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="flex flex-col justify-between rounded-2xl border border-crema bg-arena/40 p-4 transition hover:bg-white"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-tinta">{space.name}</h3>
                  <StatusBadge status={space.status} />
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-piedra">
                  <p>
                    <span className="font-semibold text-tinta">Precio base:</span> {formatMoney(space.price)}
                  </p>
                  {space.current_lease ? (
                    <div className="rounded-xl bg-white p-2.5 border border-crema space-y-1">
                      <p className="font-semibold text-azul">Inquilino actual:</p>
                      <p className="text-tinta font-medium">{space.current_lease.tenant.name}</p>
                      <p className="text-piedra">Tel: {space.current_lease.tenant.contact_info || "Sin número"}</p>
                      <p className="text-azul font-semibold">
                        Renta pactada: {formatMoney(space.current_lease.monthly_rent)}
                      </p>
                    </div>
                  ) : (
                    <p className="italic text-piedra">Sin contrato activo actualmente</p>
                  )}
                </div>
              </div>

              <SpaceStatusForm space={space} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
