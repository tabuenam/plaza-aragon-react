import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  comparePeriods,
  currentPeriod,
  daysUntil,
  formatDate,
  formatMoney,
  formatPeriod,
  getElectricityDelinquentLeases,
  groupPaymentsByYear,
  MONTHS,
  parsePeriodKey,
  periodKey,
  periodOfDate,
  shiftPeriod,
  shortMonth,
  todayInHonduras,
} from "../format.ts";

describe("format utilities", () => {
  describe("Happy Path", () => {
    it("formats HNL currency with Lempiras symbol", () => {
      const formatted = formatMoney(8500);
      assert.match(formatted, /8[,.]?500/);
      assert.match(formatted, /L|HNL/);
    });

    it("formats ISO dates into readable Spanish dates", () => {
      const formatted = formatDate("2026-03-15");
      assert.match(formatted, /15/);
      assert.match(formatted, /2026/);
    });

    it("formats period objects and short month names in Spanish", () => {
      assert.equal(formatPeriod({ month: 1, year: 2026 }), "Enero 2026");
      assert.equal(formatPeriod({ month: 10, year: 2026 }), "Octubre 2026");
      assert.equal(shortMonth(1), "Ene");
      assert.equal(shortMonth(12), "Dic");
      assert.equal(MONTHS.length, 12);
    });

    it("generates and parses period keys symmetrically", () => {
      const period = { month: 4, year: 2026 };
      const key = periodKey(period);
      assert.equal(key, "2026-04");
      assert.deepEqual(parsePeriodKey(key), period);
    });

    it("shifts periods forward and backward within the same year", () => {
      assert.deepEqual(shiftPeriod({ month: 5, year: 2026 }, 2), { month: 7, year: 2026 });
      assert.deepEqual(shiftPeriod({ month: 5, year: 2026 }, -3), { month: 2, year: 2026 });
    });

    it("compares two periods chronologically", () => {
      assert.ok(comparePeriods({ month: 1, year: 2026 }, { month: 2, year: 2026 }) < 0);
      assert.ok(comparePeriods({ month: 1, year: 2027 }, { month: 12, year: 2026 }) > 0);
      assert.equal(comparePeriods({ month: 6, year: 2026 }, { month: 6, year: 2026 }), 0);
    });

    it("extracts period from ISO date string", () => {
      assert.deepEqual(periodOfDate("2026-09-25"), { month: 9, year: 2026 });
    });

    it("groups payments by year descending and month descending with status counts", () => {
      const sample = [
        { id: "1", period_year: 2025, period_month: 5, status: "verified" },
        { id: "2", period_year: 2026, period_month: 1, status: "pending" },
        { id: "3", period_year: 2025, period_month: 12, status: "verified" },
        { id: "4", period_year: 2026, period_month: 11, status: "verified" },
        { id: "5", period_year: 2026, period_month: 6, status: "rejected" },
      ];

      const groups = groupPaymentsByYear(sample);
      assert.equal(groups.length, 2);
      assert.equal(groups[0].year, 2026);
      assert.deepEqual(
        groups[0].payments.map((p) => p.period_month),
        [11, 6, 1]
      );
      assert.equal(groups[0].verifiedCount, 1);
      assert.equal(groups[0].pendingCount, 1);
      assert.equal(groups[0].rejectedCount, 1);

      assert.equal(groups[1].year, 2025);
      assert.deepEqual(
        groups[1].payments.map((p) => p.period_month),
        [12, 5]
      );
      assert.equal(groups[1].verifiedCount, 2);
      assert.equal(groups[1].pendingCount, 0);
      assert.equal(groups[1].rejectedCount, 0);
    });
  });

  describe("Edge Cases", () => {
    it("returns an empty array when grouping empty payments", () => {
      assert.deepEqual(groupPaymentsByYear([]), []);
    });
    it("handles zero and decimal amounts in formatMoney", () => {
      assert.match(formatMoney(0), /0/);
      assert.match(formatMoney(8500.75), /75/);
    });

    it("handles year-boundary rollovers in shiftPeriod", () => {
      assert.deepEqual(shiftPeriod({ month: 12, year: 2026 }, 1), { month: 1, year: 2027 });
      assert.deepEqual(shiftPeriod({ month: 1, year: 2026 }, -1), { month: 12, year: 2025 });
      assert.deepEqual(shiftPeriod({ month: 6, year: 2026 }, 12), { month: 6, year: 2027 });
    });

    it("handles full ISO timestamps in formatDate and daysUntil", () => {
      const formatted = formatDate("2026-12-01T14:30:00.000Z");
      assert.match(formatted, /2026/);
      const today = todayInHonduras();
      assert.equal(daysUntil(today), 0);
    });

    it("returns valid Honduras date and currentPeriod", () => {
      const today = todayInHonduras();
      assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
      const cur = currentPeriod();
      assert.ok(cur.month >= 1 && cur.month <= 12);
      assert.ok(cur.year >= 2024);
    });
  });

  describe("Error Handling & Invalid Inputs", () => {
    it("returns null for malformed or out-of-range period keys", () => {
      assert.equal(parsePeriodKey(undefined), null);
      assert.equal(parsePeriodKey(""), null);
      assert.equal(parsePeriodKey("2026-00"), null);
      assert.equal(parsePeriodKey("2026-13"), null);
      assert.equal(parsePeriodKey("2026-4"), null);
      assert.equal(parsePeriodKey("invalid-key"), null);
    });
  });

  describe("Electricity 3-month delinquency helper", () => {
    const sampleLeases = [
      {
        id: "lease-delinquent",
        start_date: "2026-01-01",
        space: { id: "space-1", name: "Local 1" },
        tenant: { id: "tenant-1", name: "Farmacia San José", contact_info: "+504 9988-7766" },
      },
      {
        id: "lease-current",
        start_date: "2026-01-01",
        space: { id: "space-2", name: "Local 2" },
        tenant: { id: "tenant-2", name: "Café Olanchito", contact_info: "+504 9955-4433" },
      },
      {
        id: "lease-new",
        start_date: "2026-10-01",
        space: { id: "space-3", name: "Local 3" },
        tenant: { id: "tenant-3", name: "Óptica Central", contact_info: "" },
      },
    ];

    it("flags active leases started >= 3 months ago with no verified/pending electricity receipt in the last 3 months", () => {
      const payments = [
        {
          lease_id: "lease-delinquent",
          payment_type: "rent",
          period_month: 11,
          period_year: 2026,
          status: "verified",
        },
        {
          lease_id: "lease-delinquent",
          payment_type: "electricity",
          period_month: 10,
          period_year: 2026,
          status: "rejected",
        },
        {
          lease_id: "lease-delinquent",
          payment_type: "electricity",
          period_month: 8,
          period_year: 2026,
          status: "verified",
        },
        {
          lease_id: "lease-current",
          payment_type: "electricity",
          period_month: 9,
          period_year: 2026,
          status: "pending",
        },
      ];

      const result = getElectricityDelinquentLeases(sampleLeases, payments, { month: 11, year: 2026 });
      assert.equal(result.length, 1);
      assert.equal(result[0].leaseId, "lease-delinquent");
      assert.equal(result[0].spaceName, "Local 1");
      assert.equal(result[0].tenantName, "Farmacia San José");
      assert.deepEqual(result[0].missingPeriods, [
        { month: 9, year: 2026 },
        { month: 10, year: 2026 },
        { month: 11, year: 2026 },
      ]);
    });

    it("does not flag a lease if at least one receipt in the 3-month window is verified or pending", () => {
      const payments = [
        {
          lease_id: "lease-delinquent",
          payment_type: "electricity",
          period_month: 11,
          period_year: 2026,
          status: "verified",
        },
        {
          lease_id: "lease-current",
          payment_type: "electricity",
          period_month: 10,
          period_year: 2026,
          status: "pending",
        },
      ];

      const result = getElectricityDelinquentLeases(sampleLeases, payments, { month: 11, year: 2026 });
      assert.equal(result.length, 0);
    });

    it("handles year-boundary 3-month windows accurately", () => {
      const result = getElectricityDelinquentLeases(
        [sampleLeases[0]],
        [
          {
            lease_id: "lease-delinquent",
            payment_type: "electricity",
            period_month: 10,
            period_year: 2026,
            status: "verified",
          },
        ],
        { month: 1, year: 2027 }
      );

      assert.equal(result.length, 1);
      assert.deepEqual(result[0].missingPeriods, [
        { month: 11, year: 2026 },
        { month: 12, year: 2026 },
        { month: 1, year: 2027 },
      ]);
    });
  });
});
