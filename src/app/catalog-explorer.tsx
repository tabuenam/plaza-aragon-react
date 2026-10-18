"use client";

import { SpaceGallery } from "@/app/space-gallery";
import { StatusBadge } from "@/components/status-badge";
import { formatMoney } from "@/lib/format";
import type { Space } from "@/lib/types";
import { useState } from "react";

type FilterOption = "all" | "open" | "occupied";

const SPACE_HIGHLIGHTS: Record<number, string[]> = {
  1: ["Planta baja", "Vitrina panorámica", "Acceso directo"],
  2: ["Esquinero", "Alta visibilidad", "Medidor propio"],
  3: ["Porcelanato", "Baño privado", "Prep. A/C"],
  4: ["Ideal consultorio", "Iluminación LED", "Baño privado"],
  5: ["Doble frente", "Área de bodega", "Mayor metraje"],
};

function getSpaceHighlights(space: Space, index: number): string[] {
  const order = space.sort_order || index + 1;
  return SPACE_HIGHLIGHTS[order] ?? ["Planta baja", "Baño privado", "Servicios propios"];
}

export function PlazaInteractiveSection({
  spaces,
  whatsapp,
}: {
  spaces: Space[];
  whatsapp: string;
}) {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const availableCount = spaces.filter((s) => s.status === "available").length;
  const constructionCount = spaces.filter((s) => s.status === "construction").length;
  const occupiedCount = spaces.filter((s) => s.status === "occupied").length;
  const openCount = availableCount + constructionCount;
  const minPrice = Math.min(...spaces.map((s) => s.price));
  const maxPrice = Math.max(...spaces.map((s) => s.price));

  const filteredSpaces = spaces.filter((s) => {
    if (filter === "open") return s.status === "available" || s.status === "construction";
    if (filter === "occupied") return s.status === "occupied";
    return true;
  });

  return (
    <>
      {/* ───────────── COMPACT HERO WITH 3 KEY HIGHLIGHTS ───────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-azul-oscuro to-azul text-white">
        <div className="lenca-diamonds pointer-events-none absolute inset-0 opacity-30" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold tracking-wider text-maiz uppercase ring-1 ring-white/15">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {openCount} {openCount === 1 ? "local disponible" : "locales disponibles"} ahora
            </span>

            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Locales comerciales para su negocio en Plaza Aragón.
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-relaxed text-crema/90 sm:text-lg">
              Espacios modernos con baño privado, medidor eléctrico independiente y vitrina hacia la calle principal.
            </p>
          </div>

          {/* ───────────── 3 KEY INFORMATION PILLARS (PRICE · DURATION · LOCATION) ───────────── */}
          <dl
            aria-label="Información clave de arrendamiento"
            className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4"
          >
            {/* 1. Renting Price */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs sm:p-5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maiz text-azul-oscuro shadow-xs"
                aria-hidden="true"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-[2.2px] border-current font-display text-sm font-black leading-none">
                  L
                </span>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-maiz">
                  Precio de Renta
                </dt>
                <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
                  {formatMoney(minPrice)}
                  <span className="font-sans text-sm font-medium text-crema/80"> / mes</span>
                </dd>
                <p className="mt-0.5 text-xs text-crema/80">
                  Rango de {formatMoney(minPrice)} a {formatMoney(maxPrice)} HNL
                </p>
              </div>
            </div>

            {/* 2. Renting Duration */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-turquesa text-white shadow-xs">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-turquesa-claro">
                  Duración de Contrato
                </dt>
                <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
                  6 a 12+ meses
                </dd>
                <p className="mt-0.5 text-xs text-crema/80">
                  Plazos flexibles y renovables
                </p>
              </div>
            </div>

            {/* 3. Location of the Locals */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-barro text-white shadow-xs">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-barro-claro">
                  Ubicación
                </dt>
                <dd className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">
                  Olanchito, Yoro
                </dd>
                <p className="mt-0.5 text-xs text-crema/80">
                  Planta baja · Centro de la Ciudad
                </p>
              </div>
            </div>
          </dl>

          {/* ───────────── HERO CTAs ───────────── */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                "Hola, me gustaría recibir información sobre los locales comerciales en Plaza Aragón, Olanchito."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent shadow-md"
            >
              Consultar por WhatsApp
            </a>
            <a
              href="#locales"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/20"
            >
              Ver los {spaces.length} locales ↓
            </a>
          </div>
        </div>
        <div className="lenca-band h-2 w-full" />
      </section>

      {/* ───────────── SPACE CATALOG (CLEAN & EASY TO SCAN) ───────────── */}
      <section id="locales" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-azul sm:text-3xl">
              Locales Comerciales
            </h2>
            <p className="mt-1 text-sm text-piedra sm:text-base">
              Compare precios, disponibilidad y equipamiento de cada espacio.
            </p>
          </div>

          {/* Filter Pills */}
          <div
            role="tablist"
            aria-label="Filtrar locales por estado"
            className="inline-flex flex-wrap items-center gap-1 self-start rounded-2xl border border-crema bg-white p-1 shadow-2xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              onClick={() => setFilter("all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${filter === "all"
                  ? "bg-azul text-white"
                  : "text-piedra hover:bg-arena hover:text-tinta"
                }`}
            >
              Todos ({spaces.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "open"}
              onClick={() => setFilter("open")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${filter === "open"
                  ? "bg-azul text-white"
                  : "text-piedra hover:bg-arena hover:text-tinta"
                }`}
            >
              Disponibles / Preventa ({openCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "occupied"}
              onClick={() => setFilter("occupied")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${filter === "occupied"
                  ? "bg-azul text-white"
                  : "text-piedra hover:bg-arena hover:text-tinta"
                }`}
            >
              Ocupados ({occupiedCount})
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSpaces.map((space, idx) => {
            const isHighlighted = highlightedId === space.id;
            const highlights = getSpaceHighlights(space, idx);
            const inquiryText = encodeURIComponent(
              space.status === "construction"
                ? `Hola, me interesa apartar en preventa el ${space.name} (${formatMoney(space.price)}/mes) en Plaza Aragón, Olanchito.`
                : space.status === "available"
                  ? `Hola, me interesa agendar una visita o recibir información del ${space.name} (${formatMoney(space.price)}/mes) en Plaza Aragón.`
                  : `Hola, vi que el ${space.name} en Plaza Aragón está ocupado. Me gustaría saber si tienen lista de espera.`
            );

            return (
              <article
                id={`local-card-${space.id}`}
                key={space.id}
                onClick={() => setHighlightedId(space.id)}
                className={`card flex flex-col justify-between transition duration-200 hover:shadow-md ${isHighlighted ? "ring-2 ring-barro shadow-md" : ""
                  }`}
              >
                <div>
                  <SpaceGallery
                    images={space.image_urls}
                    name={space.name}
                    unitNumber={space.sort_order || idx + 1}
                    status={space.status}
                  />

                  {/* Scannable Header: Name + Status + Price right at the top */}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-bold text-tinta">{space.name}</h3>
                    <StatusBadge status={space.status} />
                  </div>

                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-azul">
                    {formatMoney(space.price)}{" "}
                    <span className="font-sans text-xs font-medium text-piedra">/ mes</span>
                  </p>

                  <p className="mt-3 text-sm leading-relaxed text-piedra">{space.description}</p>

                  {/* 3 Clean Feature Tags */}
                  <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Características">
                    {highlights.map((feat) => (
                      <li
                        key={feat}
                        className="rounded-lg bg-arena px-2.5 py-1 text-xs font-medium text-tinta"
                      >
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-2">
                  {space.status === "occupied" ? (
                    <div className="flex min-h-11 items-center justify-between rounded-xl bg-arena px-4 py-2.5 text-xs font-semibold text-piedra">
                      <span>Arrendado actualmente</span>
                      <a
                        href={`https://wa.me/${whatsapp}?text=${inquiryText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-azul hover:underline"
                      >
                        Lista de espera →
                      </a>
                    </div>
                  ) : (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${inquiryText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        space.status === "construction"
                          ? "btn-accent min-h-11 w-full text-sm"
                          : "btn-primary min-h-11 w-full text-sm"
                      }
                    >
                      {space.status === "construction"
                        ? "Apartar en preventa"
                        : "Solicitar información"}
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

