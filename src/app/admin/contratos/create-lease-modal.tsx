"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createLeaseAction } from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { compressImage } from "@/lib/compress-image";
import { formatMoney, todayInHonduras } from "@/lib/format";
import type { FormState, Space, Tenant } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

type StagedFile = {
  id: string;
  file: File;
  previewUrl?: string;
  isPdf: boolean;
  name: string;
  formattedSize: string;
};

function defaultEndDate(startDateStr: string) {
  if (!startDateStr) return "";
  const parts = startDateStr.split("-").map(Number);
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  const nextYear = year + 1;
  return `${nextYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CreateLeaseModal({
  spaces,
  tenants,
  activeSpaceIds = [],
  initialSpaceId,
}: {
  spaces: Space[];
  tenants: Tenant[];
  activeSpaceIds?: string[];
  initialSpaceId?: string;
}) {
  const { notify } = useAdminToast();
  const [isOpen, setIsOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const availableSpaces = spaces.filter((s) => !activeSpaceIds.includes(s.id));
  const defaultSpace = initialSpaceId
    ? spaces.find((s) => s.id === initialSpaceId)
    : (availableSpaces[0] || spaces[0]);

  const [selectedSpaceId, setSelectedSpaceId] = useState(defaultSpace?.id || "");
  const [rentAmount, setRentAmount] = useState<number | string>(defaultSpace?.price || 8000);
  const [startDate, setStartDate] = useState(todayInHonduras());
  const [endDate, setEndDate] = useState(defaultEndDate(todayInHonduras()));

  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await createLeaseAction(prev, formData);
      if (result.message) {
        notify(result.message, result.ok ? "success" : "error");
      }
      if (result.ok) {
        stagedFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setStagedFiles([]);
        setIsOpen(false);
      }
      return result;
    },
    initialState
  );

  function handleOpen() {
    const candidate = initialSpaceId
      ? spaces.find((s) => s.id === initialSpaceId)
      : (availableSpaces[0] || spaces[0]);

    if (candidate) {
      setSelectedSpaceId(candidate.id);
      setRentAmount(candidate.price);
    }
    const today = todayInHonduras();
    setStartDate(today);
    setEndDate(defaultEndDate(today));
    setStagedFiles([]);
    setIsOpen(true);
  }

  function handleClose() {
    stagedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setStagedFiles([]);
    setIsOpen(false);
  }

  function handleSpaceChange(newSpaceId: string) {
    setSelectedSpaceId(newSpaceId);
    const space = spaces.find((s) => s.id === newSpaceId);
    if (space) {
      setRentAmount(space.price);
    }
  }

  function handleStartDateChange(newStartDate: string) {
    setStartDate(newStartDate);
    setEndDate(defaultEndDate(newStartDate));
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    try {
      const newItems: StagedFile[] = [];
      for (const rawFile of Array.from(fileList)) {
        const isPdf =
          rawFile.type === "application/pdf" || rawFile.name.toLowerCase().endsWith(".pdf");
        const file = isPdf ? rawFile : await compressImage(rawFile);
        const previewUrl = isPdf ? undefined : URL.createObjectURL(file);
        const sizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          previewUrl,
          isPdf,
          name: rawFile.name,
          formattedSize: sizeStr,
        });
      }
      setStagedFiles((prev) => [...prev, ...newItems]);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = "";
    }
  }

  function handleRemoveFile(idToRemove: string) {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== idToRemove);
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    formData.delete("contract_files");
    stagedFiles.forEach(({ file }) => {
      formData.append("contract_files", file);
    });

    startTransition(async () => {
      await formAction(formData);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-azul px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-azul-oscuro active:scale-95 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo contrato
      </button>

      <AdminDialog open={isOpen} onClose={handleClose} labelledBy="create-lease-title" className="max-w-xl">
        <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white">
          <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
            <div>
              <h3 id="create-lease-title" className="font-display text-lg font-bold text-azul sm:text-xl">
                Registrar Contrato de Arrendamiento
              </h3>
              <p className="text-xs text-piedra">
                Asigne un local comercial a un inquilino con vigencia, monto mensual y documentos.
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
              className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-4"
            >
              <div>
                <label htmlFor="create-space-id" className="label">
                  Local comercial
                </label>
                <select
                  id="create-space-id"
                  name="space_id"
                  value={selectedSpaceId}
                  onChange={(e) => handleSpaceChange(e.target.value)}
                  required
                  className="field min-h-11 text-sm"
                >
                  {spaces.map((s) => {
                    const hasActive = activeSpaceIds.includes(s.id);
                    return (
                      <option key={s.id} value={s.id} disabled={hasActive}>
                        {s.name} · {formatMoney(s.price)}{" "}
                        {hasActive
                          ? "(Ya tiene contrato activo)"
                          : `(${s.status === "available" ? "Disponible" : s.status})`}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-[11px] text-piedra">
                  Al formalizar el contrato, el local pasará automáticamente a estado Ocupado.
                </p>
              </div>

              <div>
                <label htmlFor="create-tenant-id" className="label">
                  Inquilino / Arrendatario
                </label>
                {tenants.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-crema p-3 text-xs text-barro">
                    No hay inquilinos registrados. Cree primero un inquilino con el botón correspondiente.
                  </div>
                ) : (
                  <select
                    id="create-tenant-id"
                    name="tenant_id"
                    required
                    className="field min-h-11 text-sm"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.contact_info ? `(${t.contact_info})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="create-start-date" className="label">
                    Fecha de inicio
                  </label>
                  <input
                    id="create-start-date"
                    name="start_date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="field min-h-11 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="create-end-date" className="label">
                    Fecha de finalización
                  </label>
                  <input
                    id="create-end-date"
                    name="end_date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="field min-h-11 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-monthly-rent" className="label">
                  Renta mensual pactada (HNL)
                </label>
                <input
                  id="create-monthly-rent"
                  name="monthly_rent"
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="field min-h-11 text-sm"
                />
                <p className="mt-1 text-[11px] text-piedra">
                  Monto acordado en lempiras para el cobro mensual del alquiler.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-crema bg-arena/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="label mb-0">Documento o fotografías del contrato</span>
                    <p className="text-[11px] text-piedra">
                      Suba el contrato firmado en PDF o tome fotografías de sus páginas. (Opcional)
                    </p>
                  </div>
                  {stagedFiles.length > 0 && (
                    <span className="rounded-full bg-turquesa-claro px-2.5 py-0.5 text-xs font-bold text-azul">
                      {stagedFiles.length} adjunto(s)
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  onChange={handleFilesSelected}
                  className="sr-only"
                  id="create-lease-file-input"
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFilesSelected}
                  className="sr-only"
                  id="create-lease-camera-input"
                />

                {stagedFiles.length > 0 && (
                  <div className="space-y-2.5">
                    {stagedFiles.filter((f) => f.isPdf).length > 0 && (
                      <div className="space-y-1.5">
                        {stagedFiles
                          .filter((f) => f.isPdf)
                          .map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center justify-between rounded-xl border border-crema bg-white p-2.5 shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-barro-claro text-barro font-bold text-xs">
                                  PDF
                                </span>
                                <div className="overflow-hidden">
                                  <p className="truncate text-xs font-semibold text-tinta">{f.name}</p>
                                  <p className="text-[10px] text-piedra">{f.formattedSize}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(f.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-piedra transition hover:bg-barro-claro hover:text-barro"
                                title="Eliminar archivo"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                      </div>
                    )}

                    {stagedFiles.filter((f) => !f.isPdf).length > 0 && (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-piedra uppercase">
                          Fotografías capturadas ({stagedFiles.filter((f) => !f.isPdf).length})
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {stagedFiles
                            .filter((f) => !f.isPdf)
                            .map((photo, idx) => (
                              <div
                                key={photo.id}
                                className="group relative aspect-4/3 overflow-hidden rounded-xl border border-crema bg-white shadow-2xs"
                              >
                                {photo.previewUrl && (
                                  <Image
                                    src={photo.previewUrl}
                                    alt={photo.name}
                                    fill
                                    className="object-cover"
                                    sizes="120px"
                                  />
                                )}
                                <span className="absolute bottom-1 left-1 rounded bg-tinta/70 px-1 py-0.5 text-[9px] font-bold text-white">
                                  Pág {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(photo.id)}
                                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-barro text-white shadow-xs transition hover:bg-barro/80"
                                  title="Eliminar foto"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessing}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-crema bg-white px-3 py-2 text-xs font-semibold text-azul shadow-2xs transition hover:bg-arena hover:border-turquesa active:scale-95 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {isProcessing ? "Procesando…" : "Tomar foto con cámara"}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-crema bg-white px-3 py-2 text-xs font-semibold text-azul shadow-2xs transition hover:bg-arena hover:border-turquesa active:scale-95 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    {isProcessing ? "Procesando…" : "Elegir archivo PDF o fotos"}
                  </button>
                </div>
              </div>

              <FormMessage state={state} />

              <footer className="flex flex-col-reverse gap-2 border-t border-crema pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-ghost min-h-11 text-sm py-2 px-4"
                >
                  Cancelar
                </button>
                <SubmitButton
                  pendingText={isPending ? "Subiendo contrato…" : "Creando contrato…"}
                  className="btn-primary min-h-11 text-sm py-2 px-5"
                >
                  Crear contrato
                </SubmitButton>
              </footer>
            </form>
        </div>
      </AdminDialog>
    </>
  );
}
