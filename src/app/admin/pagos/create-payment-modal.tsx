"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createAdminPaymentAction } from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { compressImage } from "@/lib/compress-image";
import { currentPeriod, formatMoney, MONTHS } from "@/lib/format";
import type { AdminLease, FormState } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function CreatePaymentModal({
  activeLeases,
  defaultMonth,
  defaultYear,
}: {
  activeLeases: AdminLease[];
  defaultMonth: number;
  defaultYear: number;
}) {
  const { notify } = useAdminToast();
  const dialogTitleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const defaultLease = activeLeases[0];
  const [selectedLeaseId, setSelectedLeaseId] = useState(defaultLease?.id ?? "");
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [amount, setAmount] = useState<number | string>(defaultLease?.monthly_rent ?? "");

  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const cur = currentPeriod();
  const yearSet = new Set([cur.year - 1, cur.year, cur.year + 1, defaultYear]);
  const years = Array.from(yearSet).sort((a, b) => a - b);

  const currentLease = activeLeases.find((l) => l.id === selectedLeaseId) ?? activeLeases[0];

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleClearFile() {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setStagedFile(null);
    setIsPdf(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function handleOpen() {
    const first = activeLeases[0];
    setSelectedLeaseId(first?.id ?? "");
    setAmount(first?.monthly_rent ?? "");
    setSelectedMonth(defaultMonth);
    setSelectedYear(defaultYear);
    handleClearFile();
    setIsOpen(true);
  }

  function handleClose() {
    handleClearFile();
    setIsOpen(false);
  }

  function handleLeaseChange(newLeaseId: string) {
    setSelectedLeaseId(newLeaseId);
    const found = activeLeases.find((l) => l.id === newLeaseId);
    if (found) {
      setAmount(found.monthly_rent);
    }
  }

  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await createAdminPaymentAction(prev, formData);
      if (result.message) {
        notify(result.message, result.ok ? "success" : "error");
      }
      if (result.ok) {
        handleClearFile();
        formRef.current?.reset();
        setIsOpen(false);
      }
      return result;
    },
    initialState
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setIsProcessingFile(true);
    try {
      const pdf = rawFile.type === "application/pdf" || rawFile.name.toLowerCase().endsWith(".pdf");
      const processed = pdf ? rawFile : await compressImage(rawFile);
      setStagedFile(processed);
      setIsPdf(pdf);

      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return pdf ? null : URL.createObjectURL(processed);
      });
    } finally {
      setIsProcessingFile(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stagedFile) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("receipt", stagedFile);

    startTransition(async () => {
      await formAction(formData);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={activeLeases.length === 0}
        title={
          activeLeases.length === 0
            ? "No hay locales con contrato activo en este momento"
            : "Registrar pago mensual de un local arrendado"
        }
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-azul px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-azul-oscuro active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Registrar pago
      </button>

      <AdminDialog open={isOpen} onClose={handleClose} labelledBy={dialogTitleId} className="max-w-lg">
        <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white">
          <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
            <div>
              <h2 id={dialogTitleId} className="font-display text-lg font-bold text-azul sm:text-xl">
                Registrar Pago de Local
              </h2>
              <p className="text-xs text-piedra">
                Suba el comprobante mensual de cualquier local arrendado. Quedará verificado automáticamente.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-piedra transition hover:bg-arena hover:text-tinta cursor-pointer"
              aria-label="Cerrar ventana"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            data-testid="admin-payment-form"
            className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6"
          >
            <div>
              <label htmlFor="admin-payment-lease" className="label">
                Local comercial arrendado
              </label>
              <select
                id="admin-payment-lease"
                name="lease_id"
                autoFocus
                required
                value={selectedLeaseId}
                onChange={(e) => handleLeaseChange(e.target.value)}
                className="field min-h-11 text-sm"
              >
                {activeLeases.map((lease) => (
                  <option key={lease.id} value={lease.id}>
                    {lease.space.name} — {lease.tenant.name} ({formatMoney(lease.monthly_rent)}/mes)
                  </option>
                ))}
              </select>
              {currentLease && (
                <p className="mt-1 text-[11px] text-piedra">
                  Inquilino: <strong className="text-tinta">{currentLease.tenant.name}</strong>
                  {currentLease.tenant.contact_info ? ` · ${currentLease.tenant.contact_info}` : ""}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="admin-period-month" className="label">
                  Mes de renta
                </label>
                <select
                  id="admin-period-month"
                  name="period_month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="field min-h-11 text-sm"
                >
                  {MONTHS.map((name, index) => (
                    <option key={index + 1} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="admin-period-year" className="label">
                  Año
                </label>
                <select
                  id="admin-period-year"
                  name="period_year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="field min-h-11 text-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="admin-payment-amount" className="text-sm font-semibold text-tinta">
                  Monto pagado (HNL)
                </label>
                {currentLease && (
                  <span className="text-xs font-medium text-piedra">
                    Cuota pactada: <strong className="text-azul">{formatMoney(currentLease.monthly_rent)}</strong>
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-display font-bold text-piedra">
                  L
                </span>
                <input
                  id="admin-payment-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="field min-h-11 pl-9 font-display font-bold tabular-nums text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-payment-note" className="label">
                Nota o referencia bancaria <span className="font-normal text-piedra">(opcional)</span>
              </label>
              <input
                id="admin-payment-note"
                name="admin_note"
                type="text"
                placeholder="Ej: Depósito BAC #48291 registrado por administración"
                className="field min-h-11 text-sm"
              />
            </div>

            <div>
              <span className="label">Comprobante de pago (foto, captura o PDF)</span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="sr-only"
                id="admin_file_gallery"
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="sr-only"
                id="admin_file_camera"
              />

              {stagedFile ? (
                <div className="relative mt-2 overflow-hidden rounded-2xl border-2 border-turquesa bg-arena p-3">
                  {isPdf ? (
                    <div className="flex items-center gap-3 rounded-xl border border-crema bg-white p-3 shadow-2xs">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-barro-claro font-bold text-xs text-barro">
                        PDF
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-tinta">{stagedFile.name}</p>
                        <p className="text-[11px] text-piedra">
                          {stagedFile.size > 1024 * 1024
                            ? `${(stagedFile.size / (1024 * 1024)).toFixed(1)} MB`
                            : `${Math.round(stagedFile.size / 1024)} KB`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    previewUrl && (
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-white shadow-2xs">
                        <Image src={previewUrl} alt="Vista previa del comprobante" fill className="object-contain" />
                      </div>
                    )
                  )}
                  <div className="mt-3 flex items-center justify-between px-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-selva">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-selva text-[10px] text-white">
                        ✓
                      </span>
                      Comprobante listo para subir
                    </span>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-barro transition hover:bg-barro-claro/50 cursor-pointer"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 rounded-2xl border-2 border-dashed border-crema bg-arena/40 p-4 text-center transition hover:border-turquesa hover:bg-arena/70">
                  <p className="text-sm font-bold text-tinta">
                    {isProcessingFile ? "Optimizando comprobante…" : "Adjunte el comprobante del pago"}
                  </p>
                  <p className="mt-1 text-xs text-piedra">
                    Tome una fotografía con la cámara o seleccione una imagen o PDF desde su dispositivo.
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isProcessingFile}
                      className="btn-primary min-h-10 px-3 text-xs"
                    >
                      Usar cámara
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingFile}
                      className="btn-ghost min-h-10 px-3 text-xs"
                    >
                      Elegir imagen o PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            <FormMessage state={state} />

            <footer className="flex flex-col-reverse gap-2 border-t border-crema pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="btn-ghost min-h-11 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <SubmitButton
                pendingText={isPending ? "Subiendo pago…" : "Guardando…"}
                disabled={!stagedFile || isProcessingFile}
                className="btn-primary min-h-11 px-5 py-2 text-sm"
              >
                Guardar pago verificado
              </SubmitButton>
            </footer>
          </form>
        </div>
      </AdminDialog>
    </>
  );
}
