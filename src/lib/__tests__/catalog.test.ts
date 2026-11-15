import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSpaceShareData,
  computeCatalogStats,
  COROZAL_TAGS,
  filterSpaces,
  getSpaceCatalogTags,
  getSpaceDisplayMeta,
  getSpaceHighlights,
  hasSpaceBusinessShowcase,
  isSpaceFree,
  PACURA_TAGS,
} from "../catalog.ts";
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

    it("returns commercial catalog tags for Pacura and Corozal modules", () => {
      const pacura = getMockSpace({ name: "Pacura", sort_order: 1 });
      const corozal = getMockSpace({ name: "Corozal", sort_order: 2 });
      assert.deepEqual(getSpaceCatalogTags(pacura, 0), PACURA_TAGS);
      assert.deepEqual(getSpaceCatalogTags(corozal, 1), COROZAL_TAGS);
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

  describe("Display metadata & module sharing", () => {
    it("identifies free modules (available and construction) vs occupied modules", () => {
      assert.equal(isSpaceFree(getMockSpace({ status: "available" })), true);
      assert.equal(isSpaceFree(getMockSpace({ status: "construction" })), true);
      assert.equal(isSpaceFree(getMockSpace({ status: "occupied" })), false);
    });

    it("resolves display metadata for Pacura, Corozal, and additional custom modules", () => {
      const pacura = getSpaceDisplayMeta(
        getMockSpace({ id: "1", name: "Local Pacura", sort_order: 1 }),
        0
      );
      assert.equal(pacura.title, "Local Pacura");
      assert.equal(pacura.subtitle, "Local 1 - Esquinero");

      const corozal = getSpaceDisplayMeta(
        getMockSpace({ id: "2", name: "Local Corozal", sort_order: 2 }),
        1
      );
      assert.equal(corozal.title, "Local Corozal");
      assert.equal(corozal.subtitle, "Local 2 - Central Frontal");

      const third = getSpaceDisplayMeta(
        getMockSpace({
          id: "3",
          name: "Local Aguán",
          description: "",
          sort_order: 3,
        }),
        2
      );
      assert.equal(third.title, "Local Aguán");
      assert.equal(third.subtitle, "Local 3 - Planta Baja");
      assert.equal(third.fullLabel, "Local Aguán (Local 3)");
      assert.equal(third.area, "70 m²");
      assert.ok(third.description.includes("70 m²"));
    });

    it("builds Spanish share payload with HNL rent, deep-link URL, and social share URLs", () => {
      const space = getMockSpace({
        id: "mod-3",
        name: "Local Aguán",
        price: 9200,
        status: "available",
        sort_order: 3,
      });

      const share = buildSpaceShareData(space, 2, "https://plaza-aragon.com///");
      const expectedUrl = "https://plaza-aragon.com/#local-card-mod-3";

      assert.equal(share.isFree, true);
      assert.equal(share.url, expectedUrl);
      assert.equal(share.title, "Local Aguán disponible en Plaza Aragón • Olanchito");
      assert.match(share.text, /Cuota mensual/i);
      assert.match(share.text, /9[.,]200\/mes/);
      assert.ok(!share.text.toLowerCase().includes("canon"));
      assert.equal(share.clipboardText, `${share.text}\n${share.url}`);
      assert.equal(share.instagramUrl, "https://www.instagram.com/");
      assert.ok(share.whatsappShareUrl.startsWith("https://api.whatsapp.com/send?text="));
      assert.ok(decodeURIComponent(share.whatsappShareUrl).includes(expectedUrl));
      assert.ok(share.facebookShareUrl.startsWith("https://www.facebook.com/sharer/sharer.php?u="));
      assert.ok(decodeURIComponent(share.facebookShareUrl).includes(expectedUrl));
      assert.ok(share.xShareUrl.startsWith("https://twitter.com/intent/tweet?text="));
      assert.ok(decodeURIComponent(share.xShareUrl).includes(expectedUrl));
      assert.ok(share.linkedinShareUrl.startsWith("https://www.linkedin.com/sharing/share-offsite/?url="));
      assert.ok(decodeURIComponent(share.linkedinShareUrl).includes(expectedUrl));
      assert.ok(share.telegramShareUrl.startsWith("https://t.me/share/url?url="));
      assert.ok(decodeURIComponent(share.telegramShareUrl).includes(expectedUrl));
      assert.ok(share.emailShareUrl.startsWith("mailto:?subject="));
      assert.ok(decodeURIComponent(share.emailShareUrl).includes(share.title));
      assert.ok(decodeURIComponent(share.emailShareUrl).includes(expectedUrl));
    });

    it("handles construction and occupied share copy with invalid price fallback", () => {
      const preSale = getSpaceDisplayMeta(
        getMockSpace({ id: "4", name: "Local Yoro", sort_order: 4 }),
        3
      );
      assert.equal(preSale.title, "Local Yoro");

      const constructionShare = buildSpaceShareData(
        getMockSpace({
          id: "4",
          name: "Local Yoro",
          price: Number.NaN,
          status: "construction",
          sort_order: 4,
        }),
        3
      );
      assert.equal(constructionShare.isFree, true);
      assert.match(constructionShare.title, /en preventa/);
      assert.match(constructionShare.text, /L 8,000\/mes/);

      const occupiedShare = buildSpaceShareData(
        getMockSpace({
          id: "1",
          name: "Local Pacura",
          price: 8000,
          status: "occupied",
          sort_order: 1,
        }),
        0
      );
      assert.equal(occupiedShare.isFree, false);
      assert.match(occupiedShare.title, /^Local Pacura/);
      assert.equal(occupiedShare.instagramUrl, "https://www.instagram.com/");
    });

    it("enables business showcase flip only for occupied spaces with populated showcase fields", () => {
      assert.equal(
        hasSpaceBusinessShowcase(
          getMockSpace({
            status: "occupied",
            business_name: "Farmacia San José",
          })
        ),
        true
      );
      assert.equal(
        hasSpaceBusinessShowcase(
          getMockSpace({
            status: "occupied",
            business_description: "Café artesanal en el centro.",
          })
        ),
        true
      );
      assert.equal(
        hasSpaceBusinessShowcase(
          getMockSpace({
            status: "occupied",
            business_image_urls: ["https://example.com/business-1.jpg"],
          })
        ),
        true
      );

      assert.equal(
        hasSpaceBusinessShowcase(
          getMockSpace({
            status: "occupied",
            business_name: "   ",
            business_description: "\n ",
            business_image_urls: [],
          })
        ),
        false
      );
      assert.equal(
        hasSpaceBusinessShowcase(
          getMockSpace({
            status: "occupied",
            business_name: null,
            business_description: null,
            business_image_urls: undefined,
          })
        ),
        false
      );
      assert.equal(
        hasSpaceBusinessShowcase(
          getMockSpace({
            status: "available",
            business_name: "Farmacia San José",
            business_description: "Texto previo",
            business_image_urls: ["https://example.com/business-1.jpg"],
          })
        ),
        false
      );
      assert.equal(
        hasSpaceBusinessShowcase(
          getMockSpace({
            status: "construction",
            business_name: "Próxima tienda",
          })
        ),
        false
      );
    });
  });
});
