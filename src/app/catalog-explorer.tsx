"use client";

import { SpaceGallery } from "@/app/space-gallery";
import { StatusBadge } from "@/components/status-badge";
import { WhatsAppGlyph, WhatsAppStackedLogo } from "@/components/whatsapp-brand";
import {
  buildSpaceShareData,
  cleanPhoneDigits,
  computeCatalogStats,
  filterSpaces,
  getSpaceCatalogTags,
  getSpaceDisplayMeta,
  getSpaceHighlights,
  hasSpaceBusinessShowcase,
  type FilterOption,
} from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import type { Space } from "@/lib/types";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type MouseEvent,
} from "react";

export {
  computeCatalogStats,
  filterSpaces,
  getSpaceDisplayMeta,
  getSpaceHighlights,
  type FilterOption,
};

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

const emptySubscribe = () => () => {};

function legacyCopy(text: string): boolean {
  const field = Object.assign(document.createElement("textarea"), { value: text });
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
  document.body.append(field);
  field.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

function getSlideTargetLeft(track: HTMLElement, slide: HTMLElement): number {
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const align = getComputedStyle(slide).scrollSnapAlign;
  const raw = align.includes("center")
    ? slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2
    : slide.offsetLeft;
  return Math.max(0, Math.min(maxScroll, raw));
}

function getNearestSlideIndex(track: HTMLElement): number {
  const slides = Array.from(track.children) as HTMLElement[];
  if (slides.length === 0) return 0;
  let nearestIdx = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < slides.length; i += 1) {
    const dist = Math.abs(getSlideTargetLeft(track, slides[i]) - track.scrollLeft);
    if (dist < bestDistance) {
      bestDistance = dist;
      nearestIdx = i;
    }
  }
  return nearestIdx;
}

