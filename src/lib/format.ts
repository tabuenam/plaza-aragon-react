const TIME_ZONE = "America/Tegucigalpa";

export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const money = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const longDate = new Intl.DateTimeFormat("es-HN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export type Period = { month: number; year: number };

export function formatMoney(value: number) {
  return money.format(value);
}

export function formatDate(isoDate: string) {
  return longDate.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

export function formatPeriod({ month, year }: Period) {
  return `${MONTHS[month - 1]} ${year}`;
}

export function shortMonth(month: number) {
  return MONTHS[month - 1].slice(0, 3);
}

export function todayInHonduras() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

export function currentPeriod(): Period {
  const [year, month] = todayInHonduras().split("-").map(Number);
  return { month, year };
}

export function shiftPeriod({ month, year }: Period, offset: number): Period {
  const index = year * 12 + (month - 1) + offset;
  return { month: (index % 12) + 1, year: Math.floor(index / 12) };
}

export function periodKey({ month, year }: Period) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parsePeriodKey(value: string | undefined): Period | null {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { month, year: Number(match[1]) };
}

export function comparePeriods(a: Period, b: Period) {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function periodOfDate(isoDate: string): Period {
  const [year, month] = isoDate.split("-").map(Number);
  return { month, year };
}

export function daysUntil(isoDate: string) {
  const today = new Date(`${todayInHonduras()}T00:00:00Z`).getTime();
  const target = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((target - today) / 86_400_000);
}
