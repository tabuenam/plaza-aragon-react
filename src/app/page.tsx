import { Logo } from "@/components/logo";
import { SpaceGallery } from "@/app/space-gallery";
import { StatusBadge } from "@/components/status-badge";
import { getPublicSpaces } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import type { Space } from "@/lib/types";
import Link from "next/link";

export const instant = false;

const fallbackSpaces: Space[] = [
  {
    id: "1",
    name: "Local 1",
    description: "Espacio comercial en planta baja con acceso directo a la calle principal, vitrina panorámica e iluminación natural.",
    price: 8000,
    status: "occupied",
    image_urls: [],
    sort_order: 1,
  },
  {
    id: "2",
    name: "Local 2",
    description: "Espacio comercial esquinero de alta visibilidad, ideal para farmacia, óptica o tienda de conveniencia.",
    price: 8000,
    status: "occupied",
    image_urls: [],
    sort_order: 2,
  },
  {
    id: "3",
    name: "Local 3",
    description: "Local comercial de nueva construcción con piso de porcelanato, baño privado y preparación para aire acondicionado.",
    price: 8500,
    status: "construction",
    image_urls: [],
    sort_order: 3,
  },
  {
    id: "4",
    name: "Local 4",
    description: "Espacio amplio diseñado para consultorio, bufete o atención al cliente en el corazón de Olanchito.",
    price: 8500,
    status: "construction",
    image_urls: [],
    sort_order: 4,
  },
  {
    id: "5",
    name: "Local 5",
    description: "Espacio premium con doble frente y área para almacenaje o bodega interna.",
    price: 9000,
    status: "construction",
    image_urls: [],
    sort_order: 5,
  },
];

export default async function HomePage() {
  const fetchedSpaces = await getPublicSpaces();
  const spaces = fetchedSpaces.length > 0 ? fetchedSpaces : fallbackSpaces;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "50499999999";

  return (
    <div className="flex min-h-screen flex-col bg-arena selection:bg-turquesa-claro selection:text-azul">
      <header className="sticky top-0 z-30 border-b border-crema/80 bg-arena/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/ingresar"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-azul px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-azul-oscuro active:scale-95"
            >
              Portal de Inquilinos
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-azul to-azul-oscuro text-white">
          <div className="lenca-diamonds absolute inset-0 pointer-events-none opacity-40" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-turquesa/20 px-3.5 py-1 text-xs font-semibold tracking-wider text-turquesa-claro uppercase">
                <span className="h-2 w-2 rounded-full bg-turquesa animate-pulse" />
                Olanchito, Yoro · Honduras
              </span>
              <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Espacios comerciales diseñados para hacer crecer su negocio.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-crema/90 sm:text-lg">
                Ubicación céntrica, acabados de primera y contratos accesibles de 3 a 12 meses en Plaza Aragón.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola, me gustaría información sobre los locales disponibles en Plaza Aragón.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent"
                >
                  Consultar disponibilidad por WhatsApp
                </a>
                <a
                  href="#locales"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-base font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
                >
                  Ver locales
                </a>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 sm:grid-cols-4">
              <div>
                <p className="font-display text-2xl font-bold text-maiz sm:text-3xl">5</p>
                <p className="mt-1 text-xs font-medium text-crema/80 uppercase tracking-wider">Locales en total</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-turquesa sm:text-3xl">2</p>
                <p className="mt-1 text-xs font-medium text-crema/80 uppercase tracking-wider">Operando actualmente</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-barro-claro sm:text-3xl">3</p>
                <p className="mt-1 text-xs font-medium text-crema/80 uppercase tracking-wider">En construcción</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white sm:text-3xl">3-12</p>
                <p className="mt-1 text-xs font-medium text-crema/80 uppercase tracking-wider">Meses de contrato</p>
              </div>
            </div>
          </div>
        </section>

        <section id="locales" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-azul sm:text-3xl">
                Nuestros Locales Comerciales
              </h2>
              <p className="mt-2 max-w-xl text-sm text-piedra sm:text-base">
                Consulte las características y disponibilidad de cada espacio.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => {
              const inquiryText = encodeURIComponent(
                `Hola, estoy interesado en información sobre el ${space.name} en Plaza Aragón.`
              );

              return (
                <article
                  key={space.id}
                  className="card flex flex-col justify-between transition hover:shadow-md"
                >
                  <div>
                    <SpaceGallery images={space.image_urls} name={space.name} />
                    <div className="mt-5 flex items-center justify-between gap-2">
                      <h3 className="font-display text-xl font-bold text-tinta">{space.name}</h3>
                      <StatusBadge status={space.status} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-piedra">{space.description}</p>
                  </div>

                  <div className="mt-6 border-t border-crema pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-piedra">Renta mensual</span>
                      <span className="font-display text-lg font-bold text-azul sm:text-xl">
                        {formatMoney(space.price)}
                      </span>
                    </div>

                    <div className="mt-4">
                      {space.status === "occupied" ? (
                        <div className="flex min-h-11 items-center justify-center rounded-xl bg-arena text-xs font-semibold text-piedra">
                          Local actualmente ocupado
                        </div>
                      ) : (
                        <a
                          href={`https://wa.me/${whatsapp}?text=${inquiryText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary w-full text-sm"
                        >
                          {space.status === "construction" ? "Apartar en preventa" : "Solicitar información"}
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-t border-crema bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="card bg-arena/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-azul text-white font-bold">
                  01
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-azul">Ubicación Estratégica</h3>
                <p className="mt-2 text-sm text-piedra">
                  Situado en Olanchito, ofreciendo visibilidad y fácil acceso vehicular y peatonal para sus clientes.
                </p>
              </div>

              <div className="card bg-arena/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-barro text-white font-bold">
                  02
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-azul">Comodidad y Servicios</h3>
                <p className="mt-2 text-sm text-piedra">
                  Servicios básicos independientes, seguridad y mantenimiento continuo para la tranquilidad de su negocio.
                </p>
              </div>

              <div className="card bg-arena/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-turquesa text-white font-bold">
                  03
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-azul">Gestión Digital</h3>
                <p className="mt-2 text-sm text-piedra">
                  Portal en línea para inquilinos donde puede subir comprobantes bancarios y consultar su historial al instante.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-crema bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo />
            <p className="text-center text-xs text-piedra sm:text-right">
              Plaza Aragón · Olanchito, Yoro, Honduras. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
