import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCatalogStats, filterSpaces, getSpaceHighlights } from "../catalog.ts";
import type { Space } from "../types.ts";

/** Factory function for creating mock Space entities with sensible defaults. */
function getMockSpace(overrides: Partial<Space> = {}): Space {
  return {
    id: "space-1",
    name: "Local 1",
    description: "Espacio comercial en planta baja.",
    price: 8000,
    status: "available",
    image_urls: [],
    sort_order: 1,
    ...overrides,
  };
}

describe("catalog utilities", () => {
  describe("Happy Path", () => {
    it("filters spaces by all, open (available + construction), and occupied", () => {
      const spaces: Space[] = [
        getMockSpace({ id: "1", status: "available", price: 8000 }),
        getMockSpace({ id: "2", status: "construction", price: 8500 }),
        getMockSpace({ id: "3", status: "occupied", price: 9000 }),
      ];

      assert.equal(filterSpaces(spaces, "all").length, 3);
      assert.deepEqual(
        filterSpaces(spaces, "open").map((s) => s.id),
        ["1", "2"]
      );
      assert.deepEqual(
        filterSpaces(spaces, "occupied").map((s) => s.id),
        ["3"]
      );
    });

    it("computes accurate catalog counts and price range", () => {
      const spaces: Space[] = [
        getMockSpace({ id: "1", status: "available", price: 8000 }),
        getMockSpace({ id: "2", status: "construction", price: 8500 }),
        getMockSpace({ id: "3", status: "occupied", price: 9500 }),
      ];

      const stats = computeCatalogStats(spaces);
      assert.equal(stats.availableCount, 1);
      assert.equal(stats.constructionCount, 1);
      assert.equal(stats.occupiedCount, 1);
      assert.equal(stats.openCount, 2);
      assert.equal(stats.minPrice, 8000);
      assert.equal(stats.maxPrice, 9500);
    });

    it("returns mapped highlights for known sort_order units", () => {
      const space = getMockSpace({ sort_order: 2 });
      assert.deepEqual(getSpaceHighlights(space, 0), [
        "Esquinero",
        "Alta visibilidad",
        "Medidor propio",
      ]);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty spaces array without Infinity or NaN prices", () => {
      const stats = computeCatalogStats([]);
      assert.equal(stats.availableCount, 0);
      assert.equal(stats.openCount, 0);
      assert.equal(stats.minPrice, 0);
      assert.equal(stats.maxPrice, 0);
      assert.deepEqual(filterSpaces([], "open"), []);
    });

    it("falls back to default highlights when sort_order exceeds preset map", () => {
      const space = getMockSpace({ sort_order: 99 });
      assert.deepEqual(getSpaceHighlights(space, 10), [
        "Planta baja",
        "Baño privado",
        "Servicios propios",
      ]);
    });
  });

  describe("Error Handling & Robustness", () => {
    it("ignores non-positive or non-finite prices when calculating min/max range", () => {
      const spaces: Space[] = [
        getMockSpace({ id: "1", price: 0 }),
        getMockSpace({ id: "2", price: Number.NaN }),
        getMockSpace({ id: "3", price: 8500 }),
      ];
      const stats = computeCatalogStats(spaces);
      assert.equal(stats.minPrice, 8500);
      assert.equal(stats.maxPrice, 8500);
    });
  });
});
