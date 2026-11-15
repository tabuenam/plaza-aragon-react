import { comparePeriods, periodOfDate, shiftPeriod, todayInHonduras } from "./format.ts";
import type {
  Lease,
  ModuleExpense,
  ModuleFinancing,
  ModuleProfitabilityMetrics,
  Payment,
  PlazaProfitabilitySummary,
  Space,
  YearlyCollectedRent,
} from "./types.ts";

/**
 * Standard fixed-rate loan monthly payment (PMT).
 * Handles 0% interest cleanly as `loanAmount / termMonths`.
 */
export function calculateMonthlyDebtService(
  loanAmount: number,
  annualInterestRatePct: number,
  termMonths: number
): number {
  if (!Number.isFinite(loanAmount) || loanAmount <= 0) return 0;
  if (!Number.isFinite(termMonths) || termMonths <= 0) return 0;
  if (!Number.isFinite(annualInterestRatePct) || annualInterestRatePct <= 0) {
    return loanAmount / termMonths;
  }

  const monthlyRate = annualInterestRatePct / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  if (!Number.isFinite(factor) || factor === 1) {
    return loanAmount / termMonths;
  }
  return (loanAmount * (monthlyRate * factor)) / (factor - 1);
}

/**
 * Trailing 12-month operating expenses (OpEx) relative to `referenceDateIso`.
 * Uses a 365-day lookback window (with a 31-day forward buffer for same-month entries).
 */
