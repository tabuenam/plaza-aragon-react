"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updateSpaceAction } from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/admin-dialog";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { compressImage, MAX_UPLOAD_BYTES } from "@/lib/compress-image";
import type { FormState, Space, SpaceStatus } from "@/lib/types";
import { MAX_BUSINESS_DESCRIPTION_LENGTH, MAX_BUSINESS_NAME_LENGTH } from "@/lib/validation";

const initialState: FormState = { ok: true, message: "" };

type PendingImage = { file: File; preview: string };

function SpacePhotoFieldset({
  title,
  helperText,
  inputId,
  existingImages,
  newImageFiles,
  isCompressing,
  fileInputRef,
  onFilesSelected,
  onRemoveExisting,
  onRemoveNew,
  addLabel,
  existingAltPrefix,
  newAltPrefix,
  highlightClassName = "border-crema bg-arena/40",
}: {
  title: string;
  helperText?: string;
  inputId: string;
  existingImages: string[];
  newImageFiles: PendingImage[];
  isCompressing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveExisting: (url: string) => void;
  onRemoveNew: (idx: number) => void;
  addLabel: string;
  existingAltPrefix: string;
  newAltPrefix: string;
  highlightClassName?: string;
}) {
  return (
    <div className={`space-y-3 rounded-2xl border p-4 ${highlightClassName}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="label mb-0">{title}</span>
          {helperText && <p className="mt-0.5 text-[11px] text-piedra">{helperText}</p>}
        </div>
        <span className="shrink-0 text-xs font-semibold text-piedra">
          {existingImages.length + newImageFiles.length} imagen(es)
        </span>
      </div>

      {existingImages.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-piedra">Fotos actuales:</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {existingImages.map((url, idx) => (
              <div key={url} className="group relative aspect-4/3 overflow-hidden rounded-xl bg-crema">
                <Image
                  src={url}
                  alt={`${existingAltPrefix} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                <button
                  type="button"
                  onClick={() => onRemoveExisting(url)}
                  className="absolute top-1 right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-barro text-white shadow-xs transition hover:bg-barro/80"
                  title="Eliminar foto"
                  aria-label={`Eliminar ${existingAltPrefix.toLowerCase()} ${idx + 1}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {newImageFiles.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-selva">Nuevas fotos por subir:</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {newImageFiles.map((item, idx) => (
              <div key={item.preview} className="relative aspect-4/3 overflow-hidden rounded-xl border border-turquesa bg-crema">
                <Image
                  src={item.preview}
                  alt={`${newAltPrefix} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                <button
                  type="button"
                  onClick={() => onRemoveNew(idx)}
                  className="absolute top-1 right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-barro text-white shadow-xs transition hover:bg-barro/80"
                  title="Descartar"
                  aria-label={`Descartar ${newAltPrefix.toLowerCase()} ${idx + 1}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFilesSelected}
          className="sr-only"
          id={inputId}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing}
          className="btn-ghost min-h-11 w-full py-2 text-xs font-semibold"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {isCompressing ? "Procesando fotos…" : addLabel}
        </button>
      </div>
    </div>
  );
}

export function EditSpaceModal({ space }: { space: Space }) {
  const { notify } = useAdminToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SpaceStatus>(space.status);
  const [existingImages, setExistingImages] = useState<string[]>(space.image_urls || []);
  const [newImageFiles, setNewImageFiles] = useState<PendingImage[]>([]);
  const [existingBusinessImages, setExistingBusinessImages] = useState<string[]>(
    space.business_image_urls || []
  );
  const [newBusinessImageFiles, setNewBusinessImageFiles] = useState<PendingImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCompressingBusiness, setIsCompressingBusiness] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const businessFileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await updateSpaceAction(prev, formData);
      if (result.message) {
        notify(result.message, result.ok ? "success" : "error");
      }
      if (result.ok) {
        newImageFiles.forEach((item) => URL.revokeObjectURL(item.preview));
        setNewImageFiles([]);
        newBusinessImageFiles.forEach((item) => URL.revokeObjectURL(item.preview));
        setNewBusinessImageFiles([]);
        setIsOpen(false);
      }
      return result;
    },
    initialState
  );

  function revokePending(items: PendingImage[]) {
    items.forEach((item) => URL.revokeObjectURL(item.preview));
  }

  function handleOpen() {
    setSelectedStatus(space.status);
    setExistingImages(space.image_urls || []);
    revokePending(newImageFiles);
    setNewImageFiles([]);
    setExistingBusinessImages(space.business_image_urls || []);
    revokePending(newBusinessImageFiles);
    setNewBusinessImageFiles([]);
    setIsOpen(true);
  }

  function handleClose() {
    revokePending(newImageFiles);
    setNewImageFiles([]);
    revokePending(newBusinessImageFiles);
    setNewBusinessImageFiles([]);
    setIsOpen(false);
  }

  function handleRemoveExistingImage(urlToRemove: string) {
    setExistingImages((prev) => prev.filter((url) => url !== urlToRemove));
  }

  function handleRemoveNewImage(indexToRemove: number) {
    setNewImageFiles((prev) => {
      URL.revokeObjectURL(prev[indexToRemove].preview);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  }

  function handleRemoveExistingBusinessImage(urlToRemove: string) {
    setExistingBusinessImages((prev) => prev.filter((url) => url !== urlToRemove));
  }

  function handleRemoveNewBusinessImage(indexToRemove: number) {
    setNewBusinessImageFiles((prev) => {
      URL.revokeObjectURL(prev[indexToRemove].preview);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  }

  async function compressSelectedFiles(
    files: FileList | null,
    enforceCap: boolean
  ): Promise<PendingImage[]> {
    if (!files || files.length === 0) return [];
    const added: PendingImage[] = [];
    for (const file of Array.from(files)) {
      const compressed = await compressImage(file);
      if (enforceCap && compressed.size > MAX_UPLOAD_BYTES) {
        notify("Cada fotografía del negocio debe pesar menos de 4 MB.", "error");
        continue;
      }
      const preview = URL.createObjectURL(compressed);
      added.push({ file: compressed, preview });
    }
    return added;
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const added = await compressSelectedFiles(files, false);
      if (added.length > 0) {
        setNewImageFiles((prev) => [...prev, ...added]);
      }
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleBusinessFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingBusiness(true);
    try {
      const added = await compressSelectedFiles(files, true);
      if (added.length > 0) {
        setNewBusinessImageFiles((prev) => [...prev, ...added]);
      }
    } finally {
      setIsCompressingBusiness(false);
      if (businessFileInputRef.current) businessFileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    formData.set("existing_images", JSON.stringify(existingImages));
    formData.delete("new_images");
    newImageFiles.forEach(({ file }) => {
      formData.append("new_images", file);
    });

    formData.set("existing_business_images", JSON.stringify(existingBusinessImages));
    formData.delete("new_business_images");
    newBusinessImageFiles.forEach(({ file }) => {
      formData.append("new_business_images", file);
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
        className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-piedra transition hover:bg-crema/50 hover:text-azul active:scale-95 cursor-pointer"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        Editar local
      </button>

      <AdminDialog open={isOpen} onClose={handleClose} labelledBy={`edit-title-${space.id}`} className="max-w-2xl">
        <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white">
          <header className="flex items-center justify-between border-b border-crema px-5 py-4 sm:px-6">
            <div>
              <h3 id={`edit-title-${space.id}`} className="font-display text-lg font-bold text-azul sm:text-xl">
                Editar {space.name}
              </h3>
              <p className="text-xs text-piedra">Modifique los atributos y fotografías de este local comercial.</p>
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

            <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
              <input type="hidden" name="space_id" value={space.id} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label htmlFor={`name-${space.id}`} className="label">
                    Nombre del local
                  </label>
                  <input
                    id={`name-${space.id}`}
                    name="name"
                    type="text"
                    required
                    defaultValue={space.name}
                    className="field min-h-11 text-sm"
                    placeholder="Ej. Local 1 - Frente Principal"
                  />
                </div>

                <div>
                  <label htmlFor={`sort-order-${space.id}`} className="label">
                    Orden de listado
                  </label>
                  <input
                    id={`sort-order-${space.id}`}
                    name="sort_order"
                    type="number"
                    min="1"
                    defaultValue={space.sort_order}
                    className="field min-h-11 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`modal-status-${space.id}`} className="label">
                    Estado comercial
                  </label>
                  <select
                    id={`modal-status-${space.id}`}
                    name="status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as SpaceStatus)}
                    className="field min-h-11 text-sm"
                  >
                    <option value="available">Disponible</option>
                    <option value="occupied">Ocupado</option>
                    <option value="construction">En construcción</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={`modal-price-${space.id}`} className="label">
                    Cuota mensual base (HNL)
                  </label>
                  <input
                    id={`modal-price-${space.id}`}
                    name="price"
                    type="number"
                    min="0"
                    step="any"
                    required
                    defaultValue={space.price}
                    className="field min-h-11 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`description-${space.id}`} className="label">
                  Descripción comercial
                </label>
                <textarea
                  id={`description-${space.id}`}
                  name="description"
                  rows={4}
                  defaultValue={space.description}
                  className="field min-h-24 resize-y text-sm"
                  placeholder="Detalles sobre tamaño, vitrinas, servicios básicos, piso y beneficios..."
                />
              </div>

              <SpacePhotoFieldset
                title="Fotografías del local"
                inputId={`file-upload-${space.id}`}
                existingImages={existingImages}
                newImageFiles={newImageFiles}
                isCompressing={isCompressing}
                fileInputRef={fileInputRef}
                onFilesSelected={handleFilesSelected}
                onRemoveExisting={handleRemoveExistingImage}
                onRemoveNew={handleRemoveNewImage}
                addLabel="Agregar fotografías"
                existingAltPrefix="Foto"
                newAltPrefix="Nueva"
              />

              <section
                aria-labelledby={`business-showcase-heading-${space.id}`}
                className={`space-y-4 rounded-2xl border p-4 transition ${
                  selectedStatus === "occupied"
                    ? "border-selva/35 bg-selva-claro/20"
                    : "border-crema bg-arena/40"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4
                      id={`business-showcase-heading-${space.id}`}
                      className="font-display text-base font-bold text-azul"
                    >
                      Negocio en el local (vitrina pública)
                    </h4>
                    <p className="mt-0.5 text-xs text-piedra">
                      {selectedStatus === "occupied"
                        ? "Se mostrará en el reverso de la tarjeta pública mientras al menos un campo tenga información."
                        : "Solo se muestra públicamente en el catálogo cuando el local comercial está en estado «Ocupado»."}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      selectedStatus === "occupied"
                        ? "bg-selva-claro text-selva"
                        : "bg-white text-piedra ring-1 ring-crema"
                    }`}
                  >
                    {selectedStatus === "occupied" ? "Visible si tiene datos" : "Oculto en catálogo"}
                  </span>
                </div>

                <div>
                  <label htmlFor={`business-name-${space.id}`} className="label">
                    Nombre del negocio
                  </label>
                  <input
                    id={`business-name-${space.id}`}
                    name="business_name"
                    type="text"
                    maxLength={MAX_BUSINESS_NAME_LENGTH}
                    defaultValue={space.business_name ?? ""}
                    className="field min-h-11 text-sm"
                    placeholder="Ej. Farmacia San José"
                  />
                </div>

                <div>
                  <label htmlFor={`business-description-${space.id}`} className="label">
                    Descripción breve del negocio
                  </label>
                  <textarea
                    id={`business-description-${space.id}`}
                    name="business_description"
                    rows={3}
                    maxLength={MAX_BUSINESS_DESCRIPTION_LENGTH}
                    defaultValue={space.business_description ?? ""}
                    className="field min-h-20 resize-y text-sm"
                    placeholder="Giro comercial, productos o servicios principales que ofrece este inquilino..."
                  />
                  <p className="mt-1 text-[11px] text-piedra">
                    Máximo {MAX_BUSINESS_DESCRIPTION_LENGTH} caracteres.
                  </p>
                </div>

                <SpacePhotoFieldset
                  title="Fotos del negocio"
                  helperText="Compresión automática. Máximo 4 MB por fotografía."
                  inputId={`business-file-upload-${space.id}`}
                  existingImages={existingBusinessImages}
                  newImageFiles={newBusinessImageFiles}
                  isCompressing={isCompressingBusiness}
                  fileInputRef={businessFileInputRef}
                  onFilesSelected={handleBusinessFilesSelected}
                  onRemoveExisting={handleRemoveExistingBusinessImage}
                  onRemoveNew={handleRemoveNewBusinessImage}
                  addLabel="Agregar fotos del negocio"
                  existingAltPrefix="Foto del negocio"
                  newAltPrefix="Nueva foto del negocio"
                  highlightClassName="border-crema/90 bg-white/80"
                />
              </section>

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
