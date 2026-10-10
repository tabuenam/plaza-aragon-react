"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { submitPaymentAction } from "@/app/portal/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { compressImage } from "@/lib/compress-image";
import { currentPeriod, MONTHS } from "@/lib/format";
import type { FormState } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function PaymentForm({ defaultRent }: { defaultRent: number }) {
  const [state, formAction] = useActionState(submitPaymentAction, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const cur = currentPeriod();
  const [selectedMonth, setSelectedMonth] = useState(cur.month);
  const [selectedYear, setSelectedYear] = useState(cur.year);

  const years = [cur.year - 1, cur.year, cur.year + 1];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const optimized = await compressImage(file);
      setCompressedFile(optimized);
      const url = URL.createObjectURL(optimized);
      setPreviewUrl(url);
    } finally {
      setIsProcessingImage(false);
    }
  }

  function handleClearImage() {
    setPreviewUrl(null);
    setCompressedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!compressedFile) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("receipt", compressedFile);

    startTransition(async () => {
      await formAction(formData);
      if (state.ok) {
        handleClearImage();
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="period_month" className="label">
            Mes de renta
          </label>
          <select
            id="period_month"
            name="period_month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="field"
          >
            {MONTHS.map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="period_year" className="label">
            Año
          </label>
          <select
            id="period_year"
            name="period_year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="field"
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
        <label htmlFor="amount" className="label">
          Monto pagado (HNL)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="1"
          defaultValue={defaultRent}
          required
          inputMode="decimal"
          className="field"
        />
      </div>

      <div>
        <span className="label">Comprobante de transferencia bancaria</span>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
          id="file_gallery"
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="sr-only"
          id="file_camera"
        />

        {previewUrl ? (
          <div className="relative mt-2 overflow-hidden rounded-2xl border-2 border-turquesa bg-arena p-2">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-white sm:aspect-16/9">
              <Image src={previewUrl} alt="Vista previa del comprobante" fill className="object-contain" />
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-selva">✓ Imagen lista para subir</span>
              <button
                type="button"
                onClick={handleClearImage}
                className="text-xs font-semibold text-barro hover:underline"
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 rounded-2xl border-2 border-dashed border-crema bg-white p-5 text-center transition hover:border-turquesa">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-turquesa-claro text-azul">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <p className="mt-3 text-sm font-semibold text-tinta">Suba la captura o foto del comprobante</p>
            <p className="mt-1 text-xs text-piedra">Formatos admitidos: JPG, PNG, WebP o captura de pantalla</p>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingImage}
                className="btn-primary min-h-11 text-sm"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tomar foto con cámara
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="btn-ghost min-h-11 text-sm"
              >
                Elegir de galería o archivos
              </button>
            </div>
          </div>
        )}
      </div>

      <FormMessage state={state} />

      <SubmitButton
        pendingText={isPending ? "Subiendo comprobante…" : "Procesando…"}
        className="btn-accent w-full"
      >
        Registrar pago de renta
      </SubmitButton>
    </form>
  );
}
