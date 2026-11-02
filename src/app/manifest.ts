import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plaza Aragón · Locales comerciales en renta en Olanchito",
    short_name: "Plaza Aragón",
    description:
      "Renta de locales comerciales en Olanchito, Yoro. Ubicación céntrica de alta plusvalía, baño privado, medidor propio y contratos flexibles en Plaza Aragón.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6efe2",
    theme_color: "#0d4a7a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48 32x32 16x16",
        type: "image/x-icon",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
