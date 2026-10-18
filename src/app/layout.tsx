import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://plaza-aragon.com").trim().replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Plaza Aragón · Locales comerciales en renta en Olanchito",
    template: "%s · Plaza Aragón",
  },
  description:
    "Renta de locales comerciales en Olanchito, Yoro. Ubicación céntrica de alta plusvalía, baño privado, medidor propio y contratos flexibles en Plaza Aragón.",
  keywords: [
    "locales comerciales Olanchito",
    "renta de locales Olanchito",
    "locales en alquiler Yoro",
    "plaza comercial Olanchito",
    "Plaza Aragón",
    "alquiler comercial Honduras",
  ],
  authors: [{ name: "Plaza Aragón" }],
  creator: "Plaza Aragón",
  publisher: "Plaza Aragón",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Plaza Aragón · Locales comerciales en renta en Olanchito",
    description:
      "Renta de locales comerciales en Olanchito, Yoro. Ubicación céntrica de alta plusvalía, baño privado, medidor propio y contratos flexibles en Plaza Aragón.",
    url: siteUrl,
    siteName: "Plaza Aragón",
    locale: "es_HN",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Plaza Aragón · Locales comerciales en renta en Olanchito, Yoro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plaza Aragón · Locales comerciales en renta en Olanchito",
    description:
      "Renta de locales comerciales en Olanchito, Yoro. Ubicación céntrica de alta plusvalía, baño privado, medidor propio y contratos flexibles en Plaza Aragón.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "real estate",
};

export const viewport: Viewport = {
  themeColor: "#0d4a7a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-arena font-sans text-tinta">{children}</body>
    </html>
  );
}
