import { PaymentForm } from "@/app/portal/payment-form";
import { PaymentHistory } from "@/app/portal/payment-history";
import { ContractAttachmentsView } from "@/components/contract-attachments-view";
import { StatusBadge } from "@/components/status-badge";
import { requireTenant } from "@/lib/auth";
import { getTenantLeaseWithSpace, getTenantPayments } from "@/lib/data";
import { currentPeriod, daysUntil, formatDate, formatMoney, formatPeriod } from "@/lib/format";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Mi Portal",
  description: "Gestión de pagos y contrato de arrendamiento en Plaza Aragón.",
};

export default async function TenantPortalPage() {
  await connection();
  const user = await requireTenant();
  const lease = await getTenantLeaseWithSpace(user.id);

  if (!lease) {
    return (
      <div className="card py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-maiz-claro font-display text-2xl font-bold text-[#734d08]">
          !
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-azul">Sin contrato activo asignado</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-piedra">
          Su cuenta de usuario no tiene un contrato de arrendamiento activo registrado. Comuníquese con la
          administración de Plaza Aragón en Olanchito para habilitar su espacio comercial.
        </p>
      </div>
    );
  }

  const rawPayments = await getTenantPayments(lease.id);

  const paths = rawPayments.map((p) => p.receipt_path).filter(Boolean);
  const urlMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await user.supabase.storage.from("receipts").createSignedUrls(paths, 3600);
    if (signed) {
      signed.forEach((item) => {
        if (item.signedUrl && item.path) urlMap.set(item.path, item.signedUrl);
      });
    }
  }

  const payments = rawPayments.map((p) => ({
    ...p,
    signedUrl: urlMap.get(p.receipt_path),
  }));

  const cur = currentPeriod();
  const currentMonthPayment = payments.find(
    (p) => p.period_month === cur.month && p.period_year === cur.year
  );
  const remainingDays = daysUntil(lease.end_date);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ───────────── WELCOME & CURRENT PERIOD STATUS BANNER ───────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow">Arrendatario Activo · Olanchito</span>
          <h1 className="mt-1 font-display text-2xl font-bold text-azul sm:text-3xl">
            Hola, {lease.tenant?.name || "Inquilino"}
          </h1>
          <p className="mt-1 text-sm text-piedra">
            Gestione sus comprobantes de renta y consulte la documentación de <strong>{lease.space.name}</strong>.
          </p>
        </div>

        {/* Current Month Pill Card */}
        <div className="flex items-center gap-3 self-start rounded-2xl border border-crema bg-white px-4 py-3 shadow-2xs sm:self-auto">
          <div>
            <span className="block text-[10px] font-bold tracking-wider text-piedra uppercase">
              Mes en curso · {formatPeriod(cur)}
            </span>
            {currentMonthPayment ? (
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={currentMonthPayment.status} />
                <span className="text-xs font-semibold tabular-nums text-tinta">
                  {formatMoney(currentMonthPayment.amount)}
                </span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-arena px-2.5 py-0.5 text-[11px] font-bold text-piedra ring-1 ring-crema uppercase">
                  Sin comprobante este mes
                </span>
                <a href="#registrar-pago" className="text-xs font-bold text-barro hover:underline">
                  Subir ahora ↓
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────── LEASE ARCHITECTURAL CREDENTIAL CARD ───────────── */}
      <section className="card relative overflow-hidden bg-gradient-to-br from-azul-oscuro via-azul to-[#0e4d7e] text-white shadow-md">
        <div className="lenca-diamonds pointer-events-none absolute inset-0 opacity-35" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-[11px] font-bold tracking-widest text-maiz uppercase">
              CONTRATO DE ARRENDAMIENTO COMERCIAL
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              {lease.space.name}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-selva-claro px-3 py-1 text-xs font-bold text-selva uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-selva" />
              Contrato Vigente
            </span>
            {remainingDays >= 0 && (
              <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-semibold text-crema">
                {remainingDays === 0 ? "Vence hoy" : `${remainingDays} días restantes`}
              </span>
            )}
          </div>
        </div>

        <dl className="relative mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-5 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-[11px] font-semibold tracking-wider text-crema/75 uppercase">Cuota Mensual</dt>
            <dd className="mt-1 font-display text-xl font-bold tabular-nums text-maiz sm:text-2xl">
              {formatMoney(lease.monthly_rent)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold tracking-wider text-crema/75 uppercase">Inicio de Vigencia</dt>
            <dd className="mt-1 text-sm font-semibold text-white">{formatDate(lease.start_date)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold tracking-wider text-crema/75 uppercase">Fecha de Término</dt>
            <dd className="mt-1 text-sm font-semibold text-white">{formatDate(lease.end_date)}</dd>
          </div>
        </dl>

        {lease.attachments && lease.attachments.length > 0 && (
          <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/95 p-4 text-tinta">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-azul">
              Documentos Digitalizados de su Contrato
            </p>
            <ContractAttachmentsView attachments={lease.attachments} />
          </div>
        )}
      </section>

      {/* ───────────── MOBILE QUICK NAVIGATION BAR ───────────── */}
      <nav
        aria-label="Accesos rápidos del portal"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-crema bg-white p-1.5 shadow-2xs lg:hidden"
      >
        <a
          href="#registrar-pago"
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-arena px-3 py-2 text-xs font-bold text-azul transition hover:bg-turquesa-claro/40"
        >
          Registrar pago
        </a>
        <a
          href="#estado-de-cuenta"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-azul px-3 py-2 text-xs font-bold text-white transition hover:bg-azul-oscuro"
        >
          <span>Estado de cuenta</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[10px]">
            {payments.length}
          </span>
        </a>
      </nav>

      {/* ───────────── 2-COLUMN WORKSPACE: UPLOAD + HISTORY ───────────── */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Upload Payment Form */}
        <section id="registrar-pago" className="card scroll-mt-20 lg:sticky lg:top-20 lg:col-span-5">
          <div className="mb-5 border-b border-crema/80 pb-4">
            <span className="eyebrow">Reporte de Transferencia</span>
            <h2 className="mt-1 font-display text-xl font-bold text-azul">Registrar Pago de Renta</h2>
            <p className="mt-1 text-xs text-piedra sm:text-sm">
              Tome una fotografía o suba la captura de su transferencia bancaria. La imagen se optimiza
              automáticamente antes de enviarse.
            </p>
          </div>

          <PaymentForm defaultRent={lease.monthly_rent} />
        </section>

        {/* Right Column: Payment History */}
        <section id="estado-de-cuenta" className="card scroll-mt-20 lg:col-span-7">
          <PaymentHistory payments={payments} currentYear={cur.year} currentMonth={cur.month} />
        </section>
      </div>
    </div>
  );
}

