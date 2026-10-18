import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminPayments, getAllSpacesWithActiveLease } from "@/lib/data";
import { currentPeriod, formatMoney, formatPeriod } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { PaymentReviewCard } from "@/app/admin/pagos/payment-review-card";
import { SpaceStatusForm } from "@/app/admin/space-status-form";
import { EditSpaceModal } from "@/app/admin/edit-space-modal";

export const metadata: Metadata = {
  title: "Administración",
  description: "Panel general de control y ocupación de Plaza Aragón.",
};

export default async function AdminOverviewPage() {
  await connection();
  await requireAdmin();

  const cur = currentPeriod();
  const [spaces, currentMonthPayments] = await Promise.all([
    getAllSpacesWithActiveLease(),
    getAdminPayments(cur.year, cur.month),
  ]);

  const occupiedCount = spaces.filter((s) => s.status === "occupied").length;
  const constructionCount = spaces.filter((s) => s.status === "construction").length;
  const availableCount = spaces.filter((s) => s.status === "available").length;

  const pendingPayments = currentMonthPayments.filter((p) => p.status === "pending");
  const verifiedPayments = currentMonthPayments.filter((p) => p.status === "verified");
  const verifiedAmount = verifiedPayments.reduce((acc, p) => acc + Number(p.amount), 0);

  const expectedMonthlyRent = spaces.reduce(
    (acc, s) => acc + (s.current_lease ? Number(s.current_lease.monthly_rent) : 0),
    0
  );
  const collectionPercent =
    expectedMonthlyRent > 0 ? Math.min(100, Math.round((verifiedAmount / expectedMonthlyRent) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">Resumen Operativo · Plaza Aragón</span>
          <h1 className="mt-1 font-display text-2xl font-bold text-azul sm:text-3xl">
            Panel de Control · {formatPeriod(cur)}
          </h1>
          <p className="mt-1 text-sm text-piedra">
            Estado de ocupación de los {spaces.length} locales comerciales y flujo de caja del mes en curso.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/pagos"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-crema bg-white px-3.5 py-2 text-xs font-bold text-azul shadow-2xs transition hover:bg-arena"
          >
            Revisar pagos ({pendingPayments.length})
          </Link>
          <Link
            href="/admin/contratos"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-azul px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-azul-oscuro"
          >
            Contratos e Inquilinos →
          </Link>
        </div>
      </div>

      {/* ───────────── EXECUTIVE KPI CARDS ───────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex flex-col justify-between bg-white p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">Ocupación de Plaza</p>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="font-display text-2xl font-bold tabular-nums text-azul sm:text-3xl">
                {occupiedCount} / {spaces.length}
              </p>
              <span className="text-xs font-semibold text-selva">
                {spaces.length > 0 ? Math.round((occupiedCount / spaces.length) * 100) : 0}% activos
              </span>
            </div>
          </div>
          <p className="mt-3 border-t border-crema/70 pt-2.5 text-xs text-piedra">
            {availableCount} disponible(s) · {constructionCount} en preventa/obra
          </p>
        </div>

        <div className="card flex flex-col justify-between bg-white p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">Disponibles Hoy</p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-selva sm:text-3xl">
              {availableCount}
            </p>
          </div>
          <p className="mt-3 border-t border-crema/70 pt-2.5 text-xs text-piedra">
            {constructionCount > 0
              ? `+ ${constructionCount} módulo(s) en etapa constructiva`
              : "Listos para entrega inmediata"}
          </p>
        </div>

        <div className="card flex flex-col justify-between bg-white p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">Por Verificar</p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-[#734d08] sm:text-3xl">
              {pendingPayments.length}
            </p>
          </div>
          <p className="mt-3 border-t border-crema/70 pt-2.5 text-xs text-piedra">
            {pendingPayments.length === 0
              ? "✓ Todos los recibos al día"
              : "Transferencias esperando validación"}
          </p>
        </div>

        <div className="card flex flex-col justify-between bg-white p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">Recaudado ({formatPeriod(cur)})</p>
              <span className="font-mono text-[11px] font-bold text-selva">{collectionPercent}%</span>
            </div>
            <p className="mt-2 font-display text-xl font-bold tabular-nums text-azul sm:text-2xl">
              {formatMoney(verifiedAmount)}
            </p>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-arena">
              <div
                className="h-full rounded-full bg-selva transition-all duration-300"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
          </div>
          <p className="mt-2.5 text-xs text-piedra">
            Meta activa: <strong className="text-tinta">{formatMoney(expectedMonthlyRent)}</strong>
          </p>
        </div>
      </section>

      {pendingPayments.length > 0 && (
        <section className="card border-2 border-maiz bg-maiz-claro/25 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#734d08]">
                <span className="h-2 w-2 rounded-full bg-maiz animate-pulse" />
                Atención Requerida
              </span>
              <h2 className="font-display text-lg font-bold text-tinta">
                Comprobantes pendientes de revisión ({pendingPayments.length})
              </h2>
              <p className="text-xs text-piedra">
                Verifique o rechace los depósitos bancarios enviados por los inquilinos en {formatPeriod(cur)}.
              </p>
            </div>
            <Link
              href="/admin/pagos"
              className="self-start rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-azul shadow-2xs ring-1 ring-crema hover:bg-arena sm:self-auto"
            >
              Ir a módulo de pagos →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pendingPayments.map((payment) => (
              <PaymentReviewCard key={payment.id} payment={payment} />
            ))}
          </div>
        </section>
      )}

      {/* ───────────── SPACES OVERVIEW & QUICK EDITOR ───────────── */}
      <section className="card space-y-6">
        <div className="flex flex-col gap-3 border-b border-crema/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="eyebrow">Catálogo e Inquilinos</span>
            <h2 className="mt-1 font-display text-xl font-bold text-azul">
              Administración de Locales Comerciales
            </h2>
            <p className="mt-0.5 text-xs text-piedra">
              Actualice precios base, estado comercial, fotografías de vitrina y supervise qué arrendatario ocupa cada unidad.
            </p>
          </div>
          <Link
            href="/admin/contratos"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-azul/20 bg-azul/10 px-4 py-2 text-xs font-bold text-azul transition hover:bg-azul/20 active:scale-95 self-start sm:self-auto"
          >
            Gestionar Contratos →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="flex flex-col justify-between rounded-2xl border border-crema bg-arena/40 p-4 transition hover:bg-white hover:shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold tracking-wider text-piedra uppercase">
                      MÓDULO 0{space.sort_order}
                    </span>
                    <h3 className="font-display text-lg font-bold text-tinta truncate">{space.name}</h3>
                  </div>
                  <StatusBadge status={space.status} />
                </div>

                <div className="mt-3 space-y-2 text-xs text-piedra">
                  <div className="flex items-baseline justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-crema/80">
                    <span className="font-semibold text-piedra">Precio lista:</span>
                    <span className="font-display text-sm font-bold tabular-nums text-azul">
                      {formatMoney(space.price)}/mes
                    </span>
                  </div>

                  {space.description && (
                    <p className="line-clamp-2 text-xs text-piedra/90 leading-relaxed">{space.description}</p>
                  )}

                  {space.current_lease ? (
                    <div className="rounded-xl border border-selva/25 bg-selva-claro/25 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-selva">
                          ● Arrendatario Activo
                        </span>
                        <Link
                          href="/admin/contratos"
                          className="text-[11px] font-bold text-azul hover:underline"
                        >
                          Ficha →
                        </Link>
                      </div>
                      <p className="font-display text-sm font-bold text-tinta">
                        {space.current_lease.tenant.name}
                      </p>
                      <p className="text-piedra">
                        Contacto: {space.current_lease.tenant.contact_info || "Sin teléfono"}
                      </p>
                      <p className="font-semibold tabular-nums text-azul">
                        Renta pactada: {formatMoney(space.current_lease.monthly_rent)}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-crema bg-white/70 p-3 space-y-1">
                      <p className="text-xs font-medium text-piedra">Sin contrato vigente asignado</p>
                      <Link
                        href="/admin/contratos"
                        className="inline-block text-[11px] font-bold text-azul hover:underline"
                      >
                        + Crear contrato para este local
                      </Link>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-crema/60 pt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-piedra">
                    <span className="h-1.5 w-1.5 rounded-full bg-turquesa" />
                    {space.image_urls?.length === 1
                      ? "1 fotografía en catálogo"
                      : `${space.image_urls?.length ?? 0} fotografías en catálogo`}
                  </span>
                  <EditSpaceModal space={space} />
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

