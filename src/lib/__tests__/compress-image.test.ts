import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compressImage, MAX_UPLOAD_BYTES } from "../compress-image.ts";

describe("compressImage utilities", () => {
  describe("Happy Path", () => {
    it("exports 4MB MAX_UPLOAD_BYTES limit", () => {
      assert.equal(MAX_UPLOAD_BYTES, 4 * 1024 * 1024);
    });

    it("returns non-image files untouched without attempting canvas compression", async () => {
      const pdfFile = new File(["%PDF-1.4 content"], "contrato.pdf", {
        type: "application/pdf",
      });
      const result = await compressImage(pdfFile);
      assert.equal(result, pdfFile);
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("gracefully falls back to original image File when browser canvas/createImageBitmap is unavailable", async () => {
      const imageFile = new File(["fake-image-bytes"], "recibo.png", {
        type: "image/png",
      });
      const result = await compressImage(imageFile);
      assert.equal(result, imageFile);
    });
  });
});
