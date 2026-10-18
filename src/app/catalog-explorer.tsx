"use client";

import { SpaceGallery } from "@/app/space-gallery";
import { StatusBadge } from "@/components/status-badge";
import { formatMoney } from "@/lib/format";
import type { Space, SpaceStatus } from "@/lib/types";
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
  return SPACE_HIGHLIGHTS[order] ?? ["Planta baja", "Baño privado", "Servicios independientes"];
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

  const filteredSpaces = spaces.filter((s) => {
    if (filter === "open") return s.status === "available" || s.status === "construction";
    if (filter === "occupied") return s.status === "occupied";
    return true;
  });

  function handleSelectFromSchematic(space: Space) {
    setFilter("all");
    setHighlightedId(space.id);
    const el = document.getElementById(`local-card-${space.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      document.getElementById("locales")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <>
      {/* ───────────── HERO ARCHITECTURAL SCHEMATIC & INTRO ───────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-azul-oscuro via-azul to-[#0e4d7e] text-white">
        <div className="lenca-diamonds pointer-events-none absolute inset-0 opacity-45" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-turquesa/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-maiz/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Civic Pitch */}
            <div className="lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-turquesa-claro uppercase backdrop-blur-xs">
                <span className="h-2 w-2 rounded-full bg-maiz animate-pulse" />
                <span>Olanchito, Yoro · La Ciudad Cívica</span>
              </div>

              <h1 className="mt-5 font-display hero-fluid-title font-extrabold text-white">
                El punto comercial donde crecen los negocios de{" "}
                <span className="text-maiz underline decoration-barro/70 decoration-wavy decoration-2 underline-offset-8">
                  Olanchito
                </span>
                .
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-crema/90 sm:text-lg">
                Locales comerciales en planta baja sobre zona de alto tráfico peatonal y vehicular. Acabados modernos,
                servicios independientes y contratos flexibles de <strong>3 a 12 meses</strong> con gestión digital.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                    "Hola, me gustaría recibir información sobre la renta de locales comerciales en Plaza Aragón, Olanchito."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent shadow-lg shadow-barro/25"
                >
                  <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.492 5.447 5.611-1.472c1.906 1.262 4.19 1.992 6.597 1.992 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
                  </svg>
                  Consultar por WhatsApp
                </a>
                <a
                  href="#locales"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-base font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
                >
                  Explorar los {spaces.length} locales ↓
                </a>
              </div>

              {/* Key Civic Metrics */}
              <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-white/15 pt-7 sm:grid-cols-4">
                <div>
                  <dt className="text-[11px] font-semibold tracking-wider text-crema/75 uppercase">
                    Módulos Comerciales
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">
                    {spaces.length} locales
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold tracking-wider text-crema/75 uppercase">
                    Para Renta / Preventa
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-maiz sm:text-3xl">
                    {openCount} opciones
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold tracking-wider text-crema/75 uppercase">
                    Plazo Flexible
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-turquesa-claro sm:text-3xl">
                    3–12 meses
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold tracking-wider text-crema/75 uppercase">
                    Renta Mensual Desde
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">
                    {formatMoney(Math.min(...spaces.map((s) => s.price)))}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Right Column: Interactive Architectural Croquis */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md sm:p-6">
                <div className="flex items-center justify-between border-b border-white/15 pb-3.5">
                  <div>
                    <span className="font-mono text-[10px] font-bold tracking-widest text-maiz uppercase">
                      CROQUIS ARQUITECTÓNICO EN VIVO
                    </span>
                    <h2 className="font-display text-lg font-bold text-white">
                      Frente Comercial · Planta Baja
                    </h2>
                  </div>
                  <span className="rounded-lg bg-white/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-crema">
                    {spaces.length} UNIDADES
                  </span>
                </div>

                <p className="mt-3 text-xs text-crema/85">
                  Toque cualquier local del croquis para inspeccionar su precio, estado actual y detalles abajo:
                </p>

                {/* Interactive Facade Grid */}
                <div className="mt-4 space-y-2.5" role="list" aria-label="Croquis de locales en Plaza Aragón">
                  {spaces.map((space, idx) => {
                    const isSelected = highlightedId === space.id;
                    const statusStyle: Record<
                      SpaceStatus,
                      { badge: string; dot: string; label: string }
                    > = {
                      available: {
                        badge: "bg-selva-claro text-selva",
                        dot: "bg-selva",
                        label: "Disponible",
                      },
                      construction: {
                        badge: "bg-maiz-claro text-[#734d08]",
                        dot: "bg-maiz",
                        label: "En preventa",
                      },
                      occupied: {
                        badge: "bg-white/15 text-crema",
                        dot: "bg-turquesa-claro",
                        label: "Ocupado",
                      },
                    };
                    const st = statusStyle[space.status];

                    return (
                      <button
                        key={space.id}
                        type="button"
                        onClick={() => handleSelectFromSchematic(space)}
                        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition duration-150 cursor-pointer ${isSelected
                            ? "border-maiz bg-white/20 ring-2 ring-maiz/50"
                            : "border-white/15 bg-azul-oscuro/55 hover:border-white/35 hover:bg-white/15"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-white/10 font-mono text-xs font-bold text-maiz ring-1 ring-white/15 group-hover:bg-maiz group-hover:text-azul-oscuro transition">
                            <span className="text-[9px] leading-none opacity-75">LOC</span>
                            <span className="leading-tight">0{space.sort_order || idx + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm font-bold text-white truncate">
                                {space.name}
                              </span>
                            </div>
                            <p className="truncate text-xs text-crema/75">
                              {getSpaceHighlights(space, idx).join(" · ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${st.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                          <span className="font-display text-xs font-bold tabular-nums text-white">
                            {formatMoney(space.price)}
                            <span className="font-sans text-[10px] font-normal text-crema/70">/mes</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Street reference bar */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-azul-oscuro/80 px-3.5 py-2 text-[11px] font-medium text-crema/80 ring-1 ring-white/10">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-turquesa" />
                    Acceso directo desde acera peatonal y estacionamiento
                  </span>
                  <span className="font-mono text-[10px] uppercase text-maiz">CALLE PRINCIPAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lenca-band h-2.5 w-full" />
      </section>

      {/* ───────────── INTERACTIVE SPACE CATALOG ───────────── */}
      <section id="locales" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-barro" />
              Catálogo de Espacios Comerciales
            </span>
            <h2 className="mt-2 font-display section-fluid-title font-bold text-azul">
              Elija el local ideal para su empresa en Olanchito
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-piedra sm:text-base">
              Cada módulo cuenta con distribución funcional, excelente iluminación y visibilidad comercial. Filtre por
              disponibilidad o consulte preventa directamente por WhatsApp.
            </p>
          </div>

          {/* Filter Pills */}
          <div
            role="tablist"
            aria-label="Filtrar locales por estado"
            className="inline-flex flex-wrap items-center gap-1.5 self-start rounded-2xl border border-crema bg-white p-1.5 shadow-2xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              onClick={() => setFilter("all")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${filter === "all"
                  ? "bg-azul text-white shadow-2xs"
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
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${filter === "open"
                  ? "bg-azul text-white shadow-2xs"
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
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${filter === "occupied"
                  ? "bg-azul text-white shadow-2xs"
                  : "text-piedra hover:bg-arena hover:text-tinta"
                }`}
            >
              Ocupados ({occupiedCount})
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSpaces.map((space, idx) => {
            const isHighlighted = highlightedId === space.id;
            const highlights = getSpaceHighlights(space, idx);
            const inquiryText = encodeURIComponent(
              space.status === "construction"
                ? `Hola, me interesa apartar en preventa el ${space.name} (${formatMoney(space.price)}/mes) en Plaza Aragón, Olanchito.`
                : space.status === "available"
                  ? `Hola, me interesa agendar una visita o recibir información del ${space.name} (${formatMoney(space.price)}/mes) en Plaza Aragón.`
                  : `Hola, vi que el ${space.name} en Plaza Aragón está ocupado. Me gustaría saber si tienen locales similares o lista de espera.`
            );

            return (
              <article
                id={`local-card-${space.id}`}
                key={space.id}
                onClick={() => setHighlightedId(space.id)}
                className={`card group flex flex-col justify-between transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${isHighlighted
                    ? "ring-2 ring-barro shadow-md bg-gradient-to-b from-white to-barro-claro/15"
                    : ""
                  }`}
              >
                <div>
                  <SpaceGallery
                    images={space.image_urls}
                    name={space.name}
                    unitNumber={space.sort_order || idx + 1}
                    status={space.status}
                  />

                  <div className="mt-5 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-semibold tracking-wider text-piedra uppercase">
                        Módulo Comercial 0{space.sort_order || idx + 1}
                      </span>
                      <h3 className="font-display text-xl font-bold text-tinta group-hover:text-azul transition">
                        {space.name}
                      </h3>
                    </div>
                    <StatusBadge status={space.status} />
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-piedra">{space.description}</p>

                  {/* Feature Spec Pills */}
                  <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Características del local">
                    {highlights.map((feat) => (
                      <li
                        key={feat}
                        className="inline-flex items-center gap-1 rounded-lg bg-arena px-2.5 py-1 text-xs font-medium text-tinta ring-1 ring-crema/80"
                      >
                        <span className="text-turquesa" aria-hidden="true">
                          ✓
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-crema pt-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-piedra">
                        Cuota mensual
                      </span>
                      <span className="text-xs text-piedra">Contrato 3 a 12 meses</span>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-xl font-bold tabular-nums text-azul sm:text-2xl">
                        {formatMoney(space.price)}
                      </span>
                      <span className="block text-[11px] font-medium text-piedra">Lempiras / mes</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    {space.status === "occupied" ? (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-crema bg-arena/80 px-3.5 py-2.5">
                        <span className="text-xs font-semibold text-piedra">
                          Local arrendado actualmente
                        </span>
                        <a
                          href={`https://wa.me/${whatsapp}?text=${inquiryText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-azul hover:underline shrink-0"
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
                            ? "btn-accent w-full text-sm"
                            : "btn-primary w-full text-sm"
                        }
                      >
                        {space.status === "construction"
                          ? "Apartar en preventa por WhatsApp"
                          : "Solicitar visita e información"}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