export function PlazaInteractiveSection({
  spaces,
  whatsapp,
}: {
  spaces: Space[];
  whatsapp: string;
}) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [preselectedUnit, setPreselectedUnit] = useState<string>(
    "Próxima liberación o nueva fase comercial (70 m²)"
  );
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [sector, setSector] = useState(BUSINESS_SECTORS[0]);
  const [timeframe, setTimeframe] = useState("De 1 a 3 meses");
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [settledAnnouncement, setSettledAnnouncement] = useState("");
  const [copiedState, setCopiedState] = useState<Record<string, "copied" | "failed" | undefined>>({});
  const [copiedMessage, setCopiedMessage] = useState<Record<string, string | undefined>>({});
  const [highlightedSpaceId, setHighlightedSpaceId] = useState<string | null>(null);
  const [openShareSpaceId, setOpenShareSpaceId] = useState<string | null>(null);
  const [dismissedTooltipId, setDismissedTooltipId] = useState<string | null>(null);
  const [flippedSpaceIds, setFlippedSpaceIds] = useState<Record<string, boolean>>({});

  const canNativeShare = useSyncExternalStore(
    emptySubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false
  );
  const siteOrigin = useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => "https://plaza-aragon.com"
  );

  const dialogRef = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pendingTargetRef = useRef<{ index: number; left: number } | null>(null);
  const lastSettledRef = useRef<number>(0);
  const scrollRafRef = useRef<number | null>(null);
  const copyTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastAnnouncedRef = useRef<string>("");
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareContainerRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const shareBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const flipTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const flipBackBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const modalTitleId = useId();
  const nameInputId = useId();
  const phoneInputId = useId();
  const sectorInputId = useId();
  const unitInputId = useId();
  const timeframeInputId = useId();
  const notesInputId = useId();
  const errorId = useId();

  const targetPhone = cleanPhoneDigits(whatsapp);

  const primarySpaces = spaces;
  const stats = computeCatalogStats(primarySpaces);
  const freeCount = stats.openCount;
  const totalOperating = stats.occupiedCount;
  const totalModules = primarySpaces.length;
  const totalSlides = primarySpaces.length + 1;
  const hideDesktopControls = totalSlides <= 3 && !isOverflowing;
  const statusSummaryText =
    freeCount > 0
      ? `${freeCount} ${freeCount === 1 ? "local disponible" : "locales disponibles"} • ${totalOperating}/${totalModules} operando`
      : `${totalOperating}/${totalModules} locales operando • Lista de espera activa`;

  const heroWhatsappHref = `https://wa.me/${targetPhone}?text=${encodeURIComponent(
    "Hola, quiero información sobre la lista de espera en Plaza Aragón"
  )}`;

  const scrollToSlide = useCallback((targetIdx: number, options?: { announce?: boolean }) => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    if (slides.length === 0) return;

    const clampedIdx = ((targetIdx % slides.length) + slides.length) % slides.length;
    const targetSlide = slides[clampedIdx];
    const targetLeft = getSlideTargetLeft(track, targetSlide);
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReduced ? "auto" : "smooth";

    setActiveSlide(clampedIdx);

    if (Math.abs(track.scrollLeft - targetLeft) <= 2) {
      pendingTargetRef.current = null;
      if (options?.announce !== false && clampedIdx !== lastSettledRef.current) {
        lastSettledRef.current = clampedIdx;
        setSettledAnnouncement(`Módulo ${clampedIdx + 1} de ${slides.length}`);
      }
      return;
    }

    pendingTargetRef.current = { index: clampedIdx, left: targetLeft };
    track.scrollTo({ left: targetLeft, behavior });

    if (behavior === "auto") {
      requestAnimationFrame(() => {
        pendingTargetRef.current = null;
        if (options?.announce !== false && clampedIdx !== lastSettledRef.current) {
          lastSettledRef.current = clampedIdx;
          setSettledAnnouncement(`Módulo ${clampedIdx + 1} de ${slides.length}`);
        }
      });
    }
  }, []);

  function navigateBy(delta: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    if (slides.length <= 1) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    if (maxScroll <= 2) return;

    const pending = pendingTargetRef.current;
    const currentIdx = pending !== null ? pending.index : getNearestSlideIndex(track);
    const currentLeft = pending !== null ? pending.left : track.scrollLeft;

    if (delta > 0) {
      if (currentLeft >= maxScroll - 2) {
        if (slides.length >= 3) {
          scrollToSlide(0);
        }
        return;
      }
      let nextIdx = currentIdx + 1;
      while (
        nextIdx < slides.length &&
        getSlideTargetLeft(track, slides[nextIdx]) <= currentLeft + 2
      ) {
        nextIdx += 1;
      }
      if (nextIdx >= slides.length) {
        if (slides.length >= 3) {
          scrollToSlide(0);
        }
        return;
      }
      scrollToSlide(nextIdx);
      return;
    }

    if (currentLeft <= 2) {
      if (slides.length >= 3) {
        scrollToSlide(slides.length - 1);
      }
      return;
    }
    let prevIdx = currentIdx - 1;
    while (
      prevIdx >= 0 &&
      getSlideTargetLeft(track, slides[prevIdx]) >= currentLeft - 2
    ) {
      prevIdx -= 1;
    }
    if (prevIdx < 0) {
      if (slides.length >= 3) {
        scrollToSlide(slides.length - 1);
      }
      return;
    }
    scrollToSlide(prevIdx);
  }

  useEffect(() => {
    const timers = copyTimersRef.current;
    return () => {
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
      }
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateOverflow = () => {
      setIsOverflowing(track.scrollWidth - track.clientWidth > 8);
    };

    const rafId = requestAnimationFrame(updateOverflow);
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateOverflow);
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", updateOverflow);
      };
    }

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(track);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [totalSlides]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const supportsScrollEnd = "onscrollend" in window;

    const handleSettled = () => {
      const pending = pendingTargetRef.current;
      if (pending !== null) {
        if (Math.abs(track.scrollLeft - pending.left) > 16) {
          return;
        }
        const settledIndex = pending.index;
        pendingTargetRef.current = null;
        setActiveSlide(settledIndex);
        if (settledIndex !== lastSettledRef.current) {
          lastSettledRef.current = settledIndex;
          setSettledAnnouncement(`Módulo ${settledIndex + 1} de ${totalSlides}`);
        }
        return;
      }

      const settledIndex = getNearestSlideIndex(track);
      setActiveSlide(settledIndex);
      if (settledIndex !== lastSettledRef.current) {
        lastSettledRef.current = settledIndex;
        setSettledAnnouncement(`Módulo ${settledIndex + 1} de ${totalSlides}`);
      }
    };

    const handleUserInterrupt = () => {
      pendingTargetRef.current = null;
    };

    const handleScroll = () => {
      if (pendingTargetRef.current === null) {
        if (scrollRafRef.current === null) {
          scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = null;
            if (pendingTargetRef.current !== null) return;
            const nearest = getNearestSlideIndex(track);
            setActiveSlide((prev) => (prev === nearest ? prev : nearest));
          });
        }
      }

      if (!supportsScrollEnd) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleSettled, 150);
      }
    };

    track.addEventListener("scroll", handleScroll, { passive: true });
    track.addEventListener("touchstart", handleUserInterrupt, { passive: true });
    track.addEventListener("wheel", handleUserInterrupt, { passive: true });
    if (supportsScrollEnd) {
      track.addEventListener("scrollend", handleSettled);
    }

    return () => {
      track.removeEventListener("scroll", handleScroll);
      track.removeEventListener("touchstart", handleUserInterrupt);
      track.removeEventListener("wheel", handleUserInterrupt);
      if (supportsScrollEnd) {
        track.removeEventListener("scrollend", handleSettled);
      }
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [totalSlides]);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#local-card-")) return;
      const targetId = hash.slice("#local-card-".length);
      const idx = primarySpaces.findIndex((s) => s.id === targetId);
      if (idx === -1) return;
      scrollToSlide(idx, { announce: false });
      setHighlightedSpaceId(targetId);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedSpaceId(null);
      }, 2600);
    };

    const rafId = requestAnimationFrame(syncFromHash);
    window.addEventListener("hashchange", syncFromHash);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [primarySpaces, scrollToSlide]);

  useEffect(() => {
    if (!openShareSpaceId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const container = shareContainerRefs.current[openShareSpaceId];
      if (!container || container.contains(event.target as Node)) return;
      setOpenShareSpaceId(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const activeId = openShareSpaceId;
      setOpenShareSpaceId(null);
      shareBtnRefs.current[activeId]?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openShareSpaceId]);

  function reportCopyOutcome(
    spaceId: string,
    ok: boolean,
    successMessage = "¡Enlace copiado!"
  ) {
    if (copyTimersRef.current[spaceId]) {
      clearTimeout(copyTimersRef.current[spaceId]);
    }

    let message = ok ? successMessage : "No se pudo copiar";
    if (message === lastAnnouncedRef.current) {
      message += "\u00A0";
    }
    lastAnnouncedRef.current = message;

    setCopiedState((prev) => ({ ...prev, [spaceId]: ok ? "copied" : "failed" }));
    setCopiedMessage((prev) => ({ ...prev, [spaceId]: "" }));

    requestAnimationFrame(() => {
      setCopiedMessage((prev) => ({ ...prev, [spaceId]: message }));
    });

    copyTimersRef.current[spaceId] = setTimeout(() => {
      setCopiedState((prev) => ({ ...prev, [spaceId]: undefined }));
      setCopiedMessage((prev) => ({ ...prev, [spaceId]: "" }));
    }, 2200);
  }

  async function copyTextToClipboard(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return legacyCopy(text);
    } catch {
      return legacyCopy(text);
    }
  }

  async function handleCopySpaceLink(space: Space, index: number) {
    const shareData = buildSpaceShareData(space, index, siteOrigin);
    setOpenShareSpaceId(null);

    const ok = await copyTextToClipboard(shareData.clipboardText);
    reportCopyOutcome(space.id, ok, "¡Enlace copiado!");
  }

  async function handleInstagramShare(space: Space, index: number) {
    const shareData = buildSpaceShareData(space, index, siteOrigin);
    setOpenShareSpaceId(null);

    const copyPromise = copyTextToClipboard(shareData.clipboardText);
    window.open(shareData.instagramUrl, "_blank", "noopener,noreferrer");
    const ok = await copyPromise;
    reportCopyOutcome(space.id, ok, "Copiado para Instagram");
  }

  function handleFlipCard(spaceId: string, nextFlipped: boolean) {
    if (openShareSpaceId === spaceId) {
      setOpenShareSpaceId(null);
    }
    setFlippedSpaceIds((prev) => ({ ...prev, [spaceId]: nextFlipped }));
    requestAnimationFrame(() => {
      if (nextFlipped) {
        flipBackBtnRefs.current[spaceId]?.focus();
      } else {
        flipTriggerRefs.current[spaceId]?.focus();
      }
    });
  }

  async function handleNativeShare(space: Space, index: number) {
    const shareData = buildSpaceShareData(space, index, siteOrigin);
    setOpenShareSpaceId(null);

    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return;
    }

    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.text,
        url: shareData.url,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      await handleCopySpaceLink(space, index);
    }
  }

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
              Locales comerciales modernos de 70 m² con vitrina panorámica, baño privado y medidor independiente en Olanchito, Yoro.
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
                  Desde 6 meses
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
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-whatsapp/45 bg-whatsapp-oscuro/80 px-5 py-3 text-base font-semibold text-white shadow-xs transition hover:border-whatsapp hover:bg-whatsapp-oscuro active:scale-[0.98]"
              data-testid="hero-whatsapp-cta"
            >
              <WhatsAppGlyph variant="green" className="h-5 w-5 shrink-0" size={20} />
              <span>Agendar visita o consultar por WhatsApp</span>
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
              <span className="text-[#943818]">
                {freeCount > 0
                  ? stats.availableCount > 0
                    ? `Estado actual: ${stats.availableCount} ${stats.availableCount === 1 ? "local disponible ahora" : "locales disponibles ahora"}`
                    : `Estado actual: ${stats.constructionCount} ${stats.constructionCount === 1 ? "local en preventa" : "locales en preventa"}`
                  : `Estado actual: ${totalOperating}/${totalModules} locales operando con éxito`}
              </span>{" "}
              <span className="font-medium text-tinta/90">
                {freeCount > 0
                  ? "• Agenda tu visita o comparte la disponibilidad del módulo."
                  : "• Lista de espera activa para próximas liberaciones o ampliaciones."}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              openWaitlistModal(
                freeCount > 0
                  ? "Cualquier módulo en planta baja (70 m²)"
                  : "Próxima liberación o nueva fase comercial (70 m²)"
              )
            }
            data-testid="waitlist-banner-trigger"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-barro px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#9e3d1c] active:scale-[0.98] cursor-pointer sm:text-sm"
          >
            <span>{freeCount > 0 ? "Solicitar disponibilidad" : "Unirme a la lista de espera"}</span>
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
              70 m² optimizados por módulo, acabados en porcelanato y máxima visibilidad comercial hacia la Avenida el Caliche.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-selva/20 bg-selva-claro/60 px-4 py-2 text-xs font-bold text-selva">
            <span className="h-2 w-2 rounded-full bg-selva" aria-hidden="true" />
            {freeCount > 0
              ? "Disponibilidad inmediata en Olanchito"
              : "100% Ocupación Comercial • Caso de Éxito en Olanchito"}
          </div>
        </div>

        <div
          role="region"
          aria-roledescription="carrusel"
          aria-label="Módulos comerciales en Plaza Aragón"
          className="relative mt-8"
        >
          <div
            className={`mb-4 flex items-center justify-between gap-3 ${
              hideDesktopControls ? "lg:hidden" : ""
            }`}
          >
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-piedra">
              <span>Desliza para explorar los módulos</span>
              <span aria-hidden="true">→</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateBy(-1)}
                disabled={totalSlides < 3 && activeSlide === 0}
                aria-label="Módulo anterior"
                data-testid="carousel-prev-btn"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-crema bg-white px-3 text-sm font-bold text-tinta shadow-2xs transition hover:border-azul/35 hover:text-azul active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 touch-manipulation"
              >
                <span aria-hidden="true">←</span>
                <span className="hidden sm:inline sm:ml-1.5">Anterior</span>
              </button>
              <button
                type="button"
                onClick={() => navigateBy(1)}
                disabled={totalSlides < 3 && activeSlide >= totalSlides - 1}
                aria-label="Siguiente módulo"
                data-testid="carousel-next-btn"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-crema bg-white px-3 text-sm font-bold text-tinta shadow-2xs transition hover:border-azul/35 hover:text-azul active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 touch-manipulation"
              >
                <span className="hidden sm:inline sm:mr-1.5">Siguiente</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            id="catalog-grid"
            data-testid="catalog-grid"
            tabIndex={0}
            role="group"
            aria-label="Lista de módulos comerciales"
            className="no-scrollbar relative flex gap-5 overflow-x-auto scroll-smooth motion-reduce:scroll-auto snap-x snap-mandatory touch-manipulation py-2 -my-2"
          >
            {primarySpaces.map((space, idx) => {
              const meta = getSpaceDisplayMeta(space, idx);
              const tags = getSpaceCatalogTags(space, idx);
              const isFree = space.status === "available" || space.status === "construction";
              const isHighlighted = highlightedSpaceId === space.id;
              const isShareMenuOpen = openShareSpaceId === space.id;
              const shareData = isShareMenuOpen
                ? buildSpaceShareData(space, idx, siteOrigin)
                : null;
              const canFlip = hasSpaceBusinessShowcase(space);
              const isFlipped = canFlip && Boolean(flippedSpaceIds[space.id]);
              const businessImages = (space.business_image_urls ?? []).filter((url) =>
                Boolean(url?.trim())
              );
              const businessTitle =
                space.business_name?.trim() || `Negocio en ${meta.title}`;
              const businessDescription =
                space.business_description?.trim() ||
                "Negocio activo operando en Plaza Aragón, sobre la Avenida el Caliche en Olanchito.";
              const ctaLabel =
                space.status === "available"
                  ? "Solicitar este local"
                  : space.status === "construction"
                    ? "Reservar en preventa"
                    : "Quiero un espacio similar";

              const frontFace = (
                <div
                  inert={canFlip && isFlipped ? true : undefined}
                  aria-hidden={canFlip && isFlipped ? true : undefined}
                  className={`card flex flex-col justify-between transition duration-200 hover:shadow-md ${
                    canFlip ? "flip-card-face flip-card-face-front" : "h-full"
                  } ${canFlip && isFlipped ? "pointer-events-none z-1" : "z-2"} ${
                    isHighlighted ? "ring-2 ring-turquesa shadow-lg" : ""
                  }`}
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
                      <div className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-wider text-piedra">
                          {meta.subtitle}
                        </span>
                        <h3 className="mt-0.5 break-words font-display text-xl font-bold text-tinta">
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

                  <div className="mt-6 space-y-2.5 border-t border-crema/70 pt-4">
                    {canFlip && (
                      <button
                        ref={(el) => {
                          flipTriggerRefs.current[space.id] = el;
                        }}
                        type="button"
                        onClick={() => handleFlipCard(space.id, true)}
                        data-testid={`flip-space-btn-${idx + 1}`}
                        aria-label={`Ver negocio en ${meta.title}`}
                        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-selva/30 bg-selva-claro/45 px-3.5 py-2.5 text-sm font-bold text-selva transition duration-200 hover:border-selva/55 hover:bg-selva-claro/80 active:scale-[0.98] touch-manipulation"
                      >
                        <span className="inline-flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 9l1.5-4.5A2 2 0 0 1 6.4 3h11.2a2 2 0 0 1 1.9 1.5L21 9m-18 0a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2m-5 0h18m-13 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"
                            />
                          </svg>
                          <span>Ver negocio</span>
                        </span>
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openWaitlistModal(meta.fullLabel)}
                        data-testid={`waitlist-card-cta-${idx + 1}`}
                        className="btn-primary min-h-11 min-w-0 flex-1 px-3 py-2 text-[13px] sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        <span>{ctaLabel}</span>
                        <span aria-hidden="true">→</span>
                      </button>

                      <span
                        ref={(el) => {
                          shareContainerRefs.current[space.id] = el;
                        }}
                        className="relative inline-flex shrink-0"
                      >
                        <button
                          ref={(el) => {
                            shareBtnRefs.current[space.id] = el;
                          }}
                          type="button"
                          onClick={() => {
                            setDismissedTooltipId(null);
                            setOpenShareSpaceId((prev) => (prev === space.id ? null : space.id));
                          }}
                          onPointerLeave={() => {
                            if (dismissedTooltipId === space.id) setDismissedTooltipId(null);
                          }}
                          onBlur={() => {
                            if (dismissedTooltipId === space.id) setDismissedTooltipId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape" && !isShareMenuOpen) {
                              setDismissedTooltipId(space.id);
                            }
                          }}
                          data-testid={`share-space-btn-${idx + 1}`}
                          data-copied={copiedState[space.id] === "copied" ? "" : undefined}
                          data-failed={copiedState[space.id] === "failed" ? "" : undefined}
                          aria-label={`Compartir ${meta.title}`}
                          aria-haspopup="dialog"
                          aria-expanded={isShareMenuOpen}
                          className={`peer inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border transition duration-150 active:scale-[0.97] touch-manipulation ${
                            isFree
                              ? "border-turquesa/35 bg-turquesa-claro/65 text-azul hover:border-turquesa hover:bg-turquesa-claro"
                              : "border-crema bg-arena text-tinta hover:border-azul/35 hover:bg-crema/60 hover:text-azul"
                          }`}
                        >
                          {copiedState[space.id] === "copied" ? (
                            <svg
                              className="h-4.5 w-4.5 shrink-0 text-selva"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg
                              className="h-4.5 w-4.5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                              />
                            </svg>
                          )}
                        </button>

                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute -top-9 right-0 z-20 whitespace-nowrap rounded-lg bg-tinta px-2.5 py-1 text-[11px] font-bold text-white shadow-md transition-opacity duration-150 ${
                            isShareMenuOpen ||
                            copiedState[space.id] ||
                            dismissedTooltipId === space.id
                              ? "opacity-0"
                              : "opacity-0 peer-hover:opacity-100 peer-focus-visible:opacity-100"
                          }`}
                        >
                          Compartir
                        </span>

                        <span
                          role="status"
                          className={`pointer-events-none absolute -top-10 right-0 z-20 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold text-white shadow-md transition-opacity duration-150 ${
                            copiedState[space.id] === "failed" ? "bg-barro" : "bg-tinta"
                          } ${copiedState[space.id] ? "opacity-100" : "opacity-0"}`}
                        >
                          {copiedMessage[space.id] ?? ""}
                        </span>

                        {shareData && (
                          <div
                            data-testid={`share-menu-${idx + 1}`}
                            role="dialog"
                            aria-label={`Compartir ${meta.title}`}
                            className="absolute bottom-full right-0 z-30 mb-2 w-64 max-w-[calc(100vw-4rem)] rounded-2xl border border-crema bg-white p-3 text-left shadow-xl ring-1 ring-tinta/5"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2 border-b border-crema/80 pb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-azul">
                                Compartir en redes
                              </span>
                              <button
                                type="button"
                                onClick={() => setOpenShareSpaceId(null)}
                                aria-label={`Cerrar menú para compartir ${meta.title}`}
                                className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg bg-arena text-xs font-bold text-tinta transition hover:bg-crema"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              <a
                                href={shareData.whatsappShareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenShareSpaceId(null)}
                                data-testid={`share-whatsapp-${idx + 1}`}
                                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-crema/80 bg-arena/60 px-2.5 py-2 text-xs font-semibold text-tinta transition hover:border-whatsapp/50 hover:bg-whatsapp/10 hover:text-whatsapp-oscuro"
                              >
                                <WhatsAppGlyph variant="green" className="h-4 w-4 shrink-0" size={16} />
                                <span>WhatsApp</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => handleInstagramShare(space, idx)}
                                data-testid={`share-instagram-${idx + 1}`}
                                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-crema/80 bg-arena/60 px-2.5 py-2 text-xs font-semibold text-tinta transition hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10 hover:text-[#C13584]"
                              >
                                <svg className="h-4 w-4 shrink-0 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM16.5 6.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
                                </svg>
                                <span>Instagram</span>
                              </button>

                              <a
                                href={shareData.facebookShareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenShareSpaceId(null)}
                                data-testid={`share-facebook-${idx + 1}`}
                                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-crema/80 bg-arena/60 px-2.5 py-2 text-xs font-semibold text-tinta transition hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2]"
                              >
                                <svg className="h-4 w-4 shrink-0 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                                </svg>
                                <span>Facebook</span>
                              </a>

                              <a
                                href={shareData.xShareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenShareSpaceId(null)}
                                data-testid={`share-x-${idx + 1}`}
                                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-crema/80 bg-arena/60 px-2.5 py-2 text-xs font-semibold text-tinta transition hover:border-tinta/40 hover:bg-tinta/10"
                              >
                                <svg className="h-3.5 w-3.5 shrink-0 text-tinta" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                <span>X (Twitter)</span>
                              </a>

                              <a
                                href={shareData.linkedinShareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenShareSpaceId(null)}
                                data-testid={`share-linkedin-${idx + 1}`}
                                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-crema/80 bg-arena/60 px-2.5 py-2 text-xs font-semibold text-tinta transition hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]"
                              >
                                <svg className="h-4 w-4 shrink-0 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                                </svg>
                                <span>LinkedIn</span>
                              </a>

                              <a
                                href={shareData.telegramShareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenShareSpaceId(null)}
                                data-testid={`share-telegram-${idx + 1}`}
                                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-crema/80 bg-arena/60 px-2.5 py-2 text-xs font-semibold text-tinta transition hover:border-[#229ED9]/40 hover:bg-[#229ED9]/10 hover:text-[#229ED9]"
                              >
                                <svg className="h-4 w-4 shrink-0 text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.82-.27-1.47-.42-1.42-.88.03-.24.37-.48 1.02-.74 3.99-1.74 6.65-2.89 7.99-3.44 3.81-1.58 4.6-1.85 5.12-1.86.11 0 .37.03.54.17.14.12.18.28.2.45-.01.07-.01.24-.02.33z" />
                                </svg>
                                <span>Telegram</span>
                              </a>

                              <a
                                href={shareData.emailShareUrl}
                                onClick={() => setOpenShareSpaceId(null)}
                                data-testid={`share-email-${idx + 1}`}
                                className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-crema/80 bg-arena/60 px-2.5 py-2 text-xs font-semibold text-tinta transition hover:border-azul/40 hover:bg-azul/10 hover:text-azul"
                              >
                                <svg className="h-4 w-4 shrink-0 text-azul" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>Correo</span>
                              </a>
                            </div>

                            <hr className="my-2 border-crema/80" />

                            <div className="flex flex-col gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopySpaceLink(space, idx)}
                                data-testid={`share-copy-${idx + 1}`}
                                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-crema bg-arena px-3 py-2 text-xs font-bold text-tinta transition hover:border-azul/35 hover:bg-crema/60 hover:text-azul"
                              >
                                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copiar enlace</span>
                              </button>

                              {canNativeShare && (
                                <button
                                  type="button"
                                  onClick={() => handleNativeShare(space, idx)}
                                  data-testid={`share-native-${idx + 1}`}
                                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-turquesa-claro/70 px-3 py-2 text-xs font-bold text-azul transition hover:bg-turquesa-claro"
                                >
                                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  <span>Más opciones…</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );

              const backFace = canFlip ? (
                <div
                  inert={!isFlipped ? true : undefined}
                  aria-hidden={!isFlipped ? true : undefined}
                  data-testid={`space-back-face-${idx + 1}`}
                  className={`card flip-card-face flip-card-face-back flex flex-col justify-between bg-gradient-to-b from-white via-white to-arena/65 transition duration-200 hover:shadow-md ${
                    isFlipped ? "z-2" : "pointer-events-none z-1"
                  } ${isHighlighted ? "ring-2 ring-turquesa shadow-lg" : ""}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-wider text-piedra">
                          {meta.title} · {meta.subtitle}
                        </span>
                        <h3 className="mt-0.5 break-words font-display text-xl font-bold text-tinta">
                          {businessTitle}
                        </h3>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-selva-claro px-3 py-1 text-xs font-bold text-selva ring-1 ring-selva/20">
                        <span className="h-2 w-2 rounded-full bg-selva" aria-hidden="true" />
                        Negocio activo
                      </span>
                    </div>

                    <div className="mt-4">
                      {businessImages.length > 0 ? (
                        <SpaceGallery
                          images={businessImages}
                          name={businessTitle}
                          unitNumber={space.sort_order || idx + 1}
                          status={space.status}
                        />
                      ) : (
                        <div className="flex aspect-16/9 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-selva/20 bg-selva-claro/25 p-4 text-center">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-selva shadow-2xs ring-1 ring-selva/20"
                            aria-hidden="true"
                          >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 9l1.5-4.5A2 2 0 0 1 6.4 3h11.2a2 2 0 0 1 1.9 1.5L21 9m-18 0a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2m-5 0h18m-13 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-selva">
                              Vitrina comercial activa
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-piedra">
                              Operando en {meta.title} · {meta.area}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 break-words text-sm leading-relaxed text-piedra">
                      {businessDescription}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-arena px-3 py-2 text-xs text-piedra ring-1 ring-crema/80">
                      <span className="font-bold text-azul">{meta.title}</span>
                      <span aria-hidden="true">•</span>
                      <span>{meta.area}</span>
                      <span aria-hidden="true">•</span>
                      <span>Avenida el Caliche, Olanchito</span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-crema/70 pt-4">
                    <button
                      ref={(el) => {
                        flipBackBtnRefs.current[space.id] = el;
                      }}
                      type="button"
                      onClick={() => handleFlipCard(space.id, false)}
                      data-testid={`flip-back-btn-${idx + 1}`}
                      aria-label={`Volver al local ${meta.title}`}
                      className="btn-ghost min-h-11 w-full px-4 py-2.5 text-sm"
                    >
                      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a4 4 0 0 1 0 8H9m-6-8 4-4m-4 4 4 4" />
                      </svg>
                      <span>Volver al local</span>
                    </button>
                  </div>
                </div>
              ) : null;

              return (
                <article
                  id={`local-card-${space.id}`}
                  data-testid={`space-card-${space.id}`}
                  key={space.id}
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${idx + 1} de ${totalSlides}`}
                  className={`scroll-mt-24 flex w-[86%] shrink-0 snap-center flex-col sm:w-[72%] md:w-[46%] lg:w-[calc((100%-2.5rem)/3)] lg:snap-start ${
                    canFlip ? "flip-card-scene" : ""
                  } ${
                    isShareMenuOpen
                      ? "relative z-20"
                      : "relative transition duration-200 hover:-translate-y-0.5"
                  }`}
                >
                  {canFlip ? (
                    <div
                      className="flip-card-inner flex-1"
                      data-flipped={isFlipped ? "true" : "false"}
                    >
                      {frontFace}
                      {backFace}
                    </div>
                  ) : (
                    frontFace
                  )}
                </article>
              );
            })}

            <article
              data-testid="waitlist-opportunity-card"
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${totalSlides} de ${totalSlides}`}
              className="flex w-[86%] shrink-0 snap-center flex-col justify-between rounded-3xl border-2 border-dashed border-barro/40 bg-white/60 p-6 transition duration-200 hover:border-barro/70 hover:bg-white/90 hover:shadow-md sm:w-[72%] md:w-[46%] lg:w-[calc((100%-2.5rem)/3)] lg:snap-start"
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
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-whatsapp/15 ring-1 ring-whatsapp/35" aria-hidden="true">
                      <WhatsAppGlyph variant="green" className="h-3.5 w-3.5" size={14} />
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

          <p className="sr-only" role="status" aria-live="polite">
            {settledAnnouncement}
          </p>

          <nav
            aria-label="Seleccionar módulo comercial"
            data-testid="carousel-markers"
            className={`mt-4 flex flex-wrap items-center justify-center gap-1.5 ${
              hideDesktopControls ? "lg:hidden" : ""
            }`}
          >
            {Array.from({ length: totalSlides }).map((_, idx) => {
              const isActive = activeSlide === idx;
              const slideTitle =
                idx < primarySpaces.length
                  ? getSpaceDisplayMeta(primarySpaces[idx], idx).title
                  : "Lista prioritaria";
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToSlide(idx)}
                  aria-label={`Ir al módulo ${idx + 1}: ${slideTitle}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex min-h-11 min-w-7 cursor-pointer items-center justify-center px-1 touch-manipulation transition ${
                    isActive ? "text-azul" : "text-crema hover:text-piedra"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`block h-2.5 rounded-full transition-all duration-200 ${
                      isActive ? "w-7 bg-azul" : "w-2.5 bg-current"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
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
                  className="mx-auto inline-flex items-center justify-center rounded-2xl bg-whatsapp-oscuro px-5 py-3.5 shadow-xs ring-1 ring-whatsapp/30"
                  aria-hidden="true"
                >
                  <WhatsAppStackedLogo variant="green" className="h-11 w-auto" height={44} />
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
                    className="btn-whatsapp text-sm"
                  >
                    <WhatsAppGlyph variant="black" className="h-5 w-5 shrink-0" size={20} />
                    <span>Enviar registro por WhatsApp →</span>
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
                    {primarySpaces.map((space, idx) => {
                      const meta = getSpaceDisplayMeta(space, idx);
                      const optionLabel =
                        space.status === "available"
                          ? `${meta.fullLabel} • ${meta.area} (Disponible)`
                          : space.status === "construction"
                            ? `${meta.fullLabel} • ${meta.area} (Preventa)`
                            : `Similar a ${meta.fullLabel} • ${meta.area}`;
                      return (
                        <option key={space.id} value={meta.fullLabel}>
                          {optionLabel}
                        </option>
                      );
                    })}
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
                    <label htmlFor={phoneInputId} className="label inline-flex items-center gap-1.5">
                      <WhatsAppGlyph variant="green" className="h-3.5 w-3.5 shrink-0" size={14} />
                      <span>Teléfono / WhatsApp *</span>
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
                    className="btn-whatsapp min-h-11 px-5 py-2.5 text-sm"
                  >
                    <WhatsAppGlyph variant="black" className="h-4.5 w-4.5 shrink-0" size={18} />
                    <span>Registrarme en lista prioritaria →</span>
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

export { PlazaInteractiveSection as CatalogExplorer };
