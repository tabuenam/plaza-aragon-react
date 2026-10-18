"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { AdminDialog } from "@/app/admin/admin-dialog";
import type { SpaceStatus } from "@/lib/types";

export function SpaceGallery({
  images,
  name,
  unitNumber,
  status,
  priority = false,
}: {
  images: string[];
  name: string;
  unitNumber?: number;
  status?: SpaceStatus;
  priority?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const titleId = useId();

  const unitLabel = unitNumber ? `0${unitNumber}` : name.replace(/\D/g, "").padStart(2, "0") || "PA";

  useEffect(() => {
    if (activeIndex === null || !images || images.length <= 1) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images]);

  if (!images || images.length === 0) {
    return (
      <div className="group relative flex aspect-16/9 w-full items-center justify-center overflow-hidden rounded-2xl border border-crema/80 bg-arena/70 blueprint-grid p-4">
        <span className="absolute top-3 left-3 rounded-md bg-white/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-piedra ring-1 ring-crema/80">
          Módulo {unitLabel}
        </span>

        {/* Clean architectural elevation SVG */}
        <svg
          viewBox="0 0 220 90"
          className="h-20 w-auto text-azul/80 transition-transform duration-300 group-hover:scale-[1.03]"
          aria-hidden="true"
        >
          <rect x="16" y="10" width="188" height="6" rx="2" fill="currentColor" opacity="0.85" />
          <rect x="22" y="16" width="176" height="64" fill="#ffffff" stroke="currentColor" strokeWidth="2" />
          <rect
            x="34"
            y="28"
            width="98"
            height="52"
            rx="3"
            fill={status === "construction" ? "#fdf0cf" : "#daf0f5"}
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <line x1="50" y1="34" x2="40" y2="56" stroke="#1693ad" strokeWidth="1.5" opacity="0.5" />
          <line x1="58" y1="34" x2="46" y2="62" stroke="#1693ad" strokeWidth="1.5" opacity="0.35" />
          <line x1="83" y1="28" x2="83" y2="80" stroke="currentColor" strokeWidth="1.25" opacity="0.4" />
          <path
            d="M144 80V40a18 18 0 0 1 36 0v40z"
            fill="#f9e3d8"
            stroke="#b84a24"
            strokeWidth="1.75"
          />
          <circle cx="151" cy="60" r="2" fill="#b84a24" />
          <line x1="6" y1="80" x2="214" y2="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {images.length === 1 ? (
        <button
          type="button"
          onClick={() => setActiveIndex(0)}
          className="group relative block aspect-16/10 w-full overflow-hidden rounded-2xl bg-crema text-left focus-visible:ring-3 focus-visible:ring-turquesa"
          aria-label={`Ampliar fotografía de ${name}`}
        >
          <Image
            src={images[0]}
            alt={`Fotografía de ${name}`}
            fill
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-tinta/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs transition group-hover:bg-azul">
            Ver foto ↗
          </span>
        </button>
      ) : (
        <div className="relative">
          <div className="no-scrollbar flex w-full snap-x snap-mandatory gap-2.5 overflow-x-auto rounded-2xl pb-1">
            {images.map((src, index) => {
              const isPrimarySlide = priority && index === 0;
              const isOffscreenSlide = index > 0;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="group relative aspect-16/10 w-[86%] shrink-0 snap-center overflow-hidden rounded-2xl bg-crema text-left sm:w-[90%]"
                  aria-label={`Ampliar fotografía ${index + 1} de ${name}`}
                >
                  <Image
                    src={src}
                    alt={`Fotografía ${index + 1} de ${name}`}
                    fill
                    priority={isPrimarySlide}
                    fetchPriority={isPrimarySlide ? "high" : isOffscreenSlide ? "low" : undefined}
                    loading={isPrimarySlide ? undefined : "lazy"}
                    sizes="(max-width: 768px) 85vw, 400px"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-tinta/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                    {index + 1} / {images.length} · Ampliar
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AdminDialog
        open={activeIndex !== null}
        onClose={() => setActiveIndex(null)}
        labelledBy={titleId}
        className="max-w-4xl"
      >
        {activeIndex !== null && (
          <div className="flex max-h-[90dvh] w-full flex-col overflow-hidden bg-white">
            <div className="flex items-center justify-between border-b border-crema px-5 py-3.5">
              <div>
                <h4 id={titleId} className="font-display text-base font-bold text-azul">
                  {name}
                </h4>
                <p className="text-xs text-piedra">
                  Fotografía {activeIndex + 1} de {images.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-arena text-tinta transition hover:bg-crema cursor-pointer"
                aria-label="Cerrar galería"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-16/10 max-h-[70dvh] w-full bg-tinta/95">
              <Image
                src={images[activeIndex]}
                alt={`Fotografía ${activeIndex + 1} de ${name}`}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-contain"
              />
            </div>

            {images.length > 1 && (
              <div className="flex items-center justify-between border-t border-crema bg-arena/60 px-5 py-3">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0))
                  }
                  className="btn-ghost min-h-9 px-3.5 py-1.5 text-xs"
                >
                  ← Anterior
                </button>
                <div className="flex items-center gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Ir a foto ${idx + 1}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === activeIndex ? "w-6 bg-azul" : "w-2 bg-crema hover:bg-piedra"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0))}
                  className="btn-ghost min-h-9 px-3.5 py-1.5 text-xs"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}
      </AdminDialog>
    </>
  );
}

