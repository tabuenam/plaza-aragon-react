"use client";

import { SpaceGallery } from "@/app/space-gallery";
import { StatusBadge } from "@/components/status-badge";
import {
  computeCatalogStats,
  filterSpaces,
  getSpaceCatalogTags,
  getSpaceHighlights,
  type FilterOption,
} from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import type { Space } from "@/lib/types";
import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from "react";

export { computeCatalogStats, filterSpaces, getSpaceHighlights, type FilterOption };

const WAITLIST_WHATSAPP_BASE = "50449151750";

const BUSINESS_SECTORS = [
  "Farmacia / Salud",
  "Clínica o Consultorio Médico",
  "Bufete Legal / Servicios Profesionales",
  "Boutique / Comercio Minorista",
  "Cafetería / Gastronomía",
  "Servicios Financieros / Cooperativa",
  "Tienda de Tecnología / Óptica",
  "Otro giro comercial",
];

function getSpaceDisplayMeta(space: Space, index: number) {
  const order = space.sort_order || index + 1;
  const lower = space.name.toLowerCase();

  if (lower.includes("pacura") || order === 1) {
    return {
      title: "Local Pacura",
      subtitle: "Local 1 - Esquinero",
      fullLabel: "Local Pacura (Local 1 - Esquinero)",
      area: "70 m²",
      description:
        space.description && space.description.length > 20
          ? space.description
          : "Módulo comercial esquinero en planta baja de 70 m² con doble ángulo visual, vitrina panorámica hacia la Calle Principal, baño privado y medidor eléctrico propio.",
    };
  }

  if (lower.includes("corozal") || order === 2) {
    return {
      title: "Local Corozal",
      subtitle: "Local 2 - Central Frontal",
      fullLabel: "Local Corozal (Local 2 - Central Frontal)",
      area: "70 m²",
      description:
        space.description && space.description.length > 20
          ? space.description
          : "Módulo comercial central frontal de 70 m² en planta baja con acceso directo a pie de calle, vitrina panorámica de vidrio templado, porcelanato y A/C instalado.",
    };
  }

  return {
    title: space.name,
    subtitle: `Local ${order} - Planta Baja`,
    fullLabel: `${space.name} (Local ${order})`,
    area: "70 m²",
    description: space.description,
  };
}

