import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidSpaceStatus,
  sanitizeStorageFileName,
  validateLeaseInput,
  validatePaymentInput,
  validateSpaceUpdateInput,
} from "../validation.ts";

describe("domain validation utilities", () => {
  describe("Happy Path", () => {
    it("accepts valid space statuses and space update payloads", () => {
      assert.equal(isValidSpaceStatus("available"), true);
      assert.equal(isValidSpaceStatus("occupied"), true);
      assert.equal(isValidSpaceStatus("construction"), true);

      const err = validateSpaceUpdateInput({
        spaceId: "space-1",
        name: "Local 1",
        status: "available",
        price: 8000,
      });
      assert.equal(err, null);
    });

    it("accepts valid lease input when endDate is after startDate", () => {
      const err = validateLeaseInput({
        spaceId: "space-1",
        tenantId: "tenant-1",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        monthlyRent: 8500,
      });
      assert.equal(err, null);
    });

    it("accepts valid payment submission input", () => {
      const err = validatePaymentInput({
        periodMonth: 10,
        periodYear: 2026,
        amount: 8000,
        hasFile: true,
      });
      assert.equal(err, null);
    });

    it("sanitizes storage filenames and preserves allowed extensions", () => {
      assert.deepEqual(sanitizeStorageFileName("Contrato Firmado 2026.PDF"), {
        baseName: "Contrato_Firmado_2026",
        ext: "pdf",
      });
      assert.deepEqual(sanitizeStorageFileName("comprobante.webp"), {
        baseName: "comprobante",
        ext: "webp",
      });
    });
  });

  describe("Edge Cases", () => {
    it("allows zero price on space updates and truncates long filenames", () => {
      assert.equal(
        validateSpaceUpdateInput({
          spaceId: "space-1",
          name: "Local en preventa",
          status: "construction",
          price: 0,
        }),
        null
      );

      const longName = `${"a".repeat(80)}.png`;
      const sanitized = sanitizeStorageFileName(longName);
      assert.equal(sanitized.baseName.length, 40);
      assert.equal(sanitized.ext, "png");
    });

    it("falls back to doc.jpg when filename has no alphanumeric base or disallowed extension", () => {
      assert.deepEqual(sanitizeStorageFileName("$$$.exe"), {
        baseName: "___",
        ext: "jpg",
      });
      assert.deepEqual(sanitizeStorageFileName(".hidden"), {
        baseName: "doc",
        ext: "jpg",
      });
    });
  });

  describe("Error Handling", () => {
    it("rejects invalid space update inputs", () => {
      assert.equal(isValidSpaceStatus("archived"), false);
      assert.equal(
        validateSpaceUpdateInput({
          spaceId: "1",
          name: "   ",
          status: "available",
          price: 8000,
        })?.ok,
        false
      );
      assert.equal(
        validateSpaceUpdateInput({
          spaceId: "1",
          name: "Local 1",
          status: "invalid",
          price: 8000,
        })?.ok,
        false
      );
      assert.equal(
        validateSpaceUpdateInput({
          spaceId: "1",
          name: "Local 1",
          status: "available",
          price: -100,
        })?.ok,
        false
      );
    });

    it("rejects lease inputs with missing fields, non-positive rent, or inverted dates", () => {
      assert.equal(
        validateLeaseInput({
          spaceId: "",
          tenantId: "t1",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
          monthlyRent: 8000,
        })?.ok,
        false
      );
      assert.equal(
        validateLeaseInput({
          spaceId: "s1",
          tenantId: "t1",
          startDate: "2026-06-01",
          endDate: "2026-06-01",
          monthlyRent: 8000,
        })?.message,
        "La fecha de finalización debe ser posterior a la fecha de inicio."
      );
      assert.equal(
        validateLeaseInput({
          spaceId: "s1",
          tenantId: "t1",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
          monthlyRent: 0,
        })?.ok,
        false
      );
    });

    it("rejects payment inputs with invalid month, year, amount, or missing receipt file", () => {
      assert.equal(
        validatePaymentInput({ periodMonth: 0, periodYear: 2026, amount: 8000, hasFile: true })?.ok,
        false
      );
      assert.equal(
        validatePaymentInput({ periodMonth: 13, periodYear: 2026, amount: 8000, hasFile: true })?.ok,
        false
      );
      assert.equal(
        validatePaymentInput({ periodMonth: 5, periodYear: 2019, amount: 8000, hasFile: true })?.ok,
        false
      );
      assert.equal(
        validatePaymentInput({ periodMonth: 5, periodYear: 2026, amount: -50, hasFile: true })?.ok,
        false
      );
      assert.equal(
        validatePaymentInput({ periodMonth: 5, periodYear: 2026, amount: 8000, hasFile: false })?.ok,
        false
      );
    });
  });
});
