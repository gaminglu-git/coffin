import type { Leistung, LeistungPriceType } from "@/types";

/**
 * Computes the price for a Leistung based on its price_type and quantity.
 * @param leistung - The Leistung to compute price for
 * @param quantity - Quantity for per_unit pricing (default 1)
 * @param useSternenkind - If true and leistung has sternenkindPriceCents, use that for fixed prices
 * @returns Price in cents, or null for on_request (no estimate)
 */
export function computeLeistungPrice(
  leistung: Leistung,
  quantity: number = 1,
  useSternenkind?: boolean
): number | null {
  const priceType = (leistung.priceType ?? "fixed") as LeistungPriceType;

  if (priceType === "on_request") {
    return null;
  }

  let baseCents = leistung.priceCents;
  if (useSternenkind && leistung.parameters?.sternenkindPriceCents != null) {
    const sk = leistung.parameters.sternenkindPriceCents;
    baseCents = typeof sk === "number" ? sk : Number(sk) || baseCents;
  }

  switch (priceType) {
    case "fixed":
      return baseCents;
    case "per_unit":
      return Math.round(baseCents * Math.max(0, quantity));
    case "min_price":
      return baseCents;
    default:
      return baseCents;
  }
}

/**
 * Formats a price display string for a Leistung (e.g. "75 €", "ab 75 €", "3,50 € / Stück")
 */
export function formatLeistungPriceDisplay(
  leistung: Leistung,
  quantity?: number
): string {
  const priceType = (leistung.priceType ?? "fixed") as LeistungPriceType;
  const euro = (leistung.priceCents / 100).toLocaleString("de-DE");

  if (priceType === "on_request") {
    return "auf Anfrage";
  }

  if (priceType === "min_price") {
    return `ab ${euro} €`;
  }

  if (priceType === "per_unit" && leistung.unitLabel) {
    const unit = leistung.unitLabel;
    return `${euro} € / ${unit}`;
  }

  if (priceType === "per_unit") {
    return `${euro} € / Stück`;
  }

  return `${euro} €`;
}
