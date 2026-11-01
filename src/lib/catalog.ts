import type { Space } from "./types.ts";

export type FilterOption = "all" | "open" | "occupied";

const SPACE_HIGHLIGHTS: Record<number, string[]> = {
  1: ["Planta baja", "Esquinero", "Vitrina panorámica", "Acceso directo", "Medidor propio", "Porcelanato", "Aire acondicionado", "Baño propio", "Estacionamiento"],
  2: ["Planta baja", "Vitrina panorámica", "Acceso directo", "Medidor propio", "Porcelanato", "Aire acondicionado", "Baño propio", "Estacionamiento"],
  3: ["Porcelanato", "Baño privado", "Aire acondicionado", "Estacionamiento"],
  4: ["Ideal consultorio", "Iluminación LED", "Baño privado", "Estacionamiento"],
  5: ["Doble frente", "Área de bodega", "Mayor metraje", "Estacionamiento"],
};

export function getSpaceHighlights(space: Space, index: number): string[] {
  const order = space.sort_order || index + 1;
  return SPACE_HIGHLIGHTS[order] ?? ["Planta baja", "Baño privado", "Servicios propios"];
}

export function filterSpaces(spaces: Space[], filter: FilterOption): Space[] {
  return spaces.filter((s) => {
    if (filter === "open") return s.status === "available" || s.status === "construction";
    if (filter === "occupied") return s.status === "occupied";
    return true;
  });
}

export function computeCatalogStats(spaces: Space[]) {
  const availableCount = spaces.filter((s) => s.status === "available").length;
  const constructionCount = spaces.filter((s) => s.status === "construction").length;
  const occupiedCount = spaces.filter((s) => s.status === "occupied").length;
  const openCount = availableCount + constructionCount;
  const prices = spaces.map((s) => s.price).filter((p) => Number.isFinite(p) && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return {
    availableCount,
    constructionCount,
    occupiedCount,
    openCount,
    minPrice,
    maxPrice,
  };
}