export function calculateAnnualOperatingExpenses(
  expenses: readonly Pick<ModuleExpense, "category" | "amount" | "expense_date">[],
  referenceDateIso: string = todayInHonduras()
): number {
  const refMs = new Date(`${referenceDateIso.slice(0, 10)}T00:00:00Z`).getTime();
  if (!Number.isFinite(refMs)) return 0;

  let total = 0;
  for (const exp of expenses) {
    if (exp.category !== "operating") continue;
    const amount = Number(exp.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const expMs = new Date(`${exp.expense_date.slice(0, 10)}T00:00:00Z`).getTime();
    if (!Number.isFinite(expMs)) continue;

    const diffDays = (refMs - expMs) / 86_400_000;
    if (diffDays >= -31 && diffDays <= 365) {
      total += amount;
    }
  }
  return total;
}

/**
 * Computes lifetime occupancy rate from lease history (month-by-month from the earliest
 * lease start_date through the current month in Honduras).
 */
export function calculateOccupancyRate(
  leases: readonly Pick<Lease, "start_date" | "end_date" | "active">[],
  referenceDateIso: string = todayInHonduras()
): { occupancyRate: number | null; occupiedMonths: number; trackedMonths: number } {
  if (leases.length === 0) {
    return { occupancyRate: null, occupiedMonths: 0, trackedMonths: 0 };
  }

  const currentPer = periodOfDate(referenceDateIso.slice(0, 10));
  let earliest = periodOfDate(leases[0].start_date.slice(0, 10));
  for (const lease of leases) {
    const startPer = periodOfDate(lease.start_date.slice(0, 10));
    if (comparePeriods(startPer, earliest) < 0) {
      earliest = startPer;
    }
  }

  if (comparePeriods(earliest, currentPer) > 0) {
    return { occupancyRate: null, occupiedMonths: 0, trackedMonths: 0 };
  }

  let trackedMonths = 0;
  let occupiedMonths = 0;
  let cursor = earliest;

  while (comparePeriods(cursor, currentPer) <= 0) {
    trackedMonths += 1;
    const isOccupied = leases.some((lease) => {
      const startPer = periodOfDate(lease.start_date.slice(0, 10));
      const endPer = periodOfDate(lease.end_date.slice(0, 10));
      if (comparePeriods(cursor, startPer) < 0) return false;
      if (lease.active && comparePeriods(endPer, currentPer) < 0) {
        return true;
      }
      return comparePeriods(cursor, endPer) <= 0;
    });
    if (isOccupied) occupiedMonths += 1;
    cursor = shiftPeriod(cursor, 1);
  }

  const occupancyRate = trackedMonths > 0 ? (occupiedMonths / trackedMonths) * 100 : null;
  return { occupancyRate, occupiedMonths, trackedMonths };
}

export type ModuleProfitabilityInput = {
  space: Pick<Space, "id" | "name" | "status" | "price" | "sort_order">;
  leases: readonly Pick<Lease, "id" | "space_id" | "start_date" | "end_date" | "monthly_rent" | "active">[];
  payments: readonly Pick<Payment, "lease_id" | "payment_type" | "amount" | "period_year" | "status">[];
  expenses: readonly ModuleExpense[];
  financing: ModuleFinancing | null;
  referenceDateIso?: string;
};

/**
 * Computes lifetime & annualized profitability metrics for a single commercial module.
 */
export function calculateModuleProfitability(input: ModuleProfitabilityInput): ModuleProfitabilityMetrics {
  const { space, leases, payments, expenses, financing } = input;
  const refDate = input.referenceDateIso ?? todayInHonduras();

  const activeLease = leases.find((l) => l.active) ?? null;
  const isOccupiedWithLease = space.status === "occupied" && activeLease !== null;
  const monthlyRent = isOccupiedWithLease ? Number(activeLease.monthly_rent) : Number(space.price);
  const isProjectedRent = !isOccupiedWithLease;

  let totalConstructionCost = 0;
  let totalOperatingExpenses = 0;
  for (const exp of expenses) {
    const amount = Number(exp.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (exp.category === "construction") {
      totalConstructionCost += amount;
    } else if (exp.category === "operating") {
      totalOperatingExpenses += amount;
    }
  }
  const totalSpent = totalConstructionCost + totalOperatingExpenses;
  const loggedAnnualOperatingExpenses = calculateAnnualOperatingExpenses(expenses, refDate);
  const rawMonthlyOpEx = Number(financing?.monthly_operating_expense ?? 0);
  const monthlyOperatingExpense =
    Number.isFinite(rawMonthlyOpEx) && rawMonthlyOpEx > 0 ? rawMonthlyOpEx : 0;
  const usesBudgetedOperatingExpense = monthlyOperatingExpense > 0;
  const annualOperatingExpenses = usesBudgetedOperatingExpense
    ? monthlyOperatingExpense * 12
    : loggedAnnualOperatingExpenses;

  const rawVacancy = Number(financing?.vacancy_rate_pct ?? 0);
  const vacancyRatePct = Number.isFinite(rawVacancy)
    ? Math.min(100, Math.max(0, rawVacancy))
    : 0;

  const spaceLeaseIds = new Set(leases.map((l) => l.id));
  const yearMap = new Map<number, { amount: number; paymentCount: number }>();
  let totalCollectedRent = 0;

  for (const payment of payments) {
    if (!spaceLeaseIds.has(payment.lease_id)) continue;
    if (payment.status !== "verified") continue;
    if ((payment.payment_type ?? "rent") !== "rent") continue;

    const amt = Number(payment.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;

    totalCollectedRent += amt;
    const prev = yearMap.get(payment.period_year) ?? { amount: 0, paymentCount: 0 };
    yearMap.set(payment.period_year, {
      amount: prev.amount + amt,
      paymentCount: prev.paymentCount + 1,
    });
  }

  const collectedByYear: YearlyCollectedRent[] = Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, stats]) => ({
      year,
      amount: stats.amount,
      paymentCount: stats.paymentCount,
    }));

  const netBalance = totalCollectedRent - totalSpent;

  const financingMode = financing?.financing_mode ?? "cash";
  const monthlyDebtService =
    financingMode === "financed" && financing
      ? calculateMonthlyDebtService(
          Number(financing.loan_amount),
          Number(financing.annual_interest_rate),
          Number(financing.term_months)
        )
      : 0;
  const annualDebtService = monthlyDebtService * 12;

  const cashInvested =
    financingMode === "financed" && financing
      ? financing.down_payment !== null && financing.down_payment !== undefined
        ? Number(financing.down_payment)
        : Math.max(0, totalConstructionCost - Number(financing.loan_amount))
      : totalConstructionCost;

  const grossAnnualRent = monthlyRent * 12;
  const effectiveAnnualRent = grossAnnualRent * (1 - vacancyRatePct / 100);
  const noi = effectiveAnnualRent - annualOperatingExpenses;
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  const paybackPercent = totalSpent > 0 ? (totalCollectedRent / totalSpent) * 100 : null;
  let paybackMonthsRemaining: number | null = null;
  if (totalSpent > 0) {
    if (totalCollectedRent >= totalSpent) {
      paybackMonthsRemaining = 0;
    } else {
      const remaining = totalSpent - totalCollectedRent;
      const monthlyNetContribution = noi / 12 - monthlyDebtService;
      if (monthlyNetContribution > 0) {
        paybackMonthsRemaining = Math.ceil(remaining / monthlyNetContribution);
      }
    }
  }

  const { occupancyRate, occupiedMonths, trackedMonths } = calculateOccupancyRate(leases, refDate);

  let grm: number | null = null;
  let onePercentRulePct: number | null = null;
  let meetsOnePercentRule: boolean | null = null;
  let capRatePct: number | null = null;

  if (totalConstructionCost > 0) {
    grm = grossAnnualRent > 0 ? totalConstructionCost / grossAnnualRent : null;
    onePercentRulePct = (monthlyRent / totalConstructionCost) * 100;
    meetsOnePercentRule = onePercentRulePct >= 1;
    capRatePct = (noi / totalConstructionCost) * 100;
  }

  const cashOnCashPct = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : null;

  const sortedExpenses = [...expenses].sort((a, b) =>
    b.expense_date.localeCompare(a.expense_date) || b.created_at.localeCompare(a.created_at)
  );

  return {
    spaceId: space.id,
    spaceName: space.name,
    spaceStatus: space.status,
    sortOrder: space.sort_order,
    monthlyRent,
    isProjectedRent,
    grossAnnualRent,
    effectiveAnnualRent,
    effective_annual_rent: effectiveAnnualRent,
    vacancyRatePct,
    vacancy_rate_pct: vacancyRatePct,
    monthlyOperatingExpense,
    monthly_operating_expense: monthlyOperatingExpense,
    totalConstructionCost,
    totalOperatingExpenses,
    totalSpent,
    annualOperatingExpenses,
    annual_operating_expense: annualOperatingExpenses,
    loggedAnnualOperatingExpenses,
    usesBudgetedOperatingExpense,
    totalCollectedRent,
    collectedByYear,
    netBalance,
    paybackPercent,
    paybackMonthsRemaining,
    occupancyRate,
    occupiedMonths,
    trackedMonths,
    financingMode,
    financing,
    monthlyDebtService,
    annualDebtService,
    cashInvested,
    noi,
    grm,
    onePercentRulePct,
    meetsOnePercentRule,
    capRatePct,
    annualCashFlow,
    monthlyCashFlow,
    cashOnCashPct,
    expenses: sortedExpenses,
  };
}

