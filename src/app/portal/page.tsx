import type { Metadata } from "next";
import { requireTenant } from "@/lib/auth";
import { getTenantLeaseWithSpace, getTenantPayments } from "@/lib/data";
import { formatDate, formatMoney, formatPeriod } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { PaymentForm } from "@/app/portal/payment-form";

export const metadata: Metadata = {
  title: "Mi Portal",
  description: "Gestión de pagos y contrato de arrendamiento en Plaza Aragón.",
};

export default async function TenantPortalPage() {
  const user = await requireTenant();
  const lease = await getTenantLeaseWithSpace(user.id);

  if (!lease) {
    return (
      <div className="card text-center py-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-maiz-claro text-maiz font-bold text-2xl">
          !
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-azul">Sin contrato activo asignado</h1>
        <p className="mt-2 text-sm text-piedra max-w-md mx-auto">
          Su cuenta de usuario no tiene un contrato de arrendamiento activo registrado. Por favor comuníquese con la administración de Plaza Aragón para habilitar su espacio comercial.
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-azul sm:text-3xl">
          Bienvenido, {lease.tenant?.name || "Inquilino"}
        </h1>
        <p className="mt-1 text-sm text-piedra">
          Consulte los detalles de su arrendamiento y registre sus comprobantes de pago.
        </p>
      </div>

      <section className="card bg-gradient-to-br from-white to-arena/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-piedra">Espacio Arrendado</span>
            <h2 className="font-display text-2xl font-bold text-azul">{lease.space.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-selva-claro px-3 py-1 text-xs font-bold text-selva uppercase">
              ● Contrato Vigente
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-crema pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-piedra uppercase">Renta mensual</p>
            <p className="mt-1 font-display text-xl font-bold text-azul">{formatMoney(lease.monthly_rent)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-piedra uppercase">Inicio de contrato</p>
            <p className="mt-1 text-sm font-semibold text-tinta">{formatDate(lease.start_date)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-piedra uppercase">Finalización de contrato</p>
            <p className="mt-1 text-sm font-semibold text-tinta">{formatDate(lease.end_date)}</p>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold text-azul">Registrar Pago del Mes</h2>
          <p className="mt-1 text-xs text-piedra sm:text-sm">
            Suba la captura o fotografía del comprobante de transferencia bancaria para validación.
          </p>
        </div>

        <PaymentForm defaultRent={lease.monthly_rent} />
      </section>

      <section className="card">
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold text-azul">Historial de Pagos</h2>
          <p className="mt-1 text-xs text-piedra sm:text-sm">
            Registro histórico de sus mensualidades reportadas y su estado de verificación.
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-crema p-8 text-center">
            <p className="text-sm text-piedra">Aún no tiene registros de pago enviados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-3 rounded-2xl border border-crema bg-arena/30 p-4 transition sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-bold text-tinta">
                      {formatPeriod({ month: payment.period_month, year: payment.period_year })}
                    </span>
                    <StatusBadge status={payment.status} />
                  </div>
                  <p className="text-xs text-piedra">
                    Enviado el {formatDate(payment.payment_date)} · Monto:{" "}
                    <span className="font-semibold text-tinta">{formatMoney(payment.amount)}</span>
                  </p>
                  {payment.admin_note && (
                    <p className="mt-1 rounded-lg bg-barro-claro/50 px-2.5 py-1 text-xs text-barro">
                      Nota de administración: {payment.admin_note}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  {payment.signedUrl && (
                    <a
                      href={payment.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-crema bg-white px-3.5 py-1.5 text-xs font-semibold text-azul transition hover:bg-turquesa-claro hover:border-turquesa"
                    >
                      Ver comprobante ↗
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
