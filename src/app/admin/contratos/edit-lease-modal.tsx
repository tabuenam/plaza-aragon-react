"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updateLeaseAction } from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { compressImage } from "@/lib/compress-image";
import { formatMoney } from "@/lib/format";
import type { AdminLease, ContractAttachment, FormState, Space, Tenant } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

type StagedFile = {
  id: string;
  file: File;
  previewUrl?: string;
  isPdf: boolean;
  name: string;
  formattedSize: string;
};

export function EditLeaseModal({
  lease,
  spaces,
  tenants,
  activeSpaceIds = [],
}: {
  lease: AdminLease;
  spaces: Space[];
  tenants: Tenant[];
  activeSpaceIds?: string[];
}) {
  const { notify } = useAdminToast();
  const [isOpen, setIsOpen] = useState(false);

  const [spaceId, setSpaceId] = useState(lease.space_id);
  const [tenantId, setTenantId] = useState(lease.tenant_id);
  const [startDate, setStartDate] = useState(lease.start_date);
  const [endDate, setEndDate] = useState(lease.end_date);
  const [monthlyRent, setMonthlyRent] = useState<number | string>(lease.monthly_rent);
  const [isActive, setIsActive] = useState(lease.active);

  const [existingAttachments, setExistingAttachments] = useState<ContractAttachment[]>(
    lease.attachments || []
  );
  const [newFiles, setNewFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await updateLeaseAction(prev, formData);
      if (result.message) {
        notify(result.message, result.ok ? "success" : "error");
      }
      if (result.ok) {
        newFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setNewFiles([]);
        setIsOpen(false);
      }
      return result;
    },
    initialState
  );

  function handleOpen() {
    setSpaceId(lease.space_id);
    setTenantId(lease.tenant_id);
    setStartDate(lease.start_date);
    setEndDate(lease.end_date);
    setMonthlyRent(lease.monthly_rent);
    setIsActive(lease.active);
    setExistingAttachments(lease.attachments || []);
    setNewFiles([]);
    setIsOpen(true);
  }

  function handleClose() {
    newFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setNewFiles([]);
    setIsOpen(false);
  }

  function handleRemoveExisting(pathToRemove: string) {
    setExistingAttachments((prev) => prev.filter((a) => a.path !== pathToRemove));
  }

  function handleRemoveNew(idToRemove: string) {
    setNewFiles((prev) => {
      const target = prev.find((f) => f.id === idToRemove);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== idToRemove);
    });
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    try {
      const items: StagedFile[] = [];
      for (const rawFile of Array.from(fileList)) {
        const isPdf =
          rawFile.type === "application/pdf" || rawFile.name.toLowerCase().endsWith(".pdf");
        const file = isPdf ? rawFile : await compressImage(rawFile);
        const previewUrl = isPdf ? undefined : URL.createObjectURL(file);
        const sizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        items.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          previewUrl,
          isPdf,
          name: rawFile.name,
          formattedSize: sizeStr,
        });
      }
      setNewFiles((prev) => [...prev, ...items]);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const existingPaths = existingAttachments.map((a) => a.path);
    formData.set("existing_contract_files", JSON.stringify(existingPaths));

    formData.delete("new_contract_files");
    newFiles.forEach(({ file }) => {
      formData.append("new_contract_files", file);
    });

    startTransition(async () => {
      await formAction(formData);
    });
  }

  const occupiedOtherSpaces = activeSpaceIds.filter((id) => id !== lease.space_id);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-crema bg-white px-3 py-1.5 text-xs font-semibold text-azul transition hover:bg-crema/40 active:scale-95 cursor-pointer"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        Modificar
      </button>

      <AdminDialog open={isOpen} onClose={handleClose} labelledBy={`edit-lease-title-${lease.id}`} className="max-w-xl">
        <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white">
          <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
            <div>
              <h3
                id={`edit-lease-title-${lease.id}`}
                className="font-display text-lg font-bold text-azul sm:text-xl"
              >
                Modificar Contrato · {lease.space.name}
              </h3>
              <p className="text-xs text-piedra">
                Ajuste las condiciones, montos o documentos del contrato de arrendamiento.
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
              <input type="hidden" name="lease_id" value={lease.id} />

              <div>
                <label htmlFor={`edit-space-${lease.id}`} className="label">
                  Local comercial
                </label>
                <select
                  id={`edit-space-${lease.id}`}
                  name="space_id"
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  required
                  className="field min-h-11 text-sm"
                >
                  {spaces.map((s) => {
                    const isOccupiedByOther = occupiedOtherSpaces.includes(s.id);
                    return (
                      <option key={s.id} value={s.id} disabled={isOccupiedByOther}>
                        {s.name} · {formatMoney(s.price)}{" "}
                        {isOccupiedByOther ? "(Ocupado por otro contrato)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor={`edit-tenant-${lease.id}`} className="label">
                  Inquilino / Arrendatario
                </label>
                <select
                  id={`edit-tenant-${lease.id}`}
                  name="tenant_id"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                  className="field min-h-11 text-sm"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.contact_info ? `(${t.contact_info})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`edit-start-date-${lease.id}`} className="label">
                    Fecha de inicio
                  </label>
                  <input
                    id={`edit-start-date-${lease.id}`}
                    name="start_date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="field min-h-11 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor={`edit-end-date-${lease.id}`} className="label">
                    Fecha de finalización
                  </label>
                  <input
                    id={`edit-end-date-${lease.id}`}
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
                <label htmlFor={`edit-monthly-rent-${lease.id}`} className="label">
                  Renta mensual pactada (HNL)
                </label>
                <input
                  id={`edit-monthly-rent-${lease.id}`}
                  name="monthly_rent"
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="field min-h-11 text-sm"
                />
              </div>

              <div className="rounded-2xl border border-crema bg-arena/40 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    value="true"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-5 w-5 rounded-md border-crema text-azul focus:ring-azul"
                  />
                  <div>
                    <span className="text-sm font-semibold text-tinta">Contrato Activo y Vigente</span>
                    <p className="text-xs text-piedra">
                      Si desmarca esta casilla, el contrato se marcará como inactivo y el local pasará a estar disponible.
                    </p>
                  </div>
                </label>
              </div>

              <div className="space-y-3 rounded-2xl border border-crema bg-arena/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="label mb-0">Documentos y fotografías del contrato</span>
                    <p className="text-[11px] text-piedra">
                      Revise o adjunte archivos PDF y fotos del contrato firmado.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-piedra">
                    {existingAttachments.length + newFiles.length} adjunto(s)
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  onChange={handleFilesSelected}
                  className="sr-only"
                  id={`edit-file-input-${lease.id}`}
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFilesSelected}
                  className="sr-only"
                  id={`edit-camera-input-${lease.id}`}
                />

                {existingAttachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-piedra">
                      Archivos actuales:
                    </p>
                    <div className="space-y-1.5">
                      {existingAttachments.map((att) => (
                        <div
                          key={att.path}
                          className="flex items-center justify-between rounded-xl border border-crema bg-white p-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {att.isPdf ? (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-barro-claro text-barro font-bold text-[10px]">
                                PDF
                              </span>
                            ) : (
                              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-crema">
                                <Image
                                  src={att.url}
                                  alt={att.name}
                                  fill
                                  className="object-cover"
                                  sizes="28px"
                                />
                              </div>
                            )}
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-xs font-semibold text-azul hover:underline"
                            >
                              {att.name} ↗
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExisting(att.path)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-piedra hover:bg-barro-claro hover:text-barro"
                            title="Eliminar archivo guardado"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-selva">
                      Nuevos archivos por guardar ({newFiles.length}):
                    </p>
                    <div className="space-y-1.5">
                      {newFiles.map((nf) => (
                        <div
                          key={nf.id}
                          className="flex items-center justify-between rounded-xl border border-turquesa bg-white p-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {nf.isPdf ? (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-barro-claro text-barro font-bold text-[10px]">
                                PDF
                              </span>
                            ) : (
                              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-crema">
                                {nf.previewUrl && (
                                  <Image
                                    src={nf.previewUrl}
                                    alt={nf.name}
                                    fill
                                    className="object-cover"
                                    sizes="28px"
                                  />
                                )}
                              </div>
                            )}
                            <span className="truncate text-xs font-semibold text-tinta">{nf.name}</span>
                            <span className="text-[10px] text-piedra">({nf.formattedSize})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNew(nf.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-piedra hover:bg-barro-claro hover:text-barro"
                            title="Descartar"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessing}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-crema bg-white px-3 py-1.5 text-xs font-semibold text-azul shadow-2xs transition hover:bg-arena hover:border-turquesa active:scale-95 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Tomar foto
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-crema bg-white px-3 py-1.5 text-xs font-semibold text-azul shadow-2xs transition hover:bg-arena hover:border-turquesa active:scale-95 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Adjuntar archivo/fotos
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
                  pendingText={isPending ? "Guardando…" : "Procesando…"}
                  className="btn-primary min-h-11 text-sm py-2 px-5"
                >
                  Guardar cambios
                </SubmitButton>
              </footer>
            </form>
        </div>
      </AdminDialog>
    </>
  );
}
