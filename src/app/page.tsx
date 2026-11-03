import { PlazaInteractiveSection } from "@/app/catalog-explorer";
import { Logo } from "@/components/logo";
import { TechneticaCredit } from "@/components/technetica-credit";
import { WhatsAppGlyph, WhatsAppInlineLogo } from "@/components/whatsapp-brand";
import {
  buildStructuredData,
  computeCatalogStats,
  FAQS,
  getAppPhoneDigits,
  getAppPhoneDisplay,
} from "@/lib/catalog";
import { getPublicSpaces } from "@/lib/data";
import type { Space } from "@/lib/types";
import Link from "next/link";

export { buildStructuredData, FAQS };

export const instant = false;

const fallbackSpaces: Space[] = [
  {
    id: "1",
    name: "Local Pacura",
    description:
      "Establece tu presencia en el centro de la ciudad cívica. Exclusivo módulo esquinero de 70 m² en planta baja con vitrina panorámica hacia la Avenida el Caliche, contiguo a Hotel Olanchito y a 120m del Parque Central.",
    price: 8000,
    status: "occupied",
    image_urls: [],
    sort_order: 1,
  },
  {
    id: "2",
    name: "Local Corozal",
    description:
      "Módulo comercial central frontal de 70 m² en planta baja con acceso directo a pie de calle, vitrina panorámica de vidrio templado, piso de porcelanato, baño privado y medidor eléctrico independiente.",
    price: 8000,
    status: "occupied",
    image_urls: [],
    sort_order: 2,
  },
];

const TECHNICAL_SPECS = [
  { label: "Área útil", value: "70 m² por módulo" },
  { label: "Frente comercial", value: "~7 metros de vitrina frontal" },
  { label: "Altura libre", value: "3.00 metros" },
  { label: "Suministro eléctrico", value: "110V / 220V con medidor individual" },
  { label: "Suministro de agua", value: "Conexión y cisterna independiente" },
  { label: "Internet/Telecom", value: "Disponibilidad de fibra óptica local" },
  { label: "Estacionamiento", value: "Área asignada frontal y para clientes" },
  { label: "Acceso", value: "Horario comercial amplio lunes a sábado" },
];

const RECOMMENDED_SECTORS = [
  "Farmacias",
  "Clínicas y Consultorios",
  "Bufetes Legales",
  "Boutiques",
  "Cafeterías",
  "Servicios Financieros",
  "Tiendas de Tecnología",
];

const LEASE_STEPS = [
  {
    step: "Paso 01",
    title: "Registro o Contacto",
    description: "Únete a la lista de espera o coordina una visita por WhatsApp.",
  },
  {
    step: "Paso 02",
    title: "Reserva y Depósito",
    description: "Reserva del módulo con depósito de garantía de 1 mes.",
  },
  {
    step: "Paso 03",
    title: "Firma de Contrato",
    description: "Formalización del contrato de arrendamiento (6 a 12+ meses).",
  },
  {
    step: "Paso 04",
    title: "Llaves y Acceso Digital",
    description: "Entrega inmediata del local y credenciales de acceso al Portal de Inquilinos.",
  },
];

