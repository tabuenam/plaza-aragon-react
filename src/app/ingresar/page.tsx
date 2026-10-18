import { SignInForm } from "@/app/ingresar/sign-in-form";
import { Logo } from "@/components/logo";
import { TechneticaCredit } from "@/components/technetica-credit";
import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://plaza-aragon.com").trim().replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Portal de Inquilinos · Iniciar Sesión",
  description:
    "Portal digital de Plaza Aragón en Olanchito, Yoro. Acceso para inquilinos para registrar transferencias de renta y consultar contratos.",
  alternates: {
    canonical: "/ingresar",
  },
  openGraph: {
    title: "Portal de Inquilinos · Iniciar Sesión · Plaza Aragón",
    description:
      "Portal digital de Plaza Aragón en Olanchito, Yoro. Acceso para inquilinos para registrar transferencias de renta y consultar contratos.",
    url: `${siteUrl}/ingresar`,
    siteName: "Plaza Aragón",
    locale: "es_HN",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Plaza Aragón · Portal de Inquilinos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal de Inquilinos · Iniciar Sesión · Plaza Aragón",
    description:
      "Portal digital de Plaza Aragón en Olanchito, Yoro. Acceso para inquilinos para registrar transferencias de renta y consultar contratos.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const ingresarSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${siteUrl}/ingresar#webpage`,
  url: `${siteUrl}/ingresar`,
  name: "Portal de Inquilinos · Plaza Aragón",
  description:
    "Portal digital de Plaza Aragón en Olanchito, Yoro. Acceso para inquilinos para registrar transferencias de renta y consultar contratos.",
  isPartOf: {
    "@id": `${siteUrl}/#website`,
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Portal de Inquilinos",
        item: `${siteUrl}/ingresar`,
      },
    ],
  },
};

export default async function IngresarPage() {
  "use cache";
  return (
    <div className="flex min-h-dvh flex-col bg-arena">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ingresarSchema) }}
      />
      <div className="lenca-band h-2 w-full" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-crema bg-white shadow-lg lg:grid-cols-12">
          {/* Left Panel: Civic & Portal Highlights */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-azul-oscuro via-azul to-[#0e4d7e] p-6 text-white sm:p-10 lg:col-span-5">
            <div className="lenca-diamonds pointer-events-none absolute inset-0 opacity-40" />

            <div className="relative">
              <Link href="/" className="inline-block">
                <Logo light subtitle />
              </Link>

              <span className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wider text-maiz uppercase">
                Gestión Digital de Arrendamientos
              </span>

              <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                Su espacio comercial en Olanchito, siempre al día.
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-crema/85">
                Acceda a su cuenta para registrar transferencias de renta mensual, consultar recibos verificados y
                revisar su contrato vigente.
              </p>
            </div>

            <ul className="relative mt-8 space-y-3 border-t border-white/15 pt-6 text-xs text-crema/90">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-selva text-[11px] font-bold text-white">
                  ✓
                </span>
                <span>Suba comprobantes directo desde la cámara de su teléfono móvil.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-turquesa text-[11px] font-bold text-white">
                  ✓
                </span>
                <span>Historial transparente de pagos verificados en Lempiras (HNL).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-maiz text-[11px] font-bold text-azul-oscuro">
                  ✓
                </span>
                <span>Acceso unificado para arrendatarios y administración.</span>
              </li>
            </ul>
          </div>

          {/* Right Panel: Sign-In Form */}
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-7 lg:p-12">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-6">
                <span className="eyebrow">Acceso Seguro</span>
                <h2 className="mt-1 font-display text-2xl font-bold text-azul sm:text-3xl">
                  Iniciar sesión en el Portal
                </h2>
                <p className="mt-1.5 text-sm text-piedra">
                  Ingrese el correo electrónico y la contraseña asignados a su contrato.
                </p>
              </div>

              <SignInForm />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-crema bg-white py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-piedra sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Plaza Aragón · Olanchito, Yoro</span>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <Link href="/" className="font-semibold text-azul hover:underline">
              ← Volver al catálogo
            </Link>
            <span>·</span>
            <TechneticaCredit />
          </div>
        </div>
      </footer>
    </div>
  );
}

