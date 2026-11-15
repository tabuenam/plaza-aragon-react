import { formatMoney } from "./format.ts";
import {
  DEFAULT_PHONE_DIGITS,
  DEFAULT_PHONE_DISPLAY,
  DEFAULT_PHONE_NUMBER,
  cleanPhoneDigits,
  formatPhoneDisplay,
  getAppPhoneDigits,
  getAppPhoneDisplay,
  getAppPhoneNumber,
  getWhatsAppLink,
} from "./phone.ts";
import type { Space } from "./types.ts";

export type FilterOption = "all" | "open" | "occupied";

export type SpaceDisplayMeta = {
  title: string;
  subtitle: string;
  fullLabel: string;
  area: string;
  description: string;
};

export type SpaceShareData = {
  title: string;
  text: string;
  url: string;
  clipboardText: string;
  whatsappShareUrl: string;
  facebookShareUrl: string;
  xShareUrl: string;
  linkedinShareUrl: string;
  telegramShareUrl: string;
  emailShareUrl: string;
  isFree: boolean;
};

export {
  DEFAULT_PHONE_DIGITS,
  DEFAULT_PHONE_DISPLAY,
  DEFAULT_PHONE_NUMBER,
  cleanPhoneDigits,
  formatPhoneDisplay,
  getAppPhoneDigits,
  getAppPhoneDisplay,
  getAppPhoneNumber,
  getWhatsAppLink
};

export const OFFICIAL_WHATSAPP_DIGITS = getAppPhoneDigits();
export const OFFICIAL_PHONE_DISPLAY = getAppPhoneDisplay();

const SPACE_HIGHLIGHTS: Record<number, string[]> = {
  1: ["Planta baja", "Vitrina panorámica", "Acceso directo"],
  2: ["Esquinero", "Alta visibilidad", "Medidor propio"],
  3: ["Porcelanato", "Baño privado", "A/C instalado"],
  4: ["Ideal consultorio", "Iluminación LED", "Baño privado"],
  5: ["Doble frente", "Área de bodega", "Mayor metraje"],
};

export const PACURA_TAGS = [
  "Planta baja",
  "Esquinero",
  "Vitrina panorámica",
  "Acceso directo",
  "Medidor propio",
  "Porcelanato",
  "A/C instalado",
  "Baño privado",
  "Parqueo",
];

export const COROZAL_TAGS = [
  "Planta baja",
  "Vitrina panorámica",
  "Acceso directo",
  "Medidor propio",
  "Porcelanato",
  "A/C instalado",
  "Baño privado",
  "Parqueo",
];

export const FAQS = [
  {
    q: "¿Cuál es la duración mínima y máxima de los contratos de arrendamiento?",
    a: "Ofrecemos contratos flexibles desde 6 meses renovables, adaptados tanto a negocios consolidados en Olanchito como a nuevos proyectos comerciales, clínicas o sucursales.",
  },
  {
    q: "¿Qué servicios incluye cada local comercial?",
    a: "Cada módulo de 70 m² cuenta con baño privado interno, instalaciones eléctricas independientes (medidor propio 110V/220V), acabados en porcelanato, vitrina panorámica frontal hacia la calle principal y aire acondicionado instalado.",
  },
  {
    q: "¿Cómo funciona el apartado en preventa de nuevos módulos?",
    a: "Al registrarte en la lista de espera prioritaria, recibes notificación preferencial cuando un local se libere o cuando aperturemos la siguiente fase comercial, permitiéndote reservar con condiciones preferenciales y coordinar adecuaciones según el giro de tu negocio.",
  },
  {
    q: "¿Cómo se realizan y registran los pagos mensuales de renta?",
    a: "Cada inquilino recibe una cuenta de acceso al Portal Digital de Plaza Aragón. Desde su teléfono móvil puede tomar una foto al comprobante de transferencia bancaria, subirlo en 3 segundos y consultar su estado de cuenta verificado y su contrato vigente.",
  },
  {
    q: "¿De cuánto es el depósito de garantía y cómo se devuelve?",
    a: "El depósito de garantía equivale a un mes de renta (L. 8,000). Este valor se reintegra al finalizar el contrato una vez desocupado el local, verificando que se entregue en las mismas buenas condiciones en las que fue recibido.",
  },
  {
    q: "¿Hay costo de mantenimiento o cuota comunal adicional?",
    a: "No cobramos cuotas comunales ocultas. La renta mensual es transparente desde L. 8,000/mes y cada local posee su propio medidor eléctrico independiente para que pague únicamente lo que consume.",
  },
  {
    q: "¿Cuántos espacios de estacionamiento incluye y hay parqueo para clientes?",
    a: "La plaza cuenta con área de estacionamiento frontal asignada y espacio para clientes directamente sobre la Calle Principal, facilitando visitas rápidas y acceso cómodo a pie de calle.",
  },
  {
    q: "¿Qué tipos de negocio o actividades no se permiten en la plaza?",
    a: "Para garantizar un ambiente comercial seguro, limpio y de alta plusvalía, no se permiten bares nocturnos, talleres mecánicos pesados, almacenamiento de materiales peligrosos ni giros que generen ruido o contaminación.",
  },
  {
    q: "¿Puedo instalar rótulo luminoso en la fachada y realizar adecuaciones internas?",
    a: "Sí. Cada módulo dispone de espacio superior en fachada para instalar el rótulo comercial o luminoso de su marca, y se permiten adecuaciones internas livianas (divisiones de tabla yeso, mobiliario clínico o exhibidores) previa coordinación.",
  },
];