export default async function HomePage() {
  "use cache";
  const fetchedSpaces = await getPublicSpaces();
  const spaces = fetchedSpaces.length > 0 ? fetchedSpaces : fallbackSpaces;
  const stats = computeCatalogStats(spaces);
  const whatsapp = getAppPhoneDigits();
  const phoneDisplay = getAppPhoneDisplay();
  const whatsappWaitlistUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "Hola, quiero información sobre la lista de espera en Plaza Aragón"
  )}`;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://plaza-aragon.com").trim().replace(/\/+$/, "");
  const structuredData = buildStructuredData(spaces, stats, baseUrl, phoneDisplay);

  return (
    <div className="flex min-h-dvh flex-col bg-arena selection:bg-turquesa-claro selection:text-azul">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="sticky top-0 z-30 border-b border-crema/90 bg-arena/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
          <Link href="/" className="inline-block shrink-0">
            <Logo subtitle />
          </Link>

          <nav aria-label="Navegación principal" className="hidden items-center gap-7 lg:flex">
            <a href="#locales" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Locales
            </a>
            <a href="#beneficios" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Ventajas
            </a>
            <a href="#ubicacion" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Ubicación y Ficha
            </a>
            <a href="#preguntas" className="text-sm font-semibold text-tinta transition hover:text-azul">
              FAQ
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              href="/ingresar"
              className="hidden min-h-10 items-center justify-center rounded-xl border border-crema bg-white px-3.5 py-2 text-xs font-bold text-tinta transition hover:border-azul/30 hover:text-azul sm:inline-flex sm:text-sm"
            >
              Portal de Inquilinos
            </Link>

            <a
              href={whatsappWaitlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="header-whatsapp-cta"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-whatsapp px-3.5 py-2 text-xs font-extrabold text-whatsapp-oscuro shadow-2xs transition hover:bg-[#1fe05f] active:scale-95 sm:px-4 sm:text-sm"
            >
              <WhatsAppInlineLogo variant="black" className="h-4 w-auto sm:h-4.5" height={18} />
              <span className="sr-only">WhatsApp</span>
            </a>

            <details className="relative lg:hidden">
              <summary
                aria-label="Abrir menú de navegación"
                className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-crema bg-white text-tinta transition hover:bg-arena [&::-webkit-details-marker]:hidden"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </summary>
              <nav
                aria-label="Menú móvil"
                className="absolute right-0 mt-2 w-60 rounded-2xl border border-crema bg-white p-3 shadow-xl ring-1 ring-tinta/5"
              >
                <ul className="space-y-1 text-sm font-semibold text-tinta">
                  <li>
                    <a href="#locales" className="block rounded-xl px-3 py-2.5 hover:bg-arena hover:text-azul">
                      Locales
                    </a>
                  </li>
                  <li>
                    <a href="#beneficios" className="block rounded-xl px-3 py-2.5 hover:bg-arena hover:text-azul">
                      Ventajas
                    </a>
                  </li>
                  <li>
                    <a href="#ubicacion" className="block rounded-xl px-3 py-2.5 hover:bg-arena hover:text-azul">
                      Ubicación y Ficha
                    </a>
                  </li>
                  <li>
                    <a href="#preguntas" className="block rounded-xl px-3 py-2.5 hover:bg-arena hover:text-azul">
                      FAQ
                    </a>
                  </li>
                  <li className="border-t border-crema pt-1.5">
                    <Link
                      href="/ingresar"
                      className="block rounded-xl bg-arena px-3 py-2.5 font-bold text-azul hover:bg-crema/60"
                    >
                      Portal de Inquilinos →
                    </Link>
                  </li>
                </ul>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <PlazaInteractiveSection spaces={spaces} whatsapp={whatsapp} />

        <section id="beneficios" className="defer-section scroll-mt-16 border-y border-crema bg-white py-12 sm:py-16">
          <div id="ventajas" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="eyebrow">Ventajas Competitivas</span>
            <h2 className="section-fluid-title mt-2 font-display font-bold text-azul">
              Beneficios y ventajas comerciales
            </h2>
            <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-piedra sm:text-base">
              Infraestructura moderna pensada para comerciantes, médicos, abogados, franquicias y emprendedores que buscan prestigio y control total de sus costos operativos en Olanchito.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-crema/80 bg-arena/40 p-6 transition duration-200 hover:border-azul/30 hover:bg-arena/70 hover:shadow-xs">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-azul text-white shadow-2xs"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                  Ubicación Prime
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                  En el corazón de Olanchito, a 30m del Hotel Olanchito y a 120m del Parque Central.
                </p>
              </div>

              <div className="rounded-2xl border border-crema/80 bg-arena/40 p-6 transition duration-200 hover:border-barro/30 hover:bg-arena/70 hover:shadow-xs">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-barro text-white shadow-2xs"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                  Servicios 100% Independientes
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                  Medidor eléctrico individual y baño privado interno por local; paga solo lo que consume.
                </p>
              </div>

              <div className="rounded-2xl border border-crema/80 bg-arena/40 p-6 transition duration-200 hover:border-selva/30 hover:bg-arena/70 hover:shadow-xs">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-selva text-white shadow-2xs"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                  Seguridad y Confianza
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                  Preparación para CCTV, cerramiento nocturno seguro e iluminación perimetral.
                </p>
              </div>

              <div className="rounded-2xl border border-crema/80 bg-arena/40 p-6 transition duration-200 hover:border-maiz/40 hover:bg-arena/70 hover:shadow-xs">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-maiz text-azul-oscuro shadow-2xs"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                  Acabados de Primera
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                  Pisos de porcelanato de alto tráfico, vitrina de vidrio templado y aire acondicionado instalado.
                </p>
              </div>

              <div className="rounded-2xl border border-crema/80 bg-arena/40 p-6 transition duration-200 hover:border-azul/30 hover:bg-arena/70 hover:shadow-xs">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-azul-oscuro text-white shadow-2xs"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                  Arrendamiento Flexible
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                  Contratos claros de 6 a 12+ meses renovables con condiciones transparentes.
                </p>
              </div>

              <div className="rounded-2xl border border-crema/80 bg-arena/40 p-6 transition duration-200 hover:border-turquesa/30 hover:bg-arena/70 hover:shadow-xs">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-turquesa text-white shadow-2xs"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                  Portal Digital Integrado
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                  Comprobantes de pago bancario reportados desde el teléfono en segundos con historial verificado.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="ubicacion" className="defer-section scroll-mt-16 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <span className="eyebrow">Punto Estratégico en Yoro</span>
            <h2 className="section-fluid-title mt-2 font-display font-bold text-azul">
              Ubicación en mapa y ficha técnica
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-piedra sm:text-base">
              Situada sobre la Avenida el Caliche de Olanchito, en el corredor comercial de mayor plusvalía y tránsito peatonal de la ciudad.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="card flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-bold text-tinta">
                      Centro de Olanchito, Yoro
                    </h3>
                    <p className="text-xs font-medium text-piedra">
                      Avenida el Caliche • Coordenadas: 15.4811° N, -86.5742° O
                    </p>
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=15.4811,-86.5742"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-azul/10 px-3 py-1.5 text-xs font-bold text-azul transition hover:bg-azul hover:text-white"
                  >
                    <span>Abrir en Google Maps</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>

                <div
                  role="img"
                  aria-label="Mapa esquemático de ubicación de Plaza Aragón en Avenida el Caliche de Olanchito, a 30 metros de Hotel Olanchito y 120 metros del Parque Central"
                  className="relative mt-4 overflow-hidden rounded-2xl border border-crema bg-arena p-4 blueprint-grid"
                >
                  <svg viewBox="0 0 520 280" className="h-auto w-full" aria-hidden="true">
                    <rect width="520" height="280" rx="14" fill="#f8f4ec" />
                    <path d="M0 70 H520 M0 210 H520 M130 0 V280 M390 0 V280" stroke="#e5dac7" strokeWidth="10" />
                    <path d="M0 140 H520" stroke="#ffffff" strokeWidth="26" />
                    <path d="M0 140 H520" stroke="#df9b1a" strokeWidth="2" strokeDasharray="8 8" />
                    <text x="235" y="133" fill="#52606d" fontSize="10" fontWeight="700" letterSpacing="1">
                      Avenida el Caliche DE OLANCHITO
                    </text>

                    <g transform="translate(332, 36)">
                      <rect x="0" y="0" width="154" height="68" rx="10" fill="#d7eee2" stroke="#1f5e43" strokeWidth="1.75" />
                      <circle cx="22" cy="34" r="9" fill="#1f5e43" />
                      <text x="38" y="30" fill="#1f5e43" fontSize="11" fontWeight="800">
                        Parque Central
                      </text>
                      <text x="38" y="45" fill="#1f5e43" fontSize="9.5" fontWeight="600">
                        de Olanchito (a 120 m)
                      </text>
                    </g>

                    <g transform="translate(210, 165)">
                      <rect x="0" y="0" width="128" height="58" rx="10" fill="#daf0f5" stroke="#1693ad" strokeWidth="1.75" />
                      <circle cx="20" cy="29" r="8" fill="#1693ad" />
                      <text x="34" y="26" fill="#0b3d66" fontSize="11" fontWeight="800">
                        Hotel Olanchito
                      </text>
                      <text x="34" y="40" fill="#52606d" fontSize="9.5" fontWeight="600">
                        Contiguo (a 30 m)
                      </text>
                    </g>

                    <g transform="translate(55, 88)">
                      <circle cx="65" cy="52" r="26" fill="#b84a24" fillOpacity="0.16" />
                      <rect x="0" y="0" width="142" height="64" rx="12" fill="#0b3d66" stroke="#df9b1a" strokeWidth="2.5" />
                      <circle cx="22" cy="32" r="9" fill="#b84a24" stroke="#ffffff" strokeWidth="2" />
                      <text x="38" y="27" fill="#ffffff" fontSize="12" fontWeight="800">
                        PLAZA ARAGÓN
                      </text>
                      <text x="38" y="42" fill="#fdf0cf" fontSize="9.5" fontWeight="700">
                        Pacura • Corozal
                      </text>
                    </g>

                    <path d="M197 125 L220 165" stroke="#b84a24" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M197 110 L350 78" stroke="#1f5e43" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-arena p-3.5 ring-1 ring-crema/90">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-barro">
                      Ubicación central
                    </span>
                    <p className="mt-1 font-display text-sm font-bold text-tinta">
                      Plaza Aragón
                    </p>
                    <p className="text-xs text-piedra">Avenida el Caliche, Planta Baja</p>
                  </div>

                  <div className="rounded-2xl bg-arena p-3.5 ring-1 ring-crema/90">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-turquesa">
                      A 30 metros
                    </span>
                    <p className="mt-1 font-display text-sm font-bold text-tinta">
                      Hotel Olanchito
                    </p>
                    <p className="text-xs text-piedra">Referencia inmediata contigua</p>
                  </div>

                  <div className="rounded-2xl bg-arena p-3.5 ring-1 ring-crema/90">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-selva">
                      A 120 metros
                    </span>
                    <p className="mt-1 font-display text-sm font-bold text-tinta">
                      Parque Central
                    </p>
                    <p className="text-xs text-piedra">2 minutos caminando</p>
                  </div>
                </div>
              </div>

              <p className="mt-5 border-t border-crema/80 pt-4 text-xs leading-relaxed text-piedra">
                Dirección exacta: <strong>Avenida el Caliche, contiguo a Hotel Olanchito, a 120m del Parque Central, Olanchito, Yoro, Honduras.</strong>
              </p>
            </div>

            <div className="card flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-tinta">
                  Ficha técnica por módulo
                </h3>
                <p className="mt-1 text-xs text-piedra sm:text-sm">
                  Especificaciones constructivas estándar en los locales de Plaza Aragón.
                </p>

                <dl className="mt-5 divide-y divide-crema/80 rounded-2xl border border-crema bg-arena/50 px-4">
                  {TECHNICAL_SPECS.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <dt className="text-xs font-bold uppercase tracking-wide text-piedra">
                        {spec.label}
                      </dt>
                      <dd className="text-sm font-bold text-tinta sm:text-right">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-6 border-t border-crema/80 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-azul">
                  Giro comercial recomendado
                </h4>
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Giros comerciales recomendados">
                  {RECOMMENDED_SECTORS.map((sector) => (
                    <li
                      key={sector}
                      className="rounded-full bg-turquesa-claro/70 px-3.5 py-1.5 text-xs font-bold text-azul ring-1 ring-azul/15"
                    >
                      {sector}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="defer-section border-y border-crema bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="eyebrow">Trámite Ágil y Transparente</span>
              <h2 className="section-fluid-title mt-2 font-display font-bold text-azul">
                Proceso de arrendamiento en 4 pasos
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-piedra sm:text-base">
                Sin burocracia innecesaria: desde el primer contacto hasta la entrega de llaves y activación de tu Portal de Inquilinos.
              </p>
            </div>

            <ol className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-4">
              {LEASE_STEPS.map((item, index) => (
                <li
                  key={item.step}
                  className="relative flex flex-col justify-between rounded-2xl border border-crema bg-arena/50 p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-xl bg-azul px-3 py-1 font-display text-xs font-bold text-white">
                        {item.step}
                      </span>
                      <span className="font-mono text-xs font-bold text-piedra/70" aria-hidden="true">
                        0{index + 1}/04
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                      {item.description}
                    </p>
                  </div>
                  {index === 0 && (
                    <div className="mt-4 border-t border-crema/70 pt-3">
                      <a
                        href={whatsappWaitlistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-whatsapp-oscuro hover:underline"
                      >
                        <WhatsAppGlyph variant="green" className="h-4 w-4 shrink-0" size={16} />
                        <span>Escribir por WhatsApp →</span>
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="preguntas" className="defer-section scroll-mt-16 mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="text-center">
            <span className="eyebrow">Resolvemos tus dudas</span>
            <h2 className="section-fluid-title mt-2 font-display font-bold text-azul">
              Preguntas frecuentes
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-piedra sm:text-base">
              Todo lo que necesitas saber sobre contratos, servicios independientes, lista de espera y operación en Plaza Aragón.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {FAQS.map((item, idx) => (
              <details
                key={idx}
                name="faq-plaza"
                open={idx === 0}
                className="group rounded-2xl border border-crema bg-white px-5 py-4 transition open:border-azul/30 open:shadow-xs"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-bold text-tinta transition hover:text-azul [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-arena text-azul transition-transform duration-200 group-open:rotate-180 group-open:bg-azul group-open:text-white"
                  >
                    ↓
                  </span>
                </summary>
                <p className="mt-3 border-t border-crema/70 pt-3 text-sm leading-relaxed text-piedra">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="defer-section border-t border-crema bg-gradient-to-b from-azul-oscuro to-azul py-12 text-white sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-maiz-claro ring-1 ring-white/15">
                  Tecnología para Arrendatarios
                </span>
                <h2 className="section-fluid-title mt-3 font-display font-bold text-white">
                  Portal de Inquilinos y Atención Directa
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-crema/90 sm:text-base">
                  Olvídate del papeleo físico. Nuestros arrendatarios gestionan sus pagos mensuales y consultan su contrato desde cualquier teléfono móvil:
                </p>

                <ol className="mt-6 space-y-3.5">
                  <li className="flex items-start gap-3.5 rounded-2xl border border-white/15 bg-white/10 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-maiz font-display text-sm font-black text-azul-oscuro">
                      1
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-white">
                        Fotografía al comprobante de transferencia bancaria desde el móvil
                      </h3>
                      <p className="mt-0.5 text-xs text-crema/85 sm:text-sm">
                        Realiza tu transferencia en Lempiras y captura el recibo desde la cámara de tu celular.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3.5 rounded-2xl border border-white/15 bg-white/10 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-turquesa font-display text-sm font-black text-white">
                      2
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-white">
                        Carga en 3 segundos a la plataforma
                      </h3>
                      <p className="mt-0.5 text-xs text-crema/85 sm:text-sm">
                        Compresión inteligente automática incluso con señal móvil moderada.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3.5 rounded-2xl border border-white/15 bg-white/10 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-selva font-display text-sm font-black text-white">
                      3
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-white">
                        Estado de cuenta verificado y contrato digital siempre a la mano
                      </h3>
                      <p className="mt-0.5 text-xs text-crema/85 sm:text-sm">
                        Historial auditable de pagos mensuales y descarga de documentos firmados 24/7.
                      </p>
                    </div>
                  </li>
                </ol>

                <div className="mt-7 flex flex-wrap items-center gap-3.5">
                  <Link
                    href="/ingresar"
                    className="btn bg-white text-azul-oscuro shadow-md hover:bg-crema"
                  >
                    Ingresar al Portal de Inquilinos →
                  </Link>
                  <a
                    href={whatsappWaitlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                  >
                    <WhatsAppGlyph variant="black" className="h-5 w-5 shrink-0" size={20} />
                    <span>Contactar Administración por WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="mx-auto max-w-sm rounded-[2rem] border-4 border-white/20 bg-arena p-5 text-tinta shadow-2xl">
                  <div className="flex items-center justify-between border-b border-crema pb-3">
                    <Logo />
                    <span className="rounded-full bg-selva-claro px-2.5 py-0.5 text-[11px] font-bold text-selva">
                      Portal Activo
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-crema">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-piedra">
                        Arrendamiento Vigente
                      </span>
                      <span className="rounded-full bg-selva-claro px-2.5 py-0.5 text-[10px] font-bold uppercase text-selva">
                        Verificado
                      </span>
                    </div>
                    <p className="mt-1 font-display text-lg font-bold text-azul">
                      Local Pacura • 70 m²
                    </p>
                    <p className="text-xs text-piedra">Canon mensual: L. 8,000.00 HNL</p>

                    <div className="mt-3 flex items-center justify-between rounded-xl bg-arena px-3 py-2 text-xs">
                      <span className="font-semibold text-tinta">Comprobante Noviembre 2026</span>
                      <span className="font-bold text-selva">✓ Subido (3s)</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-azul-oscuro p-4 text-white">
                    <h3 className="font-display text-sm font-bold text-maiz-claro">
                      Contacto Directo Administración
                    </h3>
                    <dl className="mt-2.5 space-y-2 text-xs text-crema/95">
                      <div>
                        <dt className="font-bold text-white">Dirección:</dt>
                        <dd>Plaza Aragón, Avenida el Caliche, Olanchito, Yoro, Honduras.</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-white">Teléfono / WhatsApp:</dt>
                        <dd className="mt-0.5">
                          <a
                            href={whatsappWaitlistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-bold text-whatsapp underline decoration-whatsapp/50 underline-offset-2 transition hover:text-white"
                          >
                            <WhatsAppGlyph variant="green" className="h-3.5 w-3.5 shrink-0" size={14} />
                            <span>{phoneDisplay}</span>
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold text-white">Horario de atención:</dt>
                        <dd>Lunes a Sábado de 08:00 a 18:00</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-crema bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Logo subtitle />
              <p className="mt-3 max-w-md text-xs leading-relaxed text-piedra sm:text-sm">
                Locales comerciales modernos de 70 m² en el centro de Olanchito, Yoro, Honduras. Contiguo a Hotel Olanchito, a 120m del Parque Central.
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-tinta">
                <span className="inline-flex items-center gap-1.5">
                  <WhatsAppGlyph variant="green" className="h-4 w-4 shrink-0" size={16} />
                  <span>WhatsApp Oficial:</span>
                </span>
                <a
                  href={whatsappWaitlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-whatsapp/15 px-2.5 py-1 font-extrabold text-whatsapp-oscuro ring-1 ring-whatsapp/35 transition hover:bg-whatsapp"
                >
                  <span>{phoneDisplay}</span>
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-tinta">
                Navegación Rápida
              </h3>
              <ul className="mt-3 space-y-2 text-xs font-semibold text-piedra sm:text-sm">
                <li>
                  <a href="#locales" className="hover:text-azul hover:underline">
                    Locales y Lista de Espera
                  </a>
                </li>
                <li>
                  <a href="#beneficios" className="hover:text-azul hover:underline">
                    Ventajas Comerciales
                  </a>
                </li>
                <li>
                  <a href="#ubicacion" className="hover:text-azul hover:underline">
                    Ubicación y Ficha Técnica
                  </a>
                </li>
                <li>
                  <a href="#preguntas" className="hover:text-azul hover:underline">
                    Preguntas Frecuentes (FAQ)
                  </a>
                </li>
                <li>
                  <Link href="/ingresar" className="font-bold text-azul hover:underline">
                    Portal de Inquilinos →
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-tinta">
                Información Legal
              </h3>
              <div className="mt-3 space-y-2 text-xs text-piedra">
                <details className="group">
                  <summary className="cursor-pointer font-semibold hover:text-azul">
                    Términos de arrendamiento
                  </summary>
                  <p className="mt-1 rounded-xl bg-arena p-2.5 text-[11px] leading-relaxed text-tinta">
                    Contratos comerciales de 6 a 12+ meses renovables, canon en Lempiras (HNL), depósito de garantía de 1 mes y servicios eléctricos independientes por medidor.
                  </p>
                </details>

                <details className="group">
                  <summary className="cursor-pointer font-semibold hover:text-azul">
                    Contrato modelo de referencia
                  </summary>
                  <p className="mt-1 rounded-xl bg-arena p-2.5 text-[11px] leading-relaxed text-tinta">
                    El formato de contrato comercial de Plaza Aragón está disponible para revisión previa durante su visita presencial o solicitándolo por WhatsApp al {phoneDisplay}.
                  </p>
                </details>

                <details className="group">
                  <summary className="cursor-pointer font-semibold hover:text-azul">
                    Aviso de privacidad
                  </summary>
                  <p className="mt-1 rounded-xl bg-arena p-2.5 text-[11px] leading-relaxed text-tinta">
                    Los datos de contacto proporcionados en la lista de espera y el Portal de Inquilinos se utilizan exclusivamente para la gestión comercial y contractual de Plaza Aragón.
                  </p>
                </details>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-crema pb-14 pt-6 text-xs font-semibold text-piedra sm:flex-row sm:items-center sm:pb-2 sm:pr-52">
            <span>© 2026 Plaza Aragón. Todos los derechos reservados.</span>
            <TechneticaCredit />
          </div>
        </div>
      </footer>

      <a
        href={whatsappWaitlistUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="¿Consultas? Escríbenos por WhatsApp"
        data-testid="floating-whatsapp-button"
        className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full bg-whatsapp px-4 py-3 text-whatsapp-oscuro shadow-lg ring-2 ring-white transition duration-200 hover:scale-105 hover:bg-[#1fe05f] active:scale-95"
      >
        <span className="hidden text-xs font-extrabold tracking-tight sm:inline">
          ¿Consultas? Escríbenos
        </span>
        <WhatsAppGlyph variant="black" className="h-6 w-6 shrink-0" size={24} />
      </a>
    </div>
  );
}
