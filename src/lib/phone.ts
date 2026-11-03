/**
 * Application-wide phone and WhatsApp configuration utilities.
 *
 * Configurable via environment variables:
 * - NEXT_PUBLIC_WHATSAPP_NUMBER
 * - NEXT_PUBLIC_PHONE_NUMBER (alias)
 * - NEXT_PUBLIC_CONTACT_PHONE (alias)
 *
 * Default when unconfigured: +4915175088921
 */

export const DEFAULT_PHONE_NUMBER = "+4915175088921";
export const DEFAULT_PHONE_DIGITS = "4915175088921";
export const DEFAULT_PHONE_DISPLAY = "+49 151 75088921";

/**
 * Extracts numeric digits from a phone string.
 * Returns default digits if input has fewer than 6 digits.
 */
export function cleanPhoneDigits(input?: string | null): string {
  if (!input) return DEFAULT_PHONE_DIGITS;
  const digits = input.replace(/\D/g, "");
  return digits.length >= 6 ? digits : DEFAULT_PHONE_DIGITS;
}

/**
 * Formats a phone number for human-friendly display in UI, text, and Schema.org metadata.
 */
export function formatPhoneDisplay(raw?: string | null): string {
  if (!raw || !raw.trim()) {
    return DEFAULT_PHONE_DISPLAY;
  }

  const trimmed = raw.trim();

  // If already formatted with spaces, parentheses, or dashes, preserve user layout
  if (/[ \t\-\(\)]/.test(trimmed)) {
    return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
  }

  const digits = trimmed.replace(/\D/g, "");

  // German mobile number: country code 49 + 11 digits (e.g. 49 151 75088921)
  if (digits.startsWith("49") && digits.length === 13) {
    return `+49 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }

  // Honduran number: country code 504 + 8 digits (e.g. 504 9999-9999)
  if (digits.startsWith("504") && digits.length === 11) {
    return `+504 ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  // Default fallback: add '+' if missing
  return trimmed.startsWith("+") ? trimmed : `+${digits}`;
}

/**
 * Resolves the configured phone number string from the application environment.
 * Falls back to DEFAULT_PHONE_NUMBER (+4915175088921) if unconfigured.
 */
export function getAppPhoneNumber(): string {
  const configured =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_PHONE_NUMBER ||
    process.env.NEXT_PUBLIC_CONTACT_PHONE;

  if (configured && configured.trim()) {
    return configured.trim();
  }

  return DEFAULT_PHONE_NUMBER;
}

/**
 * Resolves the pure digits of the configured phone number for wa.me links.
 */
export function getAppPhoneDigits(): string {
  return cleanPhoneDigits(getAppPhoneNumber());
}

/**
 * Resolves the human-readable display string for the configured phone number.
 */
export function getAppPhoneDisplay(): string {
  return formatPhoneDisplay(getAppPhoneNumber());
}

/**
 * Builds a direct wa.me WhatsApp link with the configured phone number and optional message.
 */
export function getWhatsAppLink(customMessage?: string): string {
  const digits = getAppPhoneDigits();
  if (customMessage) {
    return `https://wa.me/${digits}?text=${encodeURIComponent(customMessage)}`;
  }
  return `https://wa.me/${digits}`;
}