export function getSpaceHighlights(space: Space, index: number): string[] {
  const order = space.sort_order || index + 1;
  return SPACE_HIGHLIGHTS[order] ?? ["Planta baja", "Baño privado", "Servicios propios"];
}

export function getSpaceCatalogTags(space: Space, index: number): string[] {
  const order = space.sort_order || index + 1;
  const lowerName = space.name.toLowerCase();
  if (lowerName.includes("pacura") || order === 1) {
    return PACURA_TAGS;
  }
  if (lowerName.includes("corozal") || order === 2) {
    return COROZAL_TAGS;
  }
  return getSpaceHighlights(space, index);
}

export function getSpaceDisplayMeta(space: Space, index: number): SpaceDisplayMeta {
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
          : "Módulo comercial esquinero en planta baja de 70 m² con doble ángulo visual, vitrina panorámica hacia la Avenida el Caliche, baño privado y medidor eléctrico propio.",
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

  const cleanName = space.name.trim() || `Local ${order}`;
  const cleanDescription =
    space.description && space.description.trim().length > 0
      ? space.description
      : "Módulo comercial en planta baja de 70 m² con vitrina panorámica, baño privado y medidor eléctrico independiente.";

  return {
    title: cleanName,
    subtitle: `Local ${order} - Planta Baja`,
    fullLabel: `${cleanName} (Local ${order})`,
    area: "70 m²",
    description: cleanDescription,
  };
}

export function isSpaceFree(space: Space): boolean {
  return space.status === "available" || space.status === "construction";
}

