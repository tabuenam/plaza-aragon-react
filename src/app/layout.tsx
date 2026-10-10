import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://plaza-aragon.com"),
  title: {
    default: "Plaza Aragón · Locales comerciales en Olanchito",
    template: "%s · Plaza Aragón",
  },
  description:
    "Locales comerciales en renta en Olanchito, Yoro, Honduras. Contratos de 6 a 12 meses en Plaza Aragón.",
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
