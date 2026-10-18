import type { FormState, SpaceStatus } from "./types.ts";

const VALID_SPACE_STATUSES: readonly SpaceStatus[] = ["available", "occupied", "construction"];

export function isValidSpaceStatus(status: string): status is SpaceStatus {
  return (VALID_SPACE_STATUSES as readonly string[]).includes(status);
}

export function validateSpaceUpdateInput(input: {
  spaceId: string;
  name: string;
  status: string;
  price: number;
}): FormState | null {
  if (!input.spaceId || !input.name.trim()) {
    return { ok: false, message: "El nombre del local es obligatorio." };
  }
  if (!isValidSpaceStatus(input.status)) {
    return { ok: false, message: "El estado del local seleccionado no es válido." };
  }
  if (Number.isNaN(input.price) || input.price < 0) {
    return { ok: false, message: "El precio mensual debe ser un número mayor o igual a 0." };
  }
  return null;
}

export function validateLeaseInput(input: {
  spaceId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
}): FormState | null {
  if (!input.spaceId || !input.tenantId || !input.startDate.trim() || !input.endDate.trim()) {
    return { ok: false, message: "Todos los campos del contrato son obligatorios." };
  }
  if (Number.isNaN(input.monthlyRent) || input.monthlyRent <= 0) {
    return { ok: false, message: "La renta mensual debe ser un monto mayor a 0." };
  }
  if (input.endDate <= input.startDate) {
    return { ok: false, message: "La fecha de finalización debe ser posterior a la fecha de inicio." };
  }
  return null;
}

export function validatePaymentInput(input: {
  periodMonth: number;
  periodYear: number;
  amount: number;
  hasFile: boolean;
}): FormState | null {
  if (!Number.isInteger(input.periodMonth) || input.periodMonth < 1 || input.periodMonth > 12) {
    return { ok: false, message: "Seleccione un mes válido." };
  }
  if (!Number.isInteger(input.periodYear) || input.periodYear < 2020 || input.periodYear > 2100) {
    return { ok: false, message: "Seleccione un año válido." };
  }
  if (Number.isNaN(input.amount) || input.amount <= 0) {
    return { ok: false, message: "Ingrese un monto válido." };
  }
  if (!input.hasFile) {
    return { ok: false, message: "Debe adjuntar el comprobante de transferencia bancaria." };
  }
  return null;
}

export function sanitizeStorageFileName(
  rawName: string,
  allowedExtensions: readonly string[] = ["jpg", "jpeg", "png", "webp", "pdf", "heic", "heif"]
): { baseName: string; ext: string } {
  const parts = rawName.split(".");
  const rawExt = parts.length > 1 ? parts.pop()?.toLowerCase() ?? "jpg" : "jpg";
  const ext = allowedExtensions.includes(rawExt) ? rawExt : "jpg";
  const baseName =
    rawName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40) || "doc";

  return { baseName, ext };
}