export function buildSpaceShareData(
  space: Space,
  index: number,
  baseUrl = "https://plaza-aragon.com"
): SpaceShareData {
  const cleanBase =
    (baseUrl || "https://plaza-aragon.com").trim().replace(/\/+$/, "") ||
    "https://plaza-aragon.com";
  const meta = getSpaceDisplayMeta(space, index);
  const isFree = isSpaceFree(space);
  const priceLabel =
    Number.isFinite(space.price) && space.price > 0
      ? formatMoney(space.price)
      : "L 8,000";
  const url = `${cleanBase}/#local-card-${space.id}`;

  let title: string;
  let text: string;

  if (space.status === "available") {
    title = `${meta.title} disponible en Plaza Aragón • Olanchito`;
    text = `Local comercial disponible en Plaza Aragón (Olanchito): ${meta.title} (${meta.area}) • Cuota mensual ${priceLabel}/mes. Vitrina panorámica, baño privado y medidor propio.`;
  } else if (space.status === "construction") {
    title = `${meta.title} en preventa • Plaza Aragón, Olanchito`;
    text = `Módulo comercial en preventa en Plaza Aragón (Olanchito): ${meta.title} (${meta.area}) • Cuota mensual ${priceLabel}/mes.`;
  } else {
    title = `${meta.title} • Plaza Aragón, Olanchito`;
    text = `Conoce ${meta.title} (${meta.area}) en Plaza Aragón, Olanchito • Cuota mensual ${priceLabel}/mes.`;
  }

  return {
    title,
    text,
    url,
    clipboardText: `${text}\n${url}`,
    whatsappShareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`,
    facebookShareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    xShareUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    linkedinShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegramShareUrl: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    emailShareUrl: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
    isFree,
  };
}

export function filterSpaces(spaces: Space[], filter: FilterOption): Space[] {
  return spaces.filter((s) => {
    if (filter === "open") return s.status === "available" || s.status === "construction";
    if (filter === "occupied") return s.status === "occupied";
    return true;
  });
}

export function computeCatalogStats(spaces: Space[]) {
  const availableCount = spaces.filter((s) => s.status === "available").length;
  const constructionCount = spaces.filter((s) => s.status === "construction").length;
  const occupiedCount = spaces.filter((s) => s.status === "occupied").length;
  const openCount = availableCount + constructionCount;
  const prices = spaces.map((s) => s.price).filter((p) => Number.isFinite(p) && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return {
    availableCount,
    constructionCount,
    occupiedCount,
    openCount,
    minPrice,
    maxPrice,
  };
}

export function buildStructuredData(
  spaces: Space[],
  stats: ReturnType<typeof computeCatalogStats>,
  baseUrl: string,
  telephone?: string
) {
  const priceDisplay =
    stats.minPrice > 0 && stats.maxPrice > 0
      ? `L. ${stats.minPrice.toLocaleString("es-HN")} - L. ${stats.maxPrice.toLocaleString("es-HN")} HNL`
      : "L. 8,000 HNL";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ShoppingCenter",
        "@id": `${baseUrl}/#place`,
        name: "Plaza Aragón",
        alternateName: "Plaza Comercial Aragón",
        description:
          "Locales comerciales modernos de 70 m² en renta en Olanchito, Yoro, Honduras. Vitrina panorámica, baño privado, medidor independiente y lista de espera prioritaria activa.",
        url: baseUrl,
        telephone: telephone ?? getAppPhoneDisplay(),
        image: `${baseUrl}/opengraph-image`,
        logo: {
          "@type": "ImageObject",
          "@id": `${baseUrl}/#logo`,
          url: `${baseUrl}/logo.png`,
          contentUrl: `${baseUrl}/logo.png`,
          width: 512,
          height: 512,
          caption: "Plaza Aragón",
        },
        priceRange: priceDisplay,
        currenciesAccepted: "HNL",
        paymentAccepted: "Transferencia bancaria, depósito",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Avenida el Caliche, contiguo a Hotel Olanchito, a 120m del Parque Central",
          addressLocality: "Olanchito",
          addressRegion: "Yoro",
          addressCountry: "HN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 15.4845687,
          longitude: -86.5675536,
        },
        hasMap:
          "https://www.google.com/maps/search/?api=1&query=Plaza+Arag%C3%B3n%2C+Olanchito&query_place_id=ChIJISm-U0NtaY8R5woW03JAg5s",
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "08:00",
            closes: "18:00",
          },
        ],
        amenityFeature: [
          { "@type": "LocationFeatureSpecification", name: "Módulos de 70 m² en planta baja", value: true },
          { "@type": "LocationFeatureSpecification", name: "Baño privado interno", value: true },
          { "@type": "LocationFeatureSpecification", name: "Medidor eléctrico independiente", value: true },
          { "@type": "LocationFeatureSpecification", name: "Aire acondicionado instalado", value: true },
          { "@type": "LocationFeatureSpecification", name: "Piso de porcelanato", value: true },
          { "@type": "LocationFeatureSpecification", name: "Vitrina comercial panorámica", value: true },
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Catálogo de Locales Comerciales y Lista de Espera",
          itemListElement: [
            ...spaces.slice(0, 2).map((space, idx) => ({
              "@type": "Offer",
              name: idx === 0 ? "Local Pacura (Local 1 - Esquinero)" : "Local Corozal (Local 2 - Central Frontal)",
              description: space.description,
              price: space.price,
              priceCurrency: "HNL",
              availability:
                space.status === "available"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/PreOrder",
              itemOffered: {
                "@type": "Product",
                name: idx === 0 ? "Local Pacura - 70 m²" : "Local Corozal - 70 m²",
              },
              url: `${baseUrl}/#locales`,
            })),
            {
              "@type": "Offer",
              name: "Lista de Espera Prioritaria y Preventa de Nuevos Módulos (70 m²)",
              description:
                "Registro prioritario para próximas liberaciones o nuevas fases comerciales de 70 m² en Plaza Aragón, Olanchito.",
              price: 8000,
              priceCurrency: "HNL",
              availability: "https://schema.org/PreOrder",
              url: `${baseUrl}/#lista-espera`,
            },
          ],
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
