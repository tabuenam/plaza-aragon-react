import { Logo } from "@/components/logo";
import { PlazaInteractiveSection } from "@/app/catalog-explorer";
import { getPublicSpaces } from "@/lib/data";
import type { Space } from "@/lib/types";
import Link from "next/link";

export const instant = false;

const fallbackSpaces: Space[] = [
  {
    id: "1",
    name: "Local 1",
    description:
      "Espacio comercial en planta baja con acceso directo a la calle principal, vitrina panorámica e iluminación natural.",
    price: 8000,
    status: "occupied",
    image_urls: [],
    sort_order: 1,
  },
  {
    id: "2",
    name: "Local 2",
    description:
      "Espacio comercial esquinero de alta visibilidad, ideal para farmacia, óptica o tienda de conveniencia.",
    price: 8000,
    status: "occupied",
    image_urls: [],
    sort_order: 2,
  },
  {
    id: "3",
    name: "Local 3",
    description:
      "Local comercial de nueva construcción con piso de porcelanato, baño privado y preparación para aire acondicionado.",
    price: 8500,
    status: "construction",
    image_urls: [],
    sort_order: 3,
  },
  {
    id: "4",
    name: "Local 4",
    description:
      "Espacio amplio diseñado para consultorio, bufete o atención al cliente en el corazón de Olanchito.",
    price: 8500,
    status: "construction",
    image_urls: [],
    sort_order: 4,
  },
  {
    id: "5",
    name: "Local 5",
    description:
      "Espacio premium con doble frente y área para almacenaje o bodega interna.",
    price: 9000,
    status: "construction",
    image_urls: [],
    sort_order: 5,
  },
];

const FAQS = [
  {
    q: "¿Cuál es la duración mínima y máxima de los contratos de arrendamiento?",
    a: "Ofrecemos contratos flexibles de 3, 6 o 12 meses renovables, adaptados tanto a negocios consolidados en Olanchito como a nuevos proyectos comerciales o sucursales.",
  },
  {
    q: "¿Qué servicios incluye cada local comercial?",
    a: "Cada módulo cuenta con baño privado interno, instalaciones eléctricas independientes (medidor propio), acabados en porcelanato, vitrina frontal hacia la vía pública y preparación para unidad de aire acondicionado.",
  },
  {
    q: "¿Cómo funciona el apartado en preventa de los locales en construcción?",
    a: "Los locales en etapa de obra pueden reservarse con condiciones preferenciales. Además, si aparta en preventa podemos coordinar ajustes menores de distribución o acabados según el giro de su negocio.",
  },
  {
    q: "¿Cómo se realizan y registran los pagos mensuales de renta?",
    a: "Cada inquilino recibe una cuenta de acceso al Portal Digital de Plaza Aragón. Desde su teléfono móvil puede tomar una foto al comprobante de transferencia bancaria, subirlo en segundos y consultar su historial verificado y su contrato vigente.",
  },
];

