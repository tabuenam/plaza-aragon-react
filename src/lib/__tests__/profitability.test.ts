import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateAnnualOperatingExpenses,
  calculateModuleProfitability,
  calculateMonthlyDebtService,
  calculateOccupancyRate,
  calculatePlazaSummary,
} from "../profitability.ts";
import type { ModuleExpense, ModuleFinancing } from "../types.ts";

describe("profitability & amortization utilities", () => {
  describe("calculateMonthlyDebtService", () => {
    it("computes standard fixed-rate monthly amortization", () => {
      // L 500,000 at 12% annual over 60 months -> ~11,122.22/mo
      const pmt = calculateMonthlyDebtService(500_000, 12, 60);
      assert.ok(Math.abs(pmt - 11_122.22) < 0.05);
    });

    it("handles 0% interest rate cleanly as loanAmount / termMonths", () => {
      const pmt = calculateMonthlyDebtService(120_000, 0, 24);
      assert.equal(pmt, 5_000);
    });

    it("returns 0 when loanAmount or termMonths is non-positive", () => {
      assert.equal(calculateMonthlyDebtService(0, 10, 60), 0);
      assert.equal(calculateMonthlyDebtService(100_000, 10, 0), 0);
      assert.equal(calculateMonthlyDebtService(-5000, 10, 12), 0);
    });
  });

  describe("calculateAnnualOperatingExpenses", () => {
    it("sums only operating expenses within trailing 12 months", () => {
      const expenses: Pick<ModuleExpense, "category" | "amount" | "expense_date">[] = [
        { category: "construction", amount: 500_000, expense_date: "2026-01-10" },
        { category: "operating", amount: 3_000, expense_date: "2026-06-15" },
        { category: "operating", amount: 2_500, expense_date: "2026-10-01" },
        { category: "operating", amount: 4_000, expense_date: "2024-01-01" }, // older than 365 days
      ];
      const ttm = calculateAnnualOperatingExpenses(expenses, "2026-11-15");
      assert.equal(ttm, 5_500);
    });
  });

  describe("calculateOccupancyRate", () => {
    it("computes occupied months vs tracked months across lease history", () => {
      const result = calculateOccupancyRate(
        [
          { start_date: "2026-01-01", end_date: "2026-03-31", active: false },
          { start_date: "2026-06-01", end_date: "2026-12-31", active: true },
        ],
        "2026-08-15"
      );
      // Tracked: Jan..Aug 2026 = 8 months. Occupied: Jan, Feb, Mar, Jun, Jul, Aug = 6 months.
      assert.equal(result.trackedMonths, 8);
      assert.equal(result.occupiedMonths, 6);
      assert.equal(result.occupancyRate, 75);
    });

    it("returns null occupancyRate when there are no leases", () => {
      const result = calculateOccupancyRate([], "2026-11-15");
      assert.equal(result.occupancyRate, null);
      assert.equal(result.trackedMonths, 0);
      assert.equal(result.occupiedMonths, 0);
    });
  });

  describe("calculateModuleProfitability", () => {
    const baseSpace = {
      id: "space-1",
      name: "Módulo 1 · Pacura",
      status: "occupied" as const,
      price: 8_000,
      sort_order: 1,
    };

    it("computes all-cash metrics using active lease rent and excludes electricity & non-verified payments", () => {
      const expenses: ModuleExpense[] = [
        {
          id: "e1",
          space_id: "space-1",
          category: "construction",
          amount: 800_000,
          expense_date: "2025-01-15",
          reason: "Inversión inicial acumulada",
          receipt_path: null,
          created_at: "2025-01-15T10:00:00Z",
        },
        {
          id: "e2",
          space_id: "space-1",
          category: "operating",
          amount: 12_000,
          expense_date: "2026-05-10",
          reason: "Pintura y mantenimiento",
          receipt_path: null,
          created_at: "2026-05-10T10:00:00Z",
        },
      ];

      const metrics = calculateModuleProfitability({
        space: baseSpace,
        leases: [
          {
            id: "lease-1",
            space_id: "space-1",
            start_date: "2026-01-01",
            end_date: "2026-12-31",
            monthly_rent: 10_000,
            active: true,
          },
        ],
        payments: [
          { lease_id: "lease-1", payment_type: "rent", amount: 10_000, period_year: 2026, status: "verified" },
          { lease_id: "lease-1", payment_type: "rent", amount: 10_000, period_year: 2026, status: "verified" },
          { lease_id: "lease-1", payment_type: "electricity", amount: 2_500, period_year: 2026, status: "verified" },
          { lease_id: "lease-1", payment_type: "rent", amount: 10_000, period_year: 2026, status: "pending" },
        ],
        expenses,
        financing: null,
        referenceDateIso: "2026-11-15",
      });

      assert.equal(metrics.monthlyRent, 10_000);
      assert.equal(metrics.isProjectedRent, false);
      assert.equal(metrics.totalConstructionCost, 800_000);
      assert.equal(metrics.totalOperatingExpenses, 12_000);
      assert.equal(metrics.totalSpent, 812_000);
      assert.equal(metrics.totalCollectedRent, 20_000);
      assert.equal(metrics.netBalance, 20_000 - 812_000);
      assert.equal(metrics.collectedByYear.length, 1);
      assert.deepEqual(metrics.collectedByYear[0], { year: 2026, amount: 20_000, paymentCount: 2 });

      // NOI = (10,000 * 12) - 12,000 = 108,000
      assert.equal(metrics.noi, 108_000);
      // GRM = 800,000 / 120,000 = 6.6667
      assert.ok(metrics.grm !== null && Math.abs(metrics.grm - 800_000 / 120_000) < 0.001);
      // 1% rule = (10,000 / 800,000) * 100 = 1.25% -> meets >= 1%
      assert.equal(metrics.onePercentRulePct, 1.25);
      assert.equal(metrics.meetsOnePercentRule, true);
      // Cap rate = (108,000 / 800,000) * 100 = 13.5%
      assert.equal(metrics.capRatePct, 13.5);
      // All-cash: debt service = 0, cashInvested = 800,000, cashOnCash = 13.5%
      assert.equal(metrics.annualDebtService, 0);
      assert.equal(metrics.cashInvested, 800_000);
      assert.equal(metrics.cashOnCashPct, 13.5);
      // Payback: 20,000 / 812,000 = 2.463%
      assert.ok(metrics.paybackPercent !== null && Math.abs(metrics.paybackPercent - (20_000 / 812_000) * 100) < 0.01);
      // Remaining = 792,000; monthly net = 10,000 - 1,000 = 9,000 -> ceil(792,000 / 9,000) = 88 months
      assert.equal(metrics.paybackMonthsRemaining, 88);
    });

    it("computes financed metrics with 0% interest and fallback down_payment", () => {
      const expenses: ModuleExpense[] = [
        {
          id: "e1",
          space_id: "space-1",
          category: "construction",
          amount: 1_000_000,
          expense_date: "2026-01-01",
          reason: "Construcción módulo",
          receipt_path: null,
          created_at: "2026-01-01T10:00:00Z",
        },
      ];
      const financing: ModuleFinancing = {
        space_id: "space-1",
        financing_mode: "financed",
        loan_amount: 600_000,
        annual_interest_rate: 0,
        term_months: 120,
        down_payment: null, // defaults to max(0, 1,000,000 - 600,000) = 400,000
        monthly_operating_expense: 0,
        vacancy_rate_pct: 0,
        updated_at: "2026-01-01T10:00:00Z",
      };

      const metrics = calculateModuleProfitability({
        space: baseSpace,
        leases: [
          {
            id: "lease-1",
            space_id: "space-1",
            start_date: "2026-01-01",
            end_date: "2026-12-31",
            monthly_rent: 9_000,
            active: true,
          },
        ],
        payments: [],
        expenses,
        financing,
        referenceDateIso: "2026-11-15",
      });

      assert.equal(metrics.financingMode, "financed");
      assert.equal(metrics.monthlyDebtService, 5_000);
      assert.equal(metrics.annualDebtService, 60_000);
      assert.equal(metrics.cashInvested, 400_000);
      // NOI = 108,000; CashFlow = 108,000 - 60,000 = 48,000
      assert.equal(metrics.annualCashFlow, 48_000);
      assert.equal(metrics.monthlyCashFlow, 4_000);
      // Cash-on-cash = (48,000 / 400,000) * 100 = 12%
      assert.equal(metrics.cashOnCashPct, 12);
      // 1% rule = 9,000 / 1,000,000 = 0.9% -> below 1%
      assert.ok(metrics.onePercentRulePct !== null && Math.abs(metrics.onePercentRulePct - 0.9) < 1e-9);
      assert.equal(metrics.meetsOnePercentRule, false);
    });

    it("falls back to projected space.price when available or construction and handles zero cost basis", () => {
      const metrics = calculateModuleProfitability({
        space: {
          id: "space-2",
          name: "Módulo 2 · Corozal",
          status: "available",
          price: 7_500,
          sort_order: 2,
        },
        leases: [],
        payments: [],
        expenses: [],
        financing: null,
        referenceDateIso: "2026-11-15",
      });

      assert.equal(metrics.monthlyRent, 7_500);
      assert.equal(metrics.isProjectedRent, true);
      assert.equal(metrics.grm, null);
      assert.equal(metrics.onePercentRulePct, null);
      assert.equal(metrics.meetsOnePercentRule, null);
      assert.equal(metrics.capRatePct, null);
      assert.equal(metrics.cashOnCashPct, null);
      assert.equal(metrics.paybackPercent, null);
    });

    it("incorporates vacancy_rate_pct into EGI, NOI, Cap Rate, Cash Flow, Cash-on-Cash, and Payback while keeping GRM and 1% Rule gross", () => {
      const expenses: ModuleExpense[] = [
        {
          id: "e1",
          space_id: "space-1",
          category: "construction",
          amount: 1_000_000,
          expense_date: "2026-01-01",
          reason: "Obra gris y acabados",
          receipt_path: null,
          created_at: "2026-01-01T10:00:00Z",
        },
      ];
      const financing: ModuleFinancing = {
        space_id: "space-1",
        financing_mode: "cash",
        loan_amount: 0,
        annual_interest_rate: 0,
        term_months: 0,
        down_payment: null,
        monthly_operating_expense: 0,
        vacancy_rate_pct: 10,
        updated_at: "2026-01-01T10:00:00Z",
      };

      const metrics = calculateModuleProfitability({
        space: baseSpace,
        leases: [
          {
            id: "lease-1",
            space_id: "space-1",
            start_date: "2026-01-01",
            end_date: "2026-12-31",
            monthly_rent: 10_000,
            active: true,
          },
        ],
        payments: [],
        expenses,
        financing,
        referenceDateIso: "2026-11-15",
      });

      assert.equal(metrics.grossAnnualRent, 120_000);
      assert.equal(metrics.vacancyRatePct, 10);
      assert.equal(metrics.effectiveAnnualRent, 108_000);
      assert.equal(metrics.noi, 108_000);
      // Gross metrics remain based on gross scheduled rent
      assert.ok(metrics.grm !== null && Math.abs(metrics.grm - 1_000_000 / 120_000) < 1e-9);
      assert.equal(metrics.onePercentRulePct, 1);
      assert.equal(metrics.meetsOnePercentRule, true);
      // Vacancy-adjusted metrics
      assert.equal(metrics.capRatePct, 10.8);
      assert.equal(metrics.annualCashFlow, 108_000);
      assert.equal(metrics.monthlyCashFlow, 9_000);
      assert.equal(metrics.cashOnCashPct, 10.8);
      // ceil(1,000,000 / 9,000) = 112 months
      assert.equal(metrics.paybackMonthsRemaining, 112);
    });

    it("uses monthly_operating_expense * 12 when > 0 to prevent double-counting, and falls back to logged receipts when 0", () => {
      const expenses: ModuleExpense[] = [
        {
          id: "e1",
          space_id: "space-1",
          category: "construction",
          amount: 800_000,
          expense_date: "2025-01-15",
          reason: "Construcción",
          receipt_path: null,
          created_at: "2025-01-15T10:00:00Z",
        },
        {
          id: "e2",
          space_id: "space-1",
          category: "operating",
          amount: 12_000,
          expense_date: "2026-05-10",
          reason: "Mantenimiento anual",
          receipt_path: null,
          created_at: "2026-05-10T10:00:00Z",
        },
      ];
      const lease = [
        {
          id: "lease-1",
          space_id: "space-1",
          start_date: "2026-01-01",
          end_date: "2026-12-31",
          monthly_rent: 10_000,
          active: true,
        },
      ];

      const withBudget = calculateModuleProfitability({
        space: baseSpace,
        leases: lease,
        payments: [],
        expenses,
        financing: {
          space_id: "space-1",
          financing_mode: "cash",
          loan_amount: 0,
          annual_interest_rate: 0,
          term_months: 0,
          down_payment: null,
          monthly_operating_expense: 2_000,
          vacancy_rate_pct: 5,
          updated_at: "2026-01-01T10:00:00Z",
        },
        referenceDateIso: "2026-11-15",
      });

      assert.equal(withBudget.usesBudgetedOperatingExpense, true);
      assert.equal(withBudget.loggedAnnualOperatingExpenses, 12_000);
      assert.equal(withBudget.annualOperatingExpenses, 24_000);
      assert.equal(withBudget.effectiveAnnualRent, 114_000);
      // NOI = 114,000 - 24,000 = 90,000 -> Cap Rate = 90,000 / 800,000 = 11.25%
      assert.equal(withBudget.noi, 90_000);
      assert.equal(withBudget.capRatePct, 11.25);

      const withoutBudget = calculateModuleProfitability({
        space: baseSpace,
        leases: lease,
        payments: [],
        expenses,
        financing: {
          space_id: "space-1",
          financing_mode: "cash",
          loan_amount: 0,
          annual_interest_rate: 0,
          term_months: 0,
          down_payment: null,
          monthly_operating_expense: 0,
          vacancy_rate_pct: 5,
          updated_at: "2026-01-01T10:00:00Z",
        },
        referenceDateIso: "2026-11-15",
      });

      assert.equal(withoutBudget.usesBudgetedOperatingExpense, false);
      assert.equal(withoutBudget.annualOperatingExpenses, 12_000);
      // NOI = 114,000 - 12,000 = 102,000
      assert.equal(withoutBudget.noi, 102_000);
    });
  });

  describe("calculatePlazaSummary", () => {
    it("rolls up totals, blended cap rate, and top performing module", () => {
      const m1 = calculateModuleProfitability({
        space: { id: "s1", name: "Local 1", status: "occupied", price: 8000, sort_order: 1 },
        leases: [{ id: "l1", space_id: "s1", start_date: "2026-01-01", end_date: "2026-12-31", monthly_rent: 10_000, active: true }],
        payments: [{ lease_id: "l1", payment_type: "rent", amount: 100_000, period_year: 2026, status: "verified" }],
        expenses: [
          { id: "e1", space_id: "s1", category: "construction", amount: 1_000_000, expense_date: "2025-01-01", reason: "Obra", receipt_path: null, created_at: "2025-01-01T00:00:00Z" },
        ],
        financing: null,
        referenceDateIso: "2026-11-15",
      });

      const m2 = calculateModuleProfitability({
        space: { id: "s2", name: "Local 2", status: "available", price: 10_000, sort_order: 2 },
        leases: [],
        payments: [],
        expenses: [
          { id: "e2", space_id: "s2", category: "construction", amount: 500_000, expense_date: "2025-01-01", reason: "Obra", receipt_path: null, created_at: "2025-01-01T00:00:00Z" },
        ],
        financing: {
          space_id: "s2",
          financing_mode: "cash",
          loan_amount: 0,
          annual_interest_rate: 0,
          term_months: 0,
          down_payment: null,
          monthly_operating_expense: 1_000,
          vacancy_rate_pct: 10,
          updated_at: "2026-01-01T00:00:00Z",
        },
        referenceDateIso: "2026-11-15",
      });

      const summary = calculatePlazaSummary([m1, m2]);
      assert.equal(summary.totalInvested, 1_500_000);
      assert.equal(summary.totalCollectedRent, 100_000);
      assert.equal(summary.overallNetBalance, -1_400_000);
      // m1: EGI = 120,000, OpEx = 0, NOI = 120,000
      // m2: EGI = 108,000, OpEx = 12,000, NOI = 96,000
      // Total EGI = 228,000, Total OpEx = 12,000, Total NOI = 216,000 -> blended Cap Rate = 216,000 / 1,500,000 = 14.4%
      assert.equal(summary.totalGrossAnnualRent, 240_000);
      assert.equal(summary.totalEffectiveAnnualRent, 228_000);
      assert.equal(summary.totalAnnualOperatingExpenses, 12_000);
      assert.equal(summary.totalAnnualNoi, 216_000);
      assert.ok(
        summary.blendedCapRatePct !== null && Math.abs(summary.blendedCapRatePct - 14.4) < 1e-9
      );
      // Local 2 has 19.2% cap rate vs Local 1 12%
      assert.equal(summary.topPerformingModule?.spaceId, "s2");
    });
  });
});