/**
 * Aggregates plaza-wide profitability metrics across all modules.
 */
export function calculatePlazaSummary(
  modules: readonly ModuleProfitabilityMetrics[]
): PlazaProfitabilitySummary {
  let totalInvested = 0;
  let totalConstructionCost = 0;
  let totalOperatingExpenses = 0;
  let totalCollectedRent = 0;
  let totalMonthlyRent = 0;
  let totalGrossAnnualRent = 0;
  let totalEffectiveAnnualRent = 0;
  let totalAnnualOperatingExpenses = 0;
  let totalAnnualNoi = 0;
  let totalAnnualCashFlow = 0;

  for (const m of modules) {
    totalInvested += m.totalSpent;
    totalConstructionCost += m.totalConstructionCost;
    totalOperatingExpenses += m.totalOperatingExpenses;
    totalCollectedRent += m.totalCollectedRent;
    totalMonthlyRent += m.monthlyRent;
    totalGrossAnnualRent += m.grossAnnualRent;
    totalEffectiveAnnualRent += m.effectiveAnnualRent;
    totalAnnualOperatingExpenses += m.annualOperatingExpenses;
    totalAnnualNoi += m.noi;
    totalAnnualCashFlow += m.annualCashFlow;
  }

  const overallNetBalance = totalCollectedRent - totalInvested;
  const overallPaybackPercent = totalInvested > 0 ? (totalCollectedRent / totalInvested) * 100 : null;
  const blendedCapRatePct = totalConstructionCost > 0 ? (totalAnnualNoi / totalConstructionCost) * 100 : null;

  let topPerformingModule: PlazaProfitabilitySummary["topPerformingModule"] = null;
  if (modules.length > 0) {
    const withCapRate = modules.filter((m) => m.capRatePct !== null);
    const best =
      withCapRate.length > 0
        ? withCapRate.reduce((a, b) => ((b.capRatePct ?? -Infinity) > (a.capRatePct ?? -Infinity) ? b : a))
        : modules.reduce((a, b) => (b.netBalance > a.netBalance ? b : a));

    topPerformingModule = {
      spaceId: best.spaceId,
      spaceName: best.spaceName,
      capRatePct: best.capRatePct,
      netBalance: best.netBalance,
    };
  }

  return {
    totalInvested,
    totalConstructionCost,
    totalOperatingExpenses,
    totalCollectedRent,
    overallNetBalance,
    overallPaybackPercent,
    blendedCapRatePct,
    totalMonthlyRent,
    totalGrossAnnualRent,
    totalEffectiveAnnualRent,
    effective_annual_rent: totalEffectiveAnnualRent,
    totalAnnualOperatingExpenses,
    annual_operating_expense: totalAnnualOperatingExpenses,
    totalAnnualNoi,
    totalAnnualCashFlow,
    topPerformingModule,
  };
}