export default async function HomePage() {
  const fetchedSpaces = await getPublicSpaces();
  const spaces = fetchedSpaces.length > 0 ? fetchedSpaces : fallbackSpaces;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "50499999999";

  return (
    <div className="flex min-h-dvh flex-col bg-arena selection:bg-turquesa-claro selection:text-azul">
      {/* ───────────── STICKY HEADER ───────────── */}
      <header className="sticky top-0 z-30 border-b border-crema/90 bg-arena/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="inline-block">
            <Logo subtitle />
          </Link>

          <nav aria-label="Secciones principales" className="hidden items-center gap-6 md:flex">
            <a href="#locales" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Locales
            </a>
            <a href="#ventajas" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Ventajas en Olanchito
            </a>
            <a href="#proceso" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Cómo Arrendar
            </a>
            <a href="#preguntas" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Preguntas
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                "Hola, deseo información sobre los locales disponibles en Plaza Aragón, Olanchito."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-10 items-center justify-center gap-1.5 rounded-xl border border-crema bg-white px-3.5 py-2 text-xs font-bold text-tinta transition hover:border-piedra/40 hover:bg-crema/40 sm:inline-flex"
            >
              <span className="h-2 w-2 rounded-full bg-selva" />
              WhatsApp Directo
            </a>
            <Link
              href="/ingresar"
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-azul px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-azul-oscuro active:scale-95 sm:text-sm"
            >
              <svg className="h-4 w-4 text-maiz" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Portal de Inquilinos
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ───────────── HERO + INTERACTIVE CATALOG ───────────── */}
        <PlazaInteractiveSection spaces={spaces} whatsapp={whatsapp} />

        {/* ───────────── CIVIC ADVANTAGES & OLANCHITO CONTEXT ───────────── */}
        <section id="ventajas" className="border-y border-crema bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-barro" />
                Infraestructura Pensada para el Comercio Local
              </span>
              <h2 className="mt-2 font-display section-fluid-title font-bold text-azul">
                Por qué elegir Plaza Aragón en Olanchito
              </h2>
              <p className="mt-2 text-sm text-piedra sm:text-base">
                Combinamos una ubicación estratégica en el Valle del Aguán con instalaciones modernas y administración
                transparente para que usted se concentre en atender a sus clientes.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="card relative overflow-hidden bg-arena/55 transition hover:bg-arena">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-azul font-display text-base font-bold text-white shadow-xs">
                    01
                  </span>
                  <span className="font-mono text-[11px] font-bold tracking-wider text-azul/70 uppercase">
                    UBICACIÓN CÉNTRICA
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-azul">
                  Visibilidad en el Corazón de Olanchito
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-piedra">
                  Frente comercial directo hacia vía de alto flujo vehicular y peatonal. Ideal para farmacias,
                  clínicas, cafeterías, tiendas especializadas y oficinas de atención al público.
                </p>
              </div>

              <div className="card relative overflow-hidden bg-arena/55 transition hover:bg-arena">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-barro font-display text-base font-bold text-white shadow-xs">
                    02
                  </span>
                  <span className="font-mono text-[11px] font-bold tracking-wider text-barro uppercase">
                    AUTONOMÍA OPERATIVA
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-azul">
                  Servicios Independientes y Seguridad
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-piedra">
                  Medidores eléctricos individuales, sanitario privado en cada módulo, pisos de alto tráfico y
                  mantenimiento continuo de áreas exteriores e iluminación.
                </p>
              </div>

              <div className="card relative overflow-hidden bg-arena/55 transition hover:bg-arena">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-turquesa font-display text-base font-bold text-white shadow-xs">
                    03
                  </span>
                  <span className="font-mono text-[11px] font-bold tracking-wider text-turquesa uppercase">
                    PORTAL DIGITAL 24/7
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-azul">
                  Gestión de Pagos y Contrato Sin Papel
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-piedra">
                  Olvídese de recibos extraviados: suba la foto de su transferencia bancaria desde su celular, reciba
                  confirmación de verificación y consulte su contrato cuando lo necesite.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── 3-STEP LEASING & DIGITAL PORTAL FLOW ───────────── */}
        <section id="proceso" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="rounded-3xl border border-crema bg-gradient-to-br from-azul via-azul to-azul-oscuro p-6 text-white shadow-lg sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wider text-maiz uppercase">
                  Proceso Simple y Transparente
                </span>
                <h2 className="mt-4 font-display section-fluid-title font-bold text-white">
                  Estrene su local comercial en 3 pasos
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-crema/85 sm:text-base">
                  Sin trámites engorrosos. Trato directo con la administración de Plaza Aragón en Olanchito.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                      "Hola, me gustaría agendar una visita para ver los locales de Plaza Aragón en Olanchito."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-accent text-sm"
                  >
                    Agendar visita por WhatsApp
                  </a>
                  <Link
                    href="/ingresar"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Ya soy inquilino →
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xs">
                  <span className="font-mono text-xs font-bold text-maiz">PASO 01</span>
                  <h3 className="mt-2 font-display text-base font-bold text-white">Visita y Selección</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-crema/85">
                    Coordine por WhatsApp una visita presencial en Olanchito o elija su módulo en preventa.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xs">
                  <span className="font-mono text-xs font-bold text-turquesa-claro">PASO 02</span>
                  <h3 className="mt-2 font-display text-base font-bold text-white">Firma de Contrato</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-crema/85">
                    Acordamos plazo (3 a 12 meses), entregamos llaves y digitalizamos su contrato firmado.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xs">
                  <span className="font-mono text-xs font-bold text-selva-claro">PASO 03</span>
                  <h3 className="mt-2 font-display text-base font-bold text-white">Acceso al Portal</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-crema/85">
                    Reciba su cuenta de inquilino para reportar pagos mensuales desde su celular en segundos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── FAQ EXCLUSIVE ACCORDION ───────────── */}
        <section id="preguntas" className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="eyebrow justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-barro" />
              Dudas Frecuentes
            </span>
            <h2 className="mt-2 font-display section-fluid-title font-bold text-azul">
              Información clara antes de arrendar
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {FAQS.map((item, idx) => (
              <details
                key={idx}
                name="faq-plaza"
                open={idx === 0}
                className="group rounded-2xl border border-crema bg-white px-5 py-4 shadow-2xs transition open:border-azul/30 open:shadow-sm"
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
      </main>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="border-t border-crema bg-white">
        <div className="lenca-band h-2 w-full" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <Logo subtitle />
              <p className="mt-2 max-w-sm text-xs text-piedra">
                Espacios comerciales en renta y gestión digital de arrendamientos en Olanchito, Yoro, Honduras.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-piedra">
              <a href="#locales" className="hover:text-azul hover:underline">
                Catálogo de Locales
              </a>
              <span>·</span>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-azul hover:underline"
              >
                Contacto por WhatsApp
              </a>
              <span>·</span>
              <Link href="/ingresar" className="text-azul hover:underline">
                Acceso a Portal (Inquilinos y Administración) →
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-crema/70 pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-piedra">
            <p>© {new Date().getFullYear()} Plaza Aragón · Olanchito, Yoro, Honduras.</p>
            <p className="font-mono text-[11px] text-piedra/80">Moneda oficial: Lempira Hondureño (HNL)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

