"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createModuleExpenseAction } from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { compressImage } from "@/lib/compress-image";
import { todayInHonduras } from "@/lib/format";
import type { ExpenseCategory, FormState } from "@/lib/types";
import { MAX_EXPENSE_REASON_LENGTH, MAX_EXPENSE_RECEIPT_BYTES } from "@/lib/validation";

const initialState: FormState = { ok: true, message: "" };

export function CreateExpenseModal({
  spaces,
  defaultSpaceId,
  defaultCategory = "construction",
  triggerLabel = "Registrar gasto",
  triggerClassName = "btn-primary min-h-11 px-4 py-2 text-xs sm:text-sm",
}: {
  spaces: { id: string; name: string }[];
  defaultSpaceId?: string;
  defaultCategory?: ExpenseCategory;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const { notify } = useAdminToast();
  const dialogTitleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const [selectedSpaceId, setSelectedSpaceId] = useState(defaultSpaceId ?? spaces[0]?.id ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(defaultCategory);
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayInHonduras());
  const [reason, setReason] = useState("");

  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function handleOpen() {
    setSelectedSpaceId(defaultSpaceId ?? spaces[0]?.id ?? "");
    setCategory(defaultCategory);
    setAmount("");
    setExpenseDate(todayInHonduras());
    setReason("");
    handleClearFile();
    setIsOpen(true);
  }

  function handleClose() {
    handleClearFile();
    setIsOpen(false);
  }

  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await createModuleExpenseAction(prev, formData);
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
    setFileError(null);
    try {
      const pdf = rawFile.type === "application/pdf" || rawFile.name.toLowerCase().endsWith(".pdf");
      const processed = pdf ? rawFile : await compressImage(rawFile);
      if (processed.size > MAX_EXPENSE_RECEIPT_BYTES) {
        setFileError("El comprobante excede el límite de 4 MB.");
        handleClearFile();
        return;
      }
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
    const formData = new FormData(e.currentTarget);
    formData.set("space_id", selectedSpaceId);
    formData.set("category", category);
    if (stagedFile) {
      formData.set("receipt", stagedFile);
    } else {
      formData.delete("receipt");
    }

    startTransition(async () => {
      await formAction(formData);
    });
  }

  const isConstruction = category === "construction";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={spaces.length === 0}
        className={triggerClassName}
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>{triggerLabel}</span>
      </button>

      <AdminDialog open={isOpen} onClose={handleClose} labelledBy={dialogTitleId} className="max-w-lg">
        <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white">
          <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
            <div>
              <h2 id={dialogTitleId} className="font-display text-lg font-bold text-azul sm:text-xl">
                Registrar Gasto o Inversión
              </h2>
              <p className="text-xs text-piedra">
                Registre costos de construcción o gastos operativos por módulo. El comprobante es opcional.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-piedra transition hover:bg-arena hover:text-tinta cursor-pointer"
              aria-label="Cerrar ventana"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <label htmlFor="expense-space" className="label">
                Módulo comercial
              </label>
              <select
                id="expense-space"
                name="space_id"
                required
                value={selectedSpaceId}
                onChange={(e) => setSelectedSpaceId(e.target.value)}
                className="field min-h-11 text-sm"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="label">Categoría del gasto</span>
              <div
                role="group"
                aria-label="Categoría del gasto"
                className="grid grid-cols-1 gap-1.5 rounded-2xl border border-crema bg-arena p-1 sm:grid-cols-2"
              >
                <button
                  type="button"
                  aria-pressed={isConstruction}
                  onClick={() => setCategory("construction")}
                  className={`min-h-11 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    isConstruction
                      ? "bg-azul text-white shadow-xs"
                      : "text-piedra hover:bg-white/80 hover:text-tinta"
                  }`}
                >
                  Construcción / Inversión inicial
                </button>
                <button
                  type="button"
                  aria-pressed={!isConstruction}
                  onClick={() => setCategory("operating")}
                  className={`min-h-11 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    !isConstruction
                      ? "bg-barro text-white shadow-xs"
                      : "text-piedra hover:bg-white/80 hover:text-tinta"
                  }`}
                >
                  Mantenimiento / Operación
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-piedra">
                {isConstruction
                  ? "CapEx: obra civil, remodelación o inversión inicial acumulada."
                  : "OpEx: pintura, reparaciones, limpieza o servicios del módulo."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="expense-amount" className="label">
                  Monto (HNL)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-display font-bold text-piedra">
                    L
                  </span>
                  <input
                    id="expense-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="field min-h-11 pl-9 font-display font-bold tabular-nums text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="expense-date" className="label">
                  Fecha del gasto
                </label>
                <input
                  id="expense-date"
                  name="expense_date"
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="field min-h-11 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="expense-reason" className="label">
                Motivo del gasto
              </label>
              <input
                id="expense-reason"
                name="reason"
                type="text"
                required
                maxLength={MAX_EXPENSE_REASON_LENGTH}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isConstruction
                    ? "Ej: Inversión inicial acumulada, Cemento y mano de obra"
                    : "Ej: Pintura y electricidad, Reparación de techo"
                }
                className="field min-h-11 text-sm"
              />
            </div>

            <div>
              <span className="label">
                Factura o comprobante <span className="font-normal text-piedra">(opcional)</span>
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="sr-only"
                id="expense_file_gallery"
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="sr-only"
                id="expense_file_camera"
              />

              {stagedFile ? (
                <div className="relative mt-2 overflow-hidden rounded-2xl border-2 border-turquesa bg-arena p-3">
                  {isPdf ? (
                    <div className="flex items-center gap-3 rounded-xl border border-crema bg-white p-3 shadow-2xs">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-barro-claro text-xs font-bold text-barro">
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
                      Comprobante listo
                    </span>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="min-h-9 rounded-lg px-2 py-1 text-xs font-bold text-barro transition hover:bg-barro-claro/50 cursor-pointer"
                    >
                      Quitar archivo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 rounded-2xl border-2 border-dashed border-crema bg-arena/40 p-4 text-center transition hover:border-turquesa hover:bg-arena/70">
                  <p className="text-xs font-bold text-tinta">
                    {isProcessingFile
                      ? "Optimizando comprobante…"
                      : "Adjunte foto o PDF de la factura (opcional)"}
                  </p>
                  <p className="mt-1 text-[11px] text-piedra">
                    Puede registrar inversiones históricas sin adjuntar fotografía.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isProcessingFile}
                      className="btn-primary min-h-11 px-3 text-xs"
                    >
                      Usar cámara
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingFile}
                      className="btn-ghost min-h-11 px-3 text-xs"
                    >
                      Elegir imagen o PDF
                    </button>
                  </div>
                </div>
              )}

              {fileError && <p className="mt-2 text-xs font-semibold text-barro">{fileError}</p>}
            </div>

            <FormMessage state={state} />

            <footer className="flex flex-col-reverse gap-2 border-t border-crema pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleClose} className="btn-ghost min-h-11 px-4 py-2 text-sm">
                Cancelar
              </button>
              <SubmitButton
                pendingText={isPending ? "Guardando gasto…" : "Guardando…"}
                disabled={isPending || isProcessingFile}
                className="btn-primary min-h-11 px-5 py-2 text-sm"
              >
                Guardar gasto
              </SubmitButton>
            </footer>
          </form>
        </div>
      </AdminDialog>
    </>
  );
}
