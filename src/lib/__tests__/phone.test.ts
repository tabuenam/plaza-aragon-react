import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  DEFAULT_PHONE_DIGITS,
  DEFAULT_PHONE_DISPLAY,
  DEFAULT_PHONE_NUMBER,
  cleanPhoneDigits,
  formatPhoneDisplay,
  getAppPhoneDigits,
  getAppPhoneDisplay,
  getAppPhoneNumber,
  getWhatsAppLink,
} from "../phone.ts";

describe("Phone and WhatsApp Configuration Utilities", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    delete process.env.NEXT_PUBLIC_PHONE_NUMBER;
    delete process.env.NEXT_PUBLIC_CONTACT_PHONE;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("Default Fallback Behavior (Unconfigured)", () => {
    it("falls back to +4915175088921 when no environment variable is provided", () => {
      assert.equal(getAppPhoneNumber(), "+4915175088921");
      assert.equal(getAppPhoneDigits(), "4915175088921");
      assert.equal(getAppPhoneDisplay(), "+49 151 75088921");
    });

    it("generates wa.me link with default digits and optional message", () => {
      assert.equal(getWhatsAppLink(), "https://wa.me/4915175088921");
      assert.equal(
        getWhatsAppLink("Hola, quiero información"),
        "https://wa.me/4915175088921?text=Hola%2C%20quiero%20informaci%C3%B3n"
      );
    });

    it("exports default constants matching specification", () => {
      assert.equal(DEFAULT_PHONE_NUMBER, "+4915175088921");
      assert.equal(DEFAULT_PHONE_DIGITS, "4915175088921");
      assert.equal(DEFAULT_PHONE_DISPLAY, "+49 151 75088921");
    });
  });

  describe("Custom Configuration via NEXT_PUBLIC_WHATSAPP_NUMBER", () => {
    it("respects a configured German mobile number with spaces", () => {
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "+49 151 75088921";
      assert.equal(getAppPhoneNumber(), "+49 151 75088921");
      assert.equal(getAppPhoneDigits(), "4915175088921");
      assert.equal(getAppPhoneDisplay(), "+49 151 75088921");
      assert.equal(getWhatsAppLink(), "https://wa.me/4915175088921");
    });

    it("formats pure German digits into standard +49 151 75088921 display", () => {
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "4915175088921";
      assert.equal(getAppPhoneDigits(), "4915175088921");
      assert.equal(getAppPhoneDisplay(), "+49 151 75088921");
    });

    it("formats pure Honduran digits into standard +504 XXXX-XXXX display", () => {
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "50499998888";
      assert.equal(getAppPhoneDigits(), "50499998888");
      assert.equal(getAppPhoneDisplay(), "+504 9999-8888");
      assert.equal(getWhatsAppLink(), "https://wa.me/50499998888");
    });

    it("preserves formatted Honduran numbers", () => {
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "+504 9999-8888";
      assert.equal(getAppPhoneDigits(), "50499998888");
      assert.equal(getAppPhoneDisplay(), "+504 9999-8888");
    });

    it("preserves formatted US / international numbers", () => {
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "+1 (555) 234-5678";
      assert.equal(getAppPhoneDigits(), "15552345678");
      assert.equal(getAppPhoneDisplay(), "+1 (555) 234-5678");
      assert.equal(getWhatsAppLink(), "https://wa.me/15552345678");
    });
  });

  describe("Alias Environment Variables Support", () => {
    it("supports NEXT_PUBLIC_PHONE_NUMBER alias if whatsapp var is not set", () => {
      process.env.NEXT_PUBLIC_PHONE_NUMBER = "+49 170 1234567";
      assert.equal(getAppPhoneNumber(), "+49 170 1234567");
      assert.equal(getAppPhoneDigits(), "491701234567");
    });

    it("supports NEXT_PUBLIC_CONTACT_PHONE alias if whatsapp var is not set", () => {
      process.env.NEXT_PUBLIC_CONTACT_PHONE = "+504 8888-7777";
      assert.equal(getAppPhoneNumber(), "+504 8888-7777");
      assert.equal(getAppPhoneDigits(), "50488887777");
    });
  });

  describe("Edge Cases and Robustness", () => {
    it("falls back to default if environment variable is empty or whitespace", () => {
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "   ";
      assert.equal(getAppPhoneNumber(), "+4915175088921");
      assert.equal(getAppPhoneDigits(), "4915175088921");
    });

    it("cleanPhoneDigits falls back to default digits for invalid or short input", () => {
      assert.equal(cleanPhoneDigits(null), "4915175088921");
      assert.equal(cleanPhoneDigits(""), "4915175088921");
      assert.equal(cleanPhoneDigits("123"), "4915175088921");
      assert.equal(cleanPhoneDigits("abc"), "4915175088921");
    });

    it("formatPhoneDisplay handles null and empty string", () => {
      assert.equal(formatPhoneDisplay(null), "+49 151 75088921");
      assert.equal(formatPhoneDisplay(""), "+49 151 75088921");
      assert.equal(formatPhoneDisplay("   "), "+49 151 75088921");
    });
  });
});
