"use client";

import { useState } from "react";
import Image from "next/image";
import { verifyPaymentAction, rejectPaymentAction } from "@/app/admin/actions";
import { useAdminToast } from "@/app/admin/admin-toast";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { formatDate, formatMoney, formatPeriod } from "@/lib/format";
import type { AdminPayment } from "@/lib/data";

export function PaymentReviewCard({ payment }: { payment: AdminPayment }) {
  const { notify } = useAdminToast();
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showFullImage, setShowFullImage] = useState(false);

  const quickReasons = [
    "Imagen borrosa o ilegible",
    "Monto incompleto",
    "Fecha o referencia no visible",
  ];

  async function handleVerify(formData: FormData) {
    await verifyPaymentAction(formData);
    notify(
      `Pago de ${payment.lease?.space?.name || "local"} marcado como verificado.`,
      "success"
    );
  }

  async function handleReject(formData: FormData) {
    await rejectPaymentAction(formData);
    setIsRejecting(false);
    setRejectReason("");
    notify(
      `Comprobante de ${payment.lease?.space?.name || "local"} rechazado.`,
      "error"
    );
  }

  return (
    <div className="card border border-crema space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-azul">
              {payment.lease?.space?.name || "Local"}
            </h3>
            <StatusBadge status={payment.status} />
          </div>
          <p className="text-sm font-semibold text-tinta mt-0.5">
            {payment.lease?.tenant?.name || "Inquilino"}
          </p>
          <p className="text-xs text-piedra">
            Contacto: {payment.lease?.tenant?.contact_info || "No especificado"}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="font-display text-xl font-bold tabular-nums text-azul">
            {formatMoney(payment.amount)}
          </p>
          <p className="text-xs text-piedra">
            Período: {formatPeriod({ month: payment.period_month, year: payment.period_year })}
          </p>
          <p className="text-[11px] text-piedra">
            Reportado: {formatDate(payment.payment_date)}
          </p>
        </div>
      </div>

      {payment.signed_receipt_url && (
        <div className="border-t border-crema/60 pt-3">
          <p className="text-xs font-semibold text-piedra uppercase mb-2">Comprobante adjunto</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowFullImage(true)}
              className="relative aspect-4/3 h-24 overflow-hidden rounded-xl border border-crema bg-arena transition hover:opacity-90 cursor-pointer"
            >
              <Image
                src={payment.signed_receipt_url}
                alt="Comprobante de transferencia"
                fill
                className="object-cover"
              />
            </button>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setShowFullImage(true)}
                className="text-xs font-semibold text-azul hover:underline block cursor-pointer"
              >
                Ampliar comprobante 🔍
              </button>
              <a
                href={payment.signed_receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-piedra hover:underline block"
              >
                Abrir en nueva pestaña ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {payment.admin_note && (
        <div className="rounded-xl bg-barro-claro/50 px-3.5 py-2 text-xs text-barro">
          <span className="font-semibold">Nota registrada:</span> {payment.admin_note}
        </div>
      )}

      {payment.status === "pending" && (
        <div className="border-t border-crema/80 pt-3">
          {isRejecting ? (
            <form action={handleReject} className="space-y-3">
              <input type="hidden" name="payment_id" value={payment.id} />
              <div>
                <label htmlFor={`reject-reason-${payment.id}`} className="label text-xs">
                  Motivo del rechazo (visible para el inquilino)
                </label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {quickReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className="rounded-lg border border-crema bg-arena px-2.5 py-1 text-[11px] font-semibold text-tinta transition hover:border-barro/40 hover:bg-barro-claro/40 cursor-pointer"
                    >
                      + {reason}
                    </button>
                  ))}
                </div>
                <input
                  id={`reject-reason-${payment.id}`}
                  name="admin_note"
                  type="text"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: Monto incompleto o imagen ilegible"
                  className="field text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <SubmitButton pendingText="Rechazando…" className="btn-accent min-h-10 text-xs">
                  Confirmar rechazo
                </SubmitButton>
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="btn-ghost min-h-10 text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <form action={handleVerify}>
                <input type="hidden" name="payment_id" value={payment.id} />
                <SubmitButton pendingText="Verificando…" className="btn-primary min-h-10 text-xs">
                  ✓ Marcar como Verificado
                </SubmitButton>
              </form>

              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-barro/30 bg-barro-claro/30 px-4 py-2 text-xs font-semibold text-barro transition hover:bg-barro-claro"
              >
                ✕ Rechazar comprobante
              </button>
            </div>
          )}
        </div>
      )}

      {showFullImage && payment.signed_receipt_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setShowFullImage(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl w-full overflow-hidden rounded-2xl bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-crema">
              <span className="font-semibold text-xs text-tinta">
                Comprobante · {payment.lease?.space?.name}
              </span>
              <button
                type="button"
                onClick={() => setShowFullImage(false)}
                className="text-xs font-bold text-piedra hover:text-tinta px-2 py-1"
              >
                Cerrar ✕
              </button>
            </div>
            <div className="relative mt-2 aspect-3/4 max-h-[75vh] w-full">
              <Image
                src={payment.signed_receipt_url}
                alt="Comprobante en alta resolución"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
