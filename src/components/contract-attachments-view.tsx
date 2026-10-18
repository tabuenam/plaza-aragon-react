"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { AdminDialog } from "@/app/admin/admin-dialog";
import type { ContractAttachment } from "@/lib/types";

export function ContractAttachmentsView({
  attachments,
  compact = false,
}: {
  attachments?: ContractAttachment[];
  compact?: boolean;
}) {
  const [activePhoto, setActivePhoto] = useState<ContractAttachment | null>(null);
  const titleId = useId();

  if (!attachments || attachments.length === 0) {
    return (
      <p className="text-xs italic text-piedra">
        Sin documento o fotografías del contrato adjuntos.
      </p>
    );
  }

  const pdfs = attachments.filter((a) => a.isPdf);
  const photos = attachments.filter((a) => !a.isPdf);

  return (
    <div className="space-y-3">
      {pdfs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pdfs.map((pdf, idx) => (
            <a
              key={pdf.path || idx}
              href={pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-crema bg-white px-3.5 py-2 text-xs font-semibold text-azul shadow-2xs transition hover:border-turquesa hover:bg-turquesa-claro/30"
              title="Abrir documento PDF en nueva pestaña"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-barro-claro text-barro font-bold text-[10px]">
                PDF
              </span>
              <span className="max-w-[180px] truncate">{pdf.name || "Contrato firmado"}</span>
              <span className="text-[11px] text-piedra">↗</span>
            </a>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div>
          {!compact && (
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-piedra">
              Fotografías del contrato ({photos.length})
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, idx) => (
              <button
                key={photo.path || idx}
                type="button"
                onClick={() => setActivePhoto(photo)}
                className="group relative h-16 w-16 overflow-hidden rounded-xl border border-crema bg-arena transition hover:border-turquesa hover:ring-2 hover:ring-turquesa/40 cursor-pointer"
                title={`Ver fotografía ${idx + 1}`}
              >
                <Image
                  src={photo.url}
                  alt={photo.name || `Página de contrato ${idx + 1}`}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="64px"
                />
                <span className="absolute bottom-0 right-0 rounded-tl-md bg-tinta/70 px-1 py-0.5 text-[9px] font-bold text-white">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <AdminDialog
        open={activePhoto !== null}
        onClose={() => setActivePhoto(null)}
        labelledBy={titleId}
        className="max-w-3xl"
      >
        {activePhoto && (
          <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white">
            <div className="flex items-center justify-between border-b border-crema px-5 py-3">
              <div>
                <h4 id={titleId} className="font-display text-sm font-bold text-azul">
                  Fotografía de Contrato · {activePhoto.name}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activePhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-azul hover:bg-arena"
                >
                  Abrir original ↗
                </a>
                <button
                  type="button"
                  onClick={() => setActivePhoto(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-piedra hover:bg-arena hover:text-tinta cursor-pointer"
                  aria-label="Cerrar vista previa"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="relative aspect-4/3 max-h-[75vh] w-full bg-arena/50 sm:aspect-16/10">
              <Image
                src={activePhoto.url}
                alt={activePhoto.name}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
