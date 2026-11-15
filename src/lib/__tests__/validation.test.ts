import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidExpenseCategory,
  isValidFinancingMode,
  isValidPaymentType,
  isValidSpaceStatus,
  MAX_BUSINESS_DESCRIPTION_LENGTH,
  MAX_BUSINESS_NAME_LENGTH,
  MAX_EXPENSE_REASON_LENGTH,
  MAX_EXPENSE_RECEIPT_BYTES,
  MAX_SPACE_IMAGE_BYTES,
  sanitizeStorageFileName,
  validateAdminPaymentInput,
  validateExpenseInput,
  validateLeaseInput,
  validateModuleFinancingInput,
  validatePaymentInput,
  validateSpaceBusinessShowcaseInput,
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

      const showcaseErr = validateSpaceUpdateInput({
        spaceId: "space-1",
        name: "Local 1",
        status: "occupied",
        price: 8000,
        businessName: "Farmacia San José",
        businessDescription: "Atención farmacéutica diaria en el corazón de Olanchito.",
        businessImageByteSizes: [512_000, MAX_SPACE_IMAGE_BYTES],
      });
      assert.equal(showcaseErr, null);

      const standaloneShowcaseErr = validateSpaceBusinessShowcaseInput({
        businessName: "a".repeat(MAX_BUSINESS_NAME_LENGTH),
        businessDescription: "b".repeat(MAX_BUSINESS_DESCRIPTION_LENGTH),
        imageByteSizes: [1024, MAX_SPACE_IMAGE_BYTES],
      });
      assert.equal(standaloneShowcaseErr, null);
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

    it("accepts valid payment submission input for rent and electricity", () => {
      assert.equal(isValidPaymentType("rent"), true);
      assert.equal(isValidPaymentType("electricity"), true);
      assert.equal(isValidPaymentType("water"), false);

      const err = validatePaymentInput({
        paymentType: "rent",
        periodMonth: 10,
        periodYear: 2026,
        amount: 8000,
        hasFile: true,
      });
      assert.equal(err, null);

      const electricityErr = validatePaymentInput({
        paymentType: "electricity",
        periodMonth: 11,
        periodYear: 2026,
        amount: 1450.5,
        hasFile: true,
      });
      assert.equal(electricityErr, null);

      const adminErr = validateAdminPaymentInput({
        leaseId: "lease-1",
        paymentType: "electricity",
        periodMonth: 11,
        periodYear: 2026,
        amount: 1450.5,
        hasFile: true,
      });
      assert.equal(adminErr, null);
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

    it("rejects space business showcase inputs exceeding length or image size limits", () => {
      const longNameErr = validateSpaceUpdateInput({
        spaceId: "1",
        name: "Local 1",
        status: "occupied",
        price: 8000,
        businessName: "x".repeat(MAX_BUSINESS_NAME_LENGTH + 1),
      });
      assert.equal(longNameErr?.ok, false);
      assert.match(longNameErr?.message ?? "", /80 caracteres/);

      const longDescErr = validateSpaceBusinessShowcaseInput({
        businessName: "Café Olanchito",
        businessDescription: "y".repeat(MAX_BUSINESS_DESCRIPTION_LENGTH + 1),
      });
      assert.equal(longDescErr?.ok, false);
      assert.match(longDescErr?.message ?? "", /350 caracteres/);

      const oversizedImageErr = validateSpaceUpdateInput({
        spaceId: "1",
        name: "Local 1",
        status: "occupied",
        price: 8000,
        businessImageByteSizes: [120_000, MAX_SPACE_IMAGE_BYTES + 1],
      });
      assert.equal(oversizedImageErr?.ok, false);
      assert.match(oversizedImageErr?.message ?? "", /4 MB/);

      const invalidImageSizeErr = validateSpaceBusinessShowcaseInput({
        imageByteSizes: [Number.NaN],
      });
      assert.equal(invalidImageSizeErr?.ok, false);
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

    it("rejects payment inputs with invalid paymentType, month, year, amount, or missing receipt file", () => {
      assert.equal(
        validatePaymentInput({
          paymentType: "gas",
          periodMonth: 5,
          periodYear: 2026,
          amount: 500,
          hasFile: true,
        })?.ok,
        false
      );
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
      assert.equal(
        validateAdminPaymentInput({
          leaseId: "  ",
          periodMonth: 5,
          periodYear: 2026,
          amount: 8000,
          hasFile: true,
        })?.message,
        "Seleccione un local con contrato activo."
      );
    });
  });

  describe("Expense and financing validation", () => {
    it("accepts valid construction and operating expenses with or without receipt", () => {
      assert.equal(isValidExpenseCategory("construction"), true);
      assert.equal(isValidExpenseCategory("operating"), true);
      assert.equal(isValidExpenseCategory("other"), false);

      assert.equal(
        validateExpenseInput({
          spaceId: "space-1",
          category: "construction",
          amount: 450000,
          expenseDate: "2026-11-15",
          reason: "Inversión inicial acumulada",
          receiptByteSize: null,
        }),
        null
      );

      assert.equal(
        validateExpenseInput({
          spaceId: "space-1",
          category: "operating",
          amount: 1200.5,
          expenseDate: "2026-11-15",
          reason: "Pintura y electricidad",
          receiptByteSize: MAX_EXPENSE_RECEIPT_BYTES,
        }),
        null
      );
    });

    it("rejects invalid expense inputs", () => {
      assert.equal(
        validateExpenseInput({
          spaceId: "",
          category: "construction",
          amount: 1000,
          expenseDate: "2026-11-15",
          reason: "Cemento",
        })?.ok,
        false
      );
      assert.equal(
        validateExpenseInput({
          spaceId: "space-1",
          category: "invalid",
          amount: 1000,
          expenseDate: "2026-11-15",
          reason: "Cemento",
        })?.ok,
        false
      );
      assert.equal(
        validateExpenseInput({
          spaceId: "space-1",
          category: "construction",
          amount: 0,
          expenseDate: "2026-11-15",
          reason: "Cemento",
        })?.ok,
        false
      );
      assert.equal(
        validateExpenseInput({
          spaceId: "space-1",
          category: "construction",
          amount: 1000,
          expenseDate: "15-11-2026",
          reason: "Cemento",
        })?.ok,
        false
      );
      assert.equal(
        validateExpenseInput({
          spaceId: "space-1",
          category: "construction",
          amount: 1000,
          expenseDate: "2026-11-15",
          reason: "   ",
        })?.ok,
        false
      );
      assert.equal(
        validateExpenseInput({
          spaceId: "space-1",
          category: "construction",
          amount: 1000,
          expenseDate: "2026-11-15",
          reason: "x".repeat(MAX_EXPENSE_REASON_LENGTH + 1),
        })?.ok,
        false
      );
      assert.equal(
        validateExpenseInput({
          spaceId: "space-1",
          category: "construction",
          amount: 1000,
          expenseDate: "2026-11-15",
          reason: "Cemento",
          receiptByteSize: MAX_EXPENSE_RECEIPT_BYTES + 1,
        })?.ok,
        false
      );
    });

    it("validates cash and financed module financing profiles", () => {
      assert.equal(isValidFinancingMode("cash"), true);
      assert.equal(isValidFinancingMode("financed"), true);
      assert.equal(isValidFinancingMode("lease"), false);

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "cash",
          loanAmount: 0,
          annualInterestRate: 0,
          termMonths: 0,
          downPayment: null,
        }),
        null
      );

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "financed",
          loanAmount: 500000,
          annualInterestRate: 0,
          termMonths: 60,
          downPayment: 100000,
        }),
        null
      );

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "financed",
          loanAmount: 0,
          annualInterestRate: 10,
          termMonths: 60,
        })?.ok,
        false
      );

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "financed",
          loanAmount: 500000,
          annualInterestRate: 12,
          termMonths: 0,
        })?.ok,
        false
      );

      // Operating expense & vacancy bounds
      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "cash",
          loanAmount: 0,
          annualInterestRate: 0,
          termMonths: 0,
          monthlyOperatingExpense: 0,
          vacancyRatePct: 0,
        }),
        null
      );

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "financed",
          loanAmount: 500000,
          annualInterestRate: 10,
          termMonths: 60,
          monthlyOperatingExpense: 1500.5,
          vacancyRatePct: 100,
        }),
        null
      );

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "cash",
          loanAmount: 0,
          annualInterestRate: 0,
          termMonths: 0,
          monthlyOperatingExpense: -1,
          vacancyRatePct: 5,
        })?.ok,
        false
      );

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "cash",
          loanAmount: 0,
          annualInterestRate: 0,
          termMonths: 0,
          monthlyOperatingExpense: Number.NaN,
          vacancyRatePct: 5,
        })?.ok,
        false
      );

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "cash",
          loanAmount: 0,
          annualInterestRate: 0,
          termMonths: 0,
          monthlyOperatingExpense: 500,
          vacancyRatePct: -0.5,
        })?.ok,
        false
      );

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "financed",
          loanAmount: 500000,
          annualInterestRate: 10,
          termMonths: 60,
          monthlyOperatingExpense: 500,
          vacancyRatePct: 100.1,
        })?.ok,
        false
      );

      assert.equal(
        validateModuleFinancingInput({
          spaceId: "space-1",
          financingMode: "cash",
          loanAmount: 0,
          annualInterestRate: 0,
          termMonths: 0,
          monthlyOperatingExpense: 500,
          vacancyRatePct: Number.NaN,
        })?.ok,
        false
      );
    });
  });
});
