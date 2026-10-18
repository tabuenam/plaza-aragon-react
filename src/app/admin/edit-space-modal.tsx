"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updateSpaceAction } from "@/app/admin/actions";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { compressImage } from "@/lib/compress-image";
import type { FormState, Space } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function EditSpaceModal({ space }: { space: Space }) {
  const { notify } = useAdminToast();
  const [isOpen, setIsOpen] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(space.image_urls || []);
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; preview: string }[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setIsOpen(false);
      }
      return result;
    },
    initialState
  );

  function handleOpen() {
    setExistingImages(space.image_urls || []);
    setNewImageFiles([]);
    setIsOpen(true);
  }

  function handleClose() {
    newImageFiles.forEach((item) => URL.revokeObjectURL(item.preview));
    setNewImageFiles([]);
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

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const added: { file: File; preview: string }[] = [];
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        const preview = URL.createObjectURL(compressed);
        added.push({ file: compressed, preview });
      }
      setNewImageFiles((prev) => [...prev, ...added]);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

    startTransition(async () => {
      await formAction(formData);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-piedra transition hover:bg-crema/50 hover:text-azul active:scale-95"
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

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-title-${space.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        >
          <div
            className="fixed inset-0 bg-tinta/60 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          />

          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-crema">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl text-piedra transition hover:bg-arena hover:text-tinta"
                aria-label="Cerrar ventana"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    defaultValue={space.status}
                    className="field min-h-11 text-sm"
                  >
                    <option value="available">Disponible</option>
                    <option value="occupied">Ocupado</option>
                    <option value="construction">En construcción</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={`modal-price-${space.id}`} className="label">
                    Precio mensual base (HNL)
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

              <div className="space-y-3 rounded-2xl border border-crema bg-arena/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="label mb-0">Fotografías del local</span>
                  <span className="text-xs font-semibold text-piedra">
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
                            alt={`Foto ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(url)}
                            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-barro text-white shadow-xs transition hover:bg-barro/80"
                            title="Eliminar foto"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            alt={`Nueva ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(idx)}
                            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-barro text-white shadow-xs transition hover:bg-barro/80"
                            title="Descartar"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    onChange={handleFilesSelected}
                    className="sr-only"
                    id={`file-upload-${space.id}`}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="btn-ghost min-h-10 w-full text-xs font-semibold py-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {isCompressing ? "Procesando fotos…" : "Agregar fotografías"}
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
        </div>
      )}
    </>
  );
}
