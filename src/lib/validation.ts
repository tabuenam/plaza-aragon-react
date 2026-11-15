import type {
  ExpenseCategory,
  FinancingMode,
  FormState,
  PaymentType,
  SpaceStatus,
} from "./types.ts";

const VALID_SPACE_STATUSES: readonly SpaceStatus[] = ["available", "occupied", "construction"];
const VALID_PAYMENT_TYPES: readonly PaymentType[] = ["rent", "electricity"];
const VALID_EXPENSE_CATEGORIES: readonly ExpenseCategory[] = ["construction", "operating"];
const VALID_FINANCING_MODES: readonly FinancingMode[] = ["cash", "financed"];

export const MAX_BUSINESS_NAME_LENGTH = 80;
export const MAX_BUSINESS_DESCRIPTION_LENGTH = 350;
export const MAX_SPACE_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_EXPENSE_REASON_LENGTH = 200;
export const MAX_EXPENSE_RECEIPT_BYTES = 4 * 1024 * 1024;

export function isValidSpaceStatus(status: string): status is SpaceStatus {
  return (VALID_SPACE_STATUSES as readonly string[]).includes(status);
}

export function isValidPaymentType(type: string): type is PaymentType {
  return (VALID_PAYMENT_TYPES as readonly string[]).includes(type);
}

export function isValidExpenseCategory(category: string): category is ExpenseCategory {
  return (VALID_EXPENSE_CATEGORIES as readonly string[]).includes(category);
}

export function isValidFinancingMode(mode: string): mode is FinancingMode {
  return (VALID_FINANCING_MODES as readonly string[]).includes(mode);
}

export function validateSpaceBusinessShowcaseInput(input: {
  businessName?: string | null;
  businessDescription?: string | null;
  imageByteSizes?: readonly number[];
}): FormState | null {
  const businessName = (input.businessName ?? "").trim();
  const businessDescription = (input.businessDescription ?? "").trim();

  if (businessName.length > MAX_BUSINESS_NAME_LENGTH) {
    return {
      ok: false,
      message: `El nombre del negocio no puede exceder ${MAX_BUSINESS_NAME_LENGTH} caracteres.`,
    };
  }
  if (businessDescription.length > MAX_BUSINESS_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      message: `La descripción breve del negocio no puede exceder ${MAX_BUSINESS_DESCRIPTION_LENGTH} caracteres.`,
    };
  }
  if (
    input.imageByteSizes?.some(
      (size) => !Number.isFinite(size) || size < 0 || size > MAX_SPACE_IMAGE_BYTES
    )
  ) {
    return {
      ok: false,
      message: "Cada fotografía del negocio debe pesar menos de 4 MB.",
    };
  }
  return null;
}

export function validateSpaceUpdateInput(input: {
  spaceId: string;
  name: string;
  status: string;
  price: number;
  businessName?: string | null;
  businessDescription?: string | null;
  businessImageByteSizes?: readonly number[];
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
  return validateSpaceBusinessShowcaseInput({
    businessName: input.businessName,
    businessDescription: input.businessDescription,
    imageByteSizes: input.businessImageByteSizes,
  });
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
  paymentType?: string;
}): FormState | null {
  if (input.paymentType !== undefined && !isValidPaymentType(input.paymentType)) {
    return { ok: false, message: "Seleccione un tipo de comprobante válido." };
  }
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
    return { ok: false, message: "Debe adjuntar el comprobante de pago." };
  }
  return null;
}

export function validateAdminPaymentInput(input: {
  leaseId: string;
  periodMonth: number;
  periodYear: number;
  amount: number;
  hasFile: boolean;
  paymentType?: string;
}): FormState | null {
  if (!input.leaseId.trim()) {
    return { ok: false, message: "Seleccione un local con contrato activo." };
  }
  return validatePaymentInput(input);
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

export function validateExpenseInput(input: {
  spaceId: string;
  category: string;
  amount: number;
  expenseDate: string;
  reason: string;
  receiptByteSize?: number | null;
}): FormState | null {
  if (!input.spaceId.trim()) {
    return { ok: false, message: "Seleccione un módulo comercial." };
  }
  if (!isValidExpenseCategory(input.category)) {
    return { ok: false, message: "Seleccione una categoría de gasto válida." };
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, message: "Ingrese un monto válido mayor a 0." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate.trim())) {
    return { ok: false, message: "Ingrese una fecha válida para el gasto." };
  }
  const trimmedReason = input.reason.trim();
  if (!trimmedReason) {
    return { ok: false, message: "El motivo del gasto es obligatorio." };
  }
  if (trimmedReason.length > MAX_EXPENSE_REASON_LENGTH) {
    return {
      ok: false,
      message: `El motivo del gasto no puede exceder ${MAX_EXPENSE_REASON_LENGTH} caracteres.`,
    };
  }
  if (
    input.receiptByteSize !== undefined &&
    input.receiptByteSize !== null &&
    (!Number.isFinite(input.receiptByteSize) ||
      input.receiptByteSize < 0 ||
      input.receiptByteSize > MAX_EXPENSE_RECEIPT_BYTES)
  ) {
    return { ok: false, message: "El comprobante adjunto debe pesar menos de 4 MB." };
  }
  return null;
}

export function validateModuleFinancingInput(input: {
  spaceId: string;
  financingMode: string;
  loanAmount: number;
  annualInterestRate: number;
  termMonths: number;
  downPayment?: number | null;
  monthlyOperatingExpense?: number;
  vacancyRatePct?: number;
  monthly_operating_expense?: number;
  vacancy_rate_pct?: number;
}): FormState | null {
  if (!input.spaceId.trim()) {
    return { ok: false, message: "Seleccione un módulo comercial." };
  }
  if (!isValidFinancingMode(input.financingMode)) {
    return { ok: false, message: "Seleccione una modalidad de financiamiento válida." };
  }
  const monthlyOperatingExpense =
    input.monthlyOperatingExpense ?? input.monthly_operating_expense ?? 0;
  if (!Number.isFinite(monthlyOperatingExpense) || monthlyOperatingExpense < 0) {
    return {
      ok: false,
      message: "El gasto operativo mensual estimado debe ser mayor o igual a 0.",
    };
  }
  const vacancyRatePct = input.vacancyRatePct ?? input.vacancy_rate_pct ?? 0;
  if (!Number.isFinite(vacancyRatePct) || vacancyRatePct < 0 || vacancyRatePct > 100) {
    return {
      ok: false,
      message: "El porcentaje de vacancia estimado debe estar entre 0% y 100%.",
    };
  }
  if (input.financingMode === "financed") {
    if (!Number.isFinite(input.loanAmount) || input.loanAmount <= 0) {
      return { ok: false, message: "El monto del préstamo debe ser mayor a 0." };
    }
    if (!Number.isFinite(input.annualInterestRate) || input.annualInterestRate < 0 || input.annualInterestRate > 100) {
      return { ok: false, message: "La tasa de interés anual debe estar entre 0% y 100%." };
    }
    if (!Number.isInteger(input.termMonths) || input.termMonths < 1 || input.termMonths > 600) {
      return { ok: false, message: "El plazo del préstamo debe ser entre 1 y 600 meses." };
    }
    if (
      input.downPayment !== undefined &&
      input.downPayment !== null &&
      (!Number.isFinite(input.downPayment) || input.downPayment < 0)
    ) {
      return { ok: false, message: "La prima o efectivo invertido debe ser mayor o igual a 0." };
    }
  }
  return null;
}
