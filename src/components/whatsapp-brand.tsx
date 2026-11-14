import Image from "next/image";

const BASE_PATH = "/whatsapp/Brand Resource Center Page Downloads";

export const WHATSAPP_BRAND_ASSETS = {
  glyph: {
    green: `${BASE_PATH}/01_Glyph/01_Digital RGB/03_SVG/Digital_Glyph_Green_RGB_2026.svg`,
    black: `${BASE_PATH}/01_Glyph/01_Digital RGB/03_SVG/Digital_Glyph_Black_RGB_2026.svg`,
    white: `${BASE_PATH}/01_Glyph/01_Digital RGB/03_SVG/Digital_Glyph_White_RGB_2026.svg`,
  },
  inline: {
    green: `${BASE_PATH}/02_Inline/01_Digital RGB/03_SVG/Digital_Inline_Green_RGB_2026.svg`,
    black: `${BASE_PATH}/02_Inline/01_Digital RGB/03_SVG/Digital_Inline_Black_RGB_2026.svg`,
    white: `${BASE_PATH}/02_Inline/01_Digital RGB/03_SVG/Digital_Inline_White_RGB_2026.svg`,
  },
  stacked: {
    green: `${BASE_PATH}/03_Stacked/01_Digital RGB/03_SVG/Digital_Stacked_Green_RGB_2026.svg`,
    black: `${BASE_PATH}/03_Stacked/01_Digital RGB/03_SVG/Digital_Stacked_Black_RGB_2026.svg`,
    white: `${BASE_PATH}/03_Stacked/01_Digital RGB/03_SVG/Digital_Stacked_White_RGB_2026.svg`,
  },
} as const;

export type WhatsAppColorVariant = "green" | "black" | "white";

export function WhatsAppGlyph({
  variant = "green",
  className = "h-5 w-5 shrink-0",
  size = 20,
  alt = "",
}: {
  variant?: WhatsAppColorVariant;
  className?: string;
  size?: number;
  alt?: string;
}) {
  const isDecorative = alt === "";
  return (
    <Image
      src={WHATSAPP_BRAND_ASSETS.glyph[variant]}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      aria-hidden={isDecorative ? "true" : undefined}
      className={className}
    />
  );
}

export function WhatsAppInlineLogo({
  variant = "green",
  className = "h-4 w-auto shrink-0",
  height = 20,
  alt = "",
}: {
  variant?: WhatsAppColorVariant;
  className?: string;
  height?: number;
  alt?: string;
}) {
  const width = Math.round((height * 1487.13) / 346);
  const isDecorative = alt === "";
  return (
    <Image
      src={WHATSAPP_BRAND_ASSETS.inline[variant]}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      aria-hidden={isDecorative ? "true" : undefined}
      className={className}
    />
  );
}

export function WhatsAppStackedLogo({
  variant = "green",
  className = "h-10 w-auto shrink-0",
  height = 44,
  alt = "",
}: {
  variant?: WhatsAppColorVariant;
  className?: string;
  height?: number;
  alt?: string;
}) {
  const width = Math.round((height * 1232) / 770);
  const isDecorative = alt === "";
  return (
    <Image
      src={WHATSAPP_BRAND_ASSETS.stacked[variant]}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      aria-hidden={isDecorative ? "true" : undefined}
      className={className}
    />
  );
}
