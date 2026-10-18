import { PlazaInteractiveSection } from "@/app/catalog-explorer";
import { Logo } from "@/components/logo";
import { TechneticaCredit } from "@/components/technetica-credit";
import { getPublicSpaces } from "@/lib/data";
import { computeCatalogStats } from "@/lib/catalog";
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
      "Local comercial de nueva construcción con piso de porcelanato, baño privado y aire acondicionado instalado.",
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
    a: "Ofrecemos contratos flexibles de 6 a 12+ meses renovables, adaptados tanto a negocios consolidados en Olanchito como a nuevos proyectos comerciales o sucursales.",
  },
  {
    q: "¿Qué servicios incluye cada local comercial?",
    a: "Cada módulo cuenta con baño privado interno, instalaciones eléctricas independientes (medidor propio), acabados en porcelanato, vitrina frontal hacia la vía pública y aire acondicionado instalado.",
  },
  {
    q: "¿Cómo funciona el apartado en preventa de los locales en construcción?",
    a: "Los locales en etapa de obra pueden reservarse con condiciones preferenciales. Además, si aparta en preventa podemos coordinar ajustes menores de distribución o acabados según el giro de su negocio.",
  },
  {
    q: "¿Cómo se realizan y registran los pagos mensuales de renta?",
    a: "Cada inquilino recibe una cuenta de acceso al Portal Digital de Plaza Aragón. Desde su teléfono móvil puede tomar una foto al comprobante de transferencia bancaria, subirlo en segundos y consultar su historial verificado y su contrato vigente.",
  },
  {
    q: "¿De cuánto es el depósito de garantía y cómo se devuelve?",
    a: "El depósito de garantía equivale a un mes de renta. Este valor se reintegra al finalizar el contrato una vez desocupado el local, verificando que se entregue en las mismas buenas condiciones en las que fue recibido.",
  },
];

