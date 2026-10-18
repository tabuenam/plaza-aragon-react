import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  comparePeriods,
  currentPeriod,
  daysUntil,
  formatDate,
  formatMoney,
  formatPeriod,
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
  });

  describe("Edge Cases", () => {
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
});
