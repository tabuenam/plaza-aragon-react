"use client";

import { submitPaymentAction } from "@/app/portal/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { compressImage } from "@/lib/compress-image";
import { currentPeriod, formatMoney, MONTHS } from "@/lib/format";
import type { FormState } from "@/lib/types";
import Image from "next/image";
import { useActionState, useRef, useState, useTransition } from "react";

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
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="amount" className="text-sm font-semibold text-tinta">
            Monto transferido (HNL)
          </label>
          <span className="text-xs font-medium text-piedra">
            Cuota pactada: <strong className="text-azul">{formatMoney(defaultRent)}</strong>
          </span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-display font-bold text-piedra">
            L
          </span>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="1"
            defaultValue={defaultRent}
            required
            inputMode="decimal"
            className="field pl-9 font-display font-bold tabular-nums"
          />
        </div>
      </div>

      <div>
        <span className="label">Comprobante bancario (foto o captura)</span>

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
          <div className="relative mt-2 overflow-hidden rounded-2xl border-2 border-turquesa bg-arena p-3">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-white shadow-2xs">
              <Image src={previewUrl} alt="Vista previa del comprobante" fill className="object-contain" />
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-selva">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-selva text-[10px] text-white">
                  ✓
                </span>
                Comprobante optimizado y listo
              </span>
              <button
                type="button"
                onClick={handleClearImage}
                className="rounded-lg px-2 py-1 text-xs font-bold text-barro transition hover:bg-barro-claro/50 cursor-pointer"
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 rounded-2xl border-2 border-dashed border-crema bg-arena/40 p-5 text-center transition hover:border-turquesa hover:bg-arena/70">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-turquesa-claro text-azul shadow-2xs">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <p className="mt-3 text-sm font-bold text-tinta">
              {isProcessingImage ? "Optimizando imagen…" : "Adjunte el recibo de su transferencia"}
            </p>
            <p className="mt-1 text-xs text-piedra">
              Puede tomar una fotografía con la cámara de su teléfono o elegir una captura de pantalla.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingImage}
                className="btn-primary min-h-11 px-3 text-xs sm:text-sm"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Usar cámara
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="btn-ghost min-h-11 px-3 text-xs sm:text-sm"
              >
                Elegir de galería
              </button>
            </div>
          </div>
        )}
      </div>

      <FormMessage state={state} />

      <SubmitButton
        pendingText={isPending ? "Enviando comprobante…" : "Procesando…"}
        disabled={!compressedFile || isProcessingImage}
        className="btn-accent w-full"
      >
        Enviar comprobante para verificación
      </SubmitButton>
    </form>
  );
}