function buildStructuredData(
  spaces: Space[],
  stats: ReturnType<typeof computeCatalogStats>,
  baseUrl: string,
  whatsapp: string
) {
  const rawDigits = whatsapp.replace(/\D/g, "");
  const cleanPhone = rawDigits.length >= 8 ? rawDigits : "50499999999";
  const formattedPhone = cleanPhone.startsWith("504") ? `+${cleanPhone}` : `+504${cleanPhone}`;
  const priceDisplay =
    stats.minPrice > 0 && stats.maxPrice > 0
      ? `L. ${stats.minPrice.toLocaleString("es-HN")} - L. ${stats.maxPrice.toLocaleString("es-HN")} HNL`
      : "L. 8,000 - L. 9,000 HNL";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ShoppingCenter",
        "@id": `${baseUrl}/#place`,
        name: "Plaza Aragón",
        alternateName: "Plaza Comercial Aragón",
        description:
          "Locales comerciales en renta en Olanchito, Yoro, Honduras. Módulos con baño privado, medidor independiente y contratos flexibles de 6 a 12+ meses.",
        url: baseUrl,
        telephone: formattedPhone,
        image: `${baseUrl}/opengraph-image`,
        logo: `${baseUrl}/icon.svg`,
        priceRange: priceDisplay,
        currenciesAccepted: "HNL",
        paymentAccepted: "Transferencia bancaria, depósito",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Calle Principal",
          addressLocality: "Olanchito",
          addressRegion: "Yoro",
          addressCountry: "HN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 15.4811,
          longitude: -86.5742,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "08:00",
            closes: "18:00",
          },
        ],
        amenityFeature: [
          { "@type": "LocationFeatureSpecification", name: "Baño privado interno", value: true },
          { "@type": "LocationFeatureSpecification", name: "Medidor eléctrico independiente", value: true },
          { "@type": "LocationFeatureSpecification", name: "Aire acondicionado instalado", value: true },
          { "@type": "LocationFeatureSpecification", name: "Piso de porcelanato", value: true },
          { "@type": "LocationFeatureSpecification", name: "Vitrina comercial frontal", value: true },
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Catálogo de Locales Comerciales",
          itemListElement: spaces.map((space) => ({
            "@type": "Offer",
            name: space.name,
            description: space.description,
            price: space.price,
            priceCurrency: "HNL",
            availability:
              space.status === "available"
                ? "https://schema.org/InStock"
                : space.status === "construction"
                  ? "https://schema.org/PreOrder"
                  : "https://schema.org/SoldOut",
            url: `${baseUrl}/#locales`,
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: "Plaza Aragón",
        url: baseUrl,
        inLanguage: "es-HN",
        publisher: {
          "@id": `${baseUrl}/#place`,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${baseUrl}/#faq`,
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };
}

export default async function HomePage() {
  "use cache";
  const fetchedSpaces = await getPublicSpaces();
  const spaces = fetchedSpaces.length > 0 ? fetchedSpaces : fallbackSpaces;
  const stats = computeCatalogStats(spaces);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "50499999999";
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://plaza-aragon.com").trim().replace(/\/+$/, "");
  const structuredData = buildStructuredData(spaces, stats, baseUrl, whatsapp);

  return (
    <div className="flex min-h-dvh flex-col bg-arena selection:bg-turquesa-claro selection:text-azul">
      {/* Schema.org Structured Data (JSON-LD) for Rich Snippets & LLM Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* ───────────── STICKY HEADER (CLEAN & QUIET) ───────────── */}
      <header className="sticky top-0 z-30 border-b border-crema/90 bg-arena/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="inline-block">
            <Logo subtitle />
          </Link>

          <nav aria-label="Secciones principales" className="hidden items-center gap-7 md:flex">
            <a href="#locales" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Locales
            </a>
            <a href="#ventajas" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Qué incluye
            </a>
            <a href="#preguntas" className="text-sm font-semibold text-tinta transition hover:text-azul">
              Preguntas
            </a>
          </nav>

          <Link
            href="/ingresar"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-azul px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-azul-oscuro active:scale-95 sm:text-sm"
          >
            Portal de Inquilinos
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ───────────── HERO + INTERACTIVE CATALOG ───────────── */}
        <PlazaInteractiveSection spaces={spaces} whatsapp={whatsapp} />

        {/* ───────────── COMPACT 3-COLUMN BENEFITS STRIP ───────────── */}
        <section id="ventajas" className="defer-section border-y border-crema bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-azul sm:text-3xl">
              Por qué elegir Plaza Aragón
            </h2>
            <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-piedra sm:text-base">
              Plaza Aragón ofrece locales comerciales de alto estándar en el centro de Olanchito, Yoro, con contratos desde 6 hasta 12+ meses, cánones competitivos desde L. 8,000 mensuales, baño privado, medidor individual y portal digital para registrar comprobantes bancarios al instante.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-crema/80 bg-arena/40 p-5 transition duration-200 hover:border-azul/30 hover:bg-arena/70 hover:shadow-xs">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-azul font-display text-sm font-bold text-white">
                  01
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                  Ubicación céntrica en Olanchito
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                  Frente comercial directo con alto flujo vehicular y peatonal, ideal para comercio, clínica u oficina.
                </p>
              </div>

              <div className="rounded-2xl border border-crema/80 bg-arena/40 p-5 transition duration-200 hover:border-barro/30 hover:bg-arena/70 hover:shadow-xs">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-barro font-display text-sm font-bold text-white">
                  02
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                  Servicios independientes
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                  Cada local cuenta con medidor eléctrico propio, baño privado interno y acabados en porcelanato.
                </p>
              </div>

              <div className="rounded-2xl border border-crema/80 bg-arena/40 p-5 transition duration-200 hover:border-turquesa/30 hover:bg-arena/70 hover:shadow-xs">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-turquesa font-display text-sm font-bold text-white">
                  03
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-tinta">
                  Portal digital de pagos
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                  Suba su comprobante bancario desde el teléfono móvil y consulte su contrato e historial en línea.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── FAQ ACCORDION ───────────── */}
        <section id="preguntas" className="defer-section mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-azul sm:text-3xl">
            Preguntas frecuentes
          </h2>

          <div className="mt-6 space-y-3">
            {FAQS.map((item, idx) => (
              <details
                key={idx}
                name="faq-plaza"
                open={idx === 0}
                className="group rounded-2xl border border-crema bg-white px-5 py-4 transition open:border-azul/30"
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <Logo subtitle />
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-piedra">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-azul hover:underline"
              >
                WhatsApp
              </a>
              <span>·</span>
              <Link href="/ingresar" className="text-azul hover:underline">
                Portal de Inquilinos →
              </Link>
              <span>·</span>
              <span>© {new Date().getFullYear()} Plaza Aragón</span>
              <span>·</span>
              <TechneticaCredit />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