export function PlazaInteractiveSection({
  spaces,
  whatsapp,
}: {
  spaces: Space[];
  whatsapp: string;
}) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [preselectedUnit, setPreselectedUnit] = useState<string>("Próxima liberación o ampliación (70 m²)");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [sector, setSector] = useState(BUSINESS_SECTORS[0]);
  const [timeframe, setTimeframe] = useState("De 1 a 3 meses");
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalTitleId = useId();
  const nameInputId = useId();
  const phoneInputId = useId();
  const sectorInputId = useId();
  const unitInputId = useId();
  const timeframeInputId = useId();
  const notesInputId = useId();
  const errorId = useId();

  const cleanDigits = whatsapp.replace(/\D/g, "");
  const targetPhone =
    cleanDigits.startsWith("504") && cleanDigits.length === 11
      ? cleanDigits
      : WAITLIST_WHATSAPP_BASE;

  const primarySpaces = spaces.slice(0, 2);
  const totalOperating = primarySpaces.filter((s) => s.status === "occupied").length || 2;
  const totalModules = primarySpaces.length || 2;
  const statusSummaryText = `${totalOperating}/${totalModules} locales operando • Lista de espera activa`;

  const heroWhatsappHref = `https://wa.me/${targetPhone}?text=${encodeURIComponent(
    "Hola, quiero información sobre la lista de espera en Plaza Aragón"
  )}`;

  function openWaitlistModal(unitPreference: string) {
    setPreselectedUnit(unitPreference);
    setFieldError(null);
    setSubmittedUrl(null);
    setWaitlistOpen(true);
  }

  function closeWaitlistModal() {
    setWaitlistOpen(false);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.setAttribute("closedby", "any");
    if (waitlistOpen && !dialog.open) {
      dialog.showModal();
    } else if (!waitlistOpen && dialog.open) {
      dialog.close();
    }
  }, [waitlistOpen]);

  function handleDialogBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = dialogRef.current;
    if (!dialog || event.target !== dialog) return;
    if ("closedBy" in HTMLDialogElement.prototype) return;
    const rect = dialog.getBoundingClientRect();
    const isInside =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isInside) {
      dialog.close();
    }
  }

  function handleWaitlistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setFieldError("Por favor ingrese su nombre completo o el nombre de su empresa.");
      return;
    }

    if (trimmedPhone.replace(/\D/g, "").length < 8) {
      setFieldError("Por favor ingrese un número de teléfono o WhatsApp válido de al menos 8 dígitos.");
      return;
    }

    setFieldError(null);

    const messageLines = [
      "Hola, quiero unirme a la *Lista de Espera Prioritaria* de Plaza Aragón en Olanchito:",
      `• *Nombre / Empresa:* ${trimmedName}`,
      `• *Teléfono:* ${trimmedPhone}`,
      `• *Giro comercial:* ${sector}`,
      `• *Espacio de interés:* ${preselectedUnit}`,
      `• *Plazo estimado:* ${timeframe}`,
    ];

    if (notes.trim()) {
      messageLines.push(`• *Comentarios:* ${notes.trim()}`);
    }

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageLines.join("\n"))}`;
    setSubmittedUrl(whatsappUrl);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-azul-oscuro via-azul to-azul-oscuro text-white">
        <div className="lenca-diamonds pointer-events-none absolute inset-0 opacity-30" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-white ring-1 ring-white/20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                Centro de Olanchito • Contiguo a Hotel Olanchito
              </span>

              <span
                data-testid="hero-availability-badge"
                className="inline-flex items-center gap-2 rounded-full bg-maiz/20 px-3.5 py-1.5 text-xs font-bold tracking-wide text-maiz-claro ring-1 ring-maiz/40"
              >
                <span className="h-2 w-2 rounded-full bg-maiz" aria-hidden="true" />
                {statusSummaryText}
              </span>
            </div>

            <h1 className="hero-fluid-title mt-5 font-display font-extrabold text-white">
              Tu negocio en el corazón de la ciudad cívica
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-crema/95 sm:text-lg">
              Locales comerciales modernos de 70 m² con vitrina panorámica, baño privado y medidor independiente en Olanchito, Yoro. Desde L. 8,000/mes.
            </p>
          </div>

          <dl
            aria-label="Indicadores clave de arrendamiento"
            className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4"
          >
            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs transition duration-200 hover:border-white/25 hover:bg-white/15 sm:p-5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maiz text-azul-oscuro shadow-xs"
                aria-hidden="true"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-[2.2px] border-current font-display text-sm font-black leading-none">
                  L
                </span>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-maiz-claro">
                  Precio competitivo
                </dt>
                <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
                  L. 8,000 <span className="font-sans text-sm font-medium text-crema/85">/ mes</span>
                </dd>
                <p className="mt-0.5 text-xs text-crema/80">
                  Sin cuotas de mantenimiento ocultas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs transition duration-200 hover:border-white/25 hover:bg-white/15 sm:p-5">
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
                  Contrato flexible y renovable
                </dt>
                <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
                  6 a 12+ meses
                </dd>
                <p className="mt-0.5 text-xs text-crema/80">
                  Condiciones claras para tu marca
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs transition duration-200 hover:border-white/25 hover:bg-white/15 sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-barro text-white shadow-xs">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-barro-claro">
                  Acceso directo a pie de calle
                </dt>
                <dd className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">
                  Planta baja • 70 m²
                </dd>
                <p className="mt-0.5 text-xs text-crema/80">
                  Vitrina frontal y parqueo directo
                </p>
              </div>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <a
              href="#locales"
              className="btn-accent shadow-md"
            >
              Ver locales operando ↓
            </a>
            <a
              href={heroWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/20 active:scale-[0.98]"
              data-testid="hero-whatsapp-cta"
            >
              <svg className="h-5 w-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.492 5.451 5.587-1.466c1.911 1.258 4.195 1.982 6.621 1.982 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
              </svg>
              Agendar visita o consultar por WhatsApp
            </a>
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs font-semibold tracking-wide text-crema/90 sm:text-sm">
            <svg className="h-4 w-4 shrink-0 text-maiz" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            A 120m del Parque Central • Alto flujo vehicular y peatonal garantizado
          </p>
        </div>
        <div className="lenca-band h-2 w-full" />
      </section>

      <div
        id="lista-espera"
        className="scroll-mt-16 bg-barro/10 border-y border-barro/20 text-barro"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3.5 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-barro sm:mt-0" aria-hidden="true" />
            <p className="text-sm font-bold text-tinta sm:text-base">
              <span className="text-[#943818]">Estado actual: 2/2 locales operando con éxito</span>{" "}
              <span className="font-medium text-tinta/90">
                • Lista de espera activa para próximas liberaciones o ampliaciones.
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => openWaitlistModal("Próxima liberación o ampliación (70 m²)")}
            data-testid="waitlist-banner-trigger"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-barro px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#9e3d1c] active:scale-[0.98] cursor-pointer sm:text-sm"
          >
            <span>Unirme a la lista de espera</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <section id="locales" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              {statusSummaryText}
            </span>
            <h2 className="section-fluid-title mt-2 font-display font-bold text-azul">
              Locales diseñados para vender
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-piedra sm:text-base">
              70 m² optimizados por módulo, acabados en porcelanato y máxima visibilidad comercial hacia la calle principal.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-selva/20 bg-selva-claro/60 px-4 py-2 text-xs font-bold text-selva">
            <span className="h-2 w-2 rounded-full bg-selva" aria-hidden="true" />
            100% Ocupación Comercial • Caso de Éxito en Olanchito
          </div>
        </div>

        <div
          id="catalog-grid"
          data-testid="catalog-grid"
          className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {primarySpaces.map((space, idx) => {
            const meta = getSpaceDisplayMeta(space, idx);
            const tags = getSpaceCatalogTags(space, idx);

            return (
              <article
                id={`local-card-${space.id}`}
                data-testid={`space-card-${space.id}`}
                key={space.id}
                className="card flex flex-col justify-between transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <SpaceGallery
                    images={space.image_urls}
                    name={meta.title}
                    unitNumber={space.sort_order || idx + 1}
                    status={space.status}
                    priority={idx === 0}
                  />

                  <div className="mt-4 flex items-start justify-between gap-2">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-piedra">
                        {meta.subtitle}
                      </span>
                      <h3 className="mt-0.5 font-display text-xl font-bold text-tinta">
                        {meta.title}
                      </h3>
                    </div>
                    <StatusBadge status={space.status} />
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <p className="font-display text-2xl font-bold tabular-nums text-azul">
                      {formatMoney(space.price)}{" "}
                      <span className="font-sans text-xs font-medium text-piedra">/ mes</span>
                    </p>
                    <span className="text-xs font-bold text-piedra">•</span>
                    <span className="rounded-lg bg-azul/10 px-2.5 py-0.5 text-xs font-bold text-azul">
                      Área: {meta.area}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-piedra">
                    {meta.description}
                  </p>

                  <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`Características de ${meta.title}`}>
                    {tags.map((feat) => (
                      <li
                        key={feat}
                        className="rounded-lg bg-arena px-2.5 py-1 text-xs font-semibold text-tinta ring-1 ring-crema/80"
                      >
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-crema/70 pt-4">
                  <button
                    type="button"
                    onClick={() => openWaitlistModal(meta.fullLabel)}
                    data-testid={`waitlist-card-cta-${idx + 1}`}
                    className="btn-primary min-h-11 w-full text-sm"
                  >
                    <span>Quiero un espacio similar</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            );
          })}

          <article
            data-testid="waitlist-opportunity-card"
            className="border-2 border-dashed border-barro/40 bg-white/60 p-6 rounded-3xl flex flex-col justify-between transition duration-200 hover:border-barro/70 hover:bg-white/90 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-barro-claro text-barro ring-1 ring-barro/25"
                  aria-hidden="true"
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-barro-claro px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-barro ring-1 ring-barro/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-barro" aria-hidden="true" />
                  Lista Prioritaria
                </span>
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-barro">
                Tu próximo local aquí • Únete a la lista de espera
              </p>

              <h3 className="mt-1 font-display text-2xl font-bold text-tinta">
                Tu próximo local aquí
              </h3>

              <p className="mt-2.5 text-sm leading-relaxed text-piedra">
                Sé el primero en enterarte cuando un local se libere o cuando aperturemos la siguiente fase comercial.
              </p>

              <ul className="mt-5 space-y-2.5 border-t border-crema/80 pt-4 text-xs font-semibold text-tinta sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-selva-claro text-selva" aria-hidden="true">
                    ✓
                  </span>
                  <span>Aviso directo por WhatsApp antes de publicar disponibilidad</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-selva-claro text-selva" aria-hidden="true">
                    ✓
                  </span>
                  <span>Prioridad de reserva en módulos de 70 m² desde L. 8,000/mes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-selva-claro text-selva" aria-hidden="true">
                    ✓
                  </span>
                  <span>Opción de adecuar acabados en preventa de nueva fase</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4">
              <button
                type="button"
                onClick={() => openWaitlistModal("Próxima liberación o nueva fase comercial (70 m²)")}
                data-testid="waitlist-dashed-cta"
                className="btn-accent min-h-12 w-full text-sm shadow-sm"
              >
                <span>Unirme a lista prioritaria</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby={modalTitleId}
        onClose={closeWaitlistModal}
        onClick={handleDialogBackdropClick}
        className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-3xl bg-white p-0 text-tinta shadow-2xl ring-1 ring-crema backdrop:bg-tinta/65 backdrop:backdrop-blur-xs"
      >
        {waitlistOpen && (
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-crema pb-4">
              <div>
                <span className="eyebrow">Lista de espera prioritaria</span>
                <h2 id={modalTitleId} className="mt-1 font-display text-xl font-bold text-azul sm:text-2xl">
                  Asegura prioridad para tu negocio
                </h2>
                <p className="mt-1 text-xs text-piedra sm:text-sm">
                  Te notificaremos de inmediato cuando se libere un módulo o inicie la preventa de ampliación.
                </p>
              </div>
              <button
                type="button"
                onClick={closeWaitlistModal}
                aria-label="Cerrar ventana de lista de espera"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-arena text-tinta transition hover:bg-crema cursor-pointer"
              >
                ✕
              </button>
            </div>

            {submittedUrl ? (
              <div className="py-6 text-center">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-selva-claro text-2xl font-bold text-selva"
                  aria-hidden="true"
                >
                  ✓
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-tinta">
                  ¡Solicitud lista para confirmar!
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-piedra">
                  Hemos preparado tu registro prioritario para <strong>{preselectedUnit}</strong>. Si no se abrió WhatsApp automáticamente, pulsa el botón inferior para enviarlo directamente a la administración.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <a
                    href={submittedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-accent text-sm"
                  >
                    Enviar registro por WhatsApp →
                  </a>
                  <button
                    type="button"
                    onClick={closeWaitlistModal}
                    className="btn-ghost text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="mt-5 space-y-4" noValidate>
                <div>
                  <label htmlFor={unitInputId} className="label">
                    Módulo de referencia
                  </label>
                  <select
                    id={unitInputId}
                    name="preferredUnit"
                    value={preselectedUnit}
                    onChange={(e) => setPreselectedUnit(e.target.value)}
                    className="field"
                  >
                    <option value="Local Pacura (Local 1 - Esquinero)">
                      Similar a Local Pacura (Local 1 - Esquinero • 70 m²)
                    </option>
                    <option value="Local Corozal (Local 2 - Central Frontal)">
                      Similar a Local Corozal (Local 2 - Central Frontal • 70 m²)
                    </option>
                    <option value="Próxima liberación o nueva fase comercial (70 m²)">
                      Próxima liberación o nueva fase comercial (70 m²)
                    </option>
                    <option value="Cualquier módulo en planta baja (70 m²)">
                      Cualquier módulo disponible en planta baja (70 m²)
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={nameInputId} className="label">
                      Nombre completo o empresa *
                    </label>
                    <input
                      id={nameInputId}
                      name="fullName"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Ej. Dra. Elena Martínez"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldError) setFieldError(null);
                      }}
                      aria-describedby={fieldError ? errorId : undefined}
                      className="field"
                    />
                  </div>

                  <div>
                    <label htmlFor={phoneInputId} className="label">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      id={phoneInputId}
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      required
                      autoComplete="tel"
                      placeholder="Ej. +504 9999-9999"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldError) setFieldError(null);
                      }}
                      aria-describedby={fieldError ? errorId : undefined}
                      className="field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={sectorInputId} className="label">
                      Giro comercial
                    </label>
                    <select
                      id={sectorInputId}
                      name="sector"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="field"
                    >
                      {BUSINESS_SECTORS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={timeframeInputId} className="label">
                      Plazo estimado de apertura
                    </label>
                    <select
                      id={timeframeInputId}
                      name="timeframe"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="field"
                    >
                      <option value="Inmediato (al liberarse)">
                        Inmediato (al liberarse)
                      </option>
                      <option value="De 1 a 3 meses">
                        De 1 a 3 meses
                      </option>
                      <option value="De 3 a 6 meses">
                        De 3 a 6 meses
                      </option>
                      <option value="Preventa de ampliación">
                        Preventa de ampliación
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor={notesInputId} className="label">
                    Requerimientos especiales (opcional)
                  </label>
                  <textarea
                    id={notesInputId}
                    name="notes"
                    rows={2}
                    placeholder="Ej. Necesito espacio para consultorio o vitrina comercial amplia..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="field min-h-20"
                  />
                </div>

                {fieldError && (
                  <p
                    id={errorId}
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl bg-barro-claro px-4 py-2.5 text-xs font-bold text-barro ring-1 ring-barro/25"
                  >
                    {fieldError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2.5 border-t border-crema pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeWaitlistModal}
                    className="btn-ghost min-h-11 px-4 py-2.5 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    data-testid="waitlist-submit-btn"
                    className="btn-accent min-h-11 px-5 py-2.5 text-sm"
                  >
                    Registrarme en lista prioritaria →
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
