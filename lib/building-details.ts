import type { Property, Language } from "./types";
import { formatCurrency, formatListingDate } from "./format";
import { BUILDING_DETAIL_LABELS } from "./constants";

export type BuildingDetailKey =
  | "yearBuilt"
  | "floorsTotal"
  | "floorOfUnit"
  | "energyClass"
  | "thermalClass"
  | "monthlyCharges"
  | "availableFrom"
  | "address";

export interface BuildingDetailItem {
  key: BuildingDetailKey;
  /** Field label, e.g. "Year built". Empty for the address item, which is a bare value. */
  label: string;
  value: string;
}

/** "For sale" / "For rent" label for a listing, or null when the kind is unknown. */
export function listingKindLabel(
  property: Property,
  language: Language,
): string | null {
  if (!property.listing_kind) return null;
  const L = BUILDING_DETAIL_LABELS[language] ?? BUILDING_DETAIL_LABELS.en;
  return property.listing_kind === "rent" ? L.forRent : L.forSale;
}

/** Render-agnostic building-detail facts in display order; address appended last. */
export function buildingDetailItems(
  property: Property,
  language: Language,
  { includeAddress = false }: { includeAddress?: boolean } = {},
): BuildingDetailItem[] {
  const L = BUILDING_DETAIL_LABELS[language] ?? BUILDING_DETAIL_LABELS.en;
  const items: BuildingDetailItem[] = [];
  if (property.year_built != null) {
    items.push({
      key: "yearBuilt",
      label: L.yearBuilt,
      value: String(property.year_built),
    });
  }
  if (property.floors_total != null) {
    items.push({
      key: "floorsTotal",
      label: L.floorsTotal,
      value: String(property.floors_total),
    });
  }
  if (property.floor_of_unit != null) {
    items.push({
      key: "floorOfUnit",
      label: L.floorOfUnit,
      value:
        property.floor_of_unit === 0
          ? L.groundFloor
          : String(property.floor_of_unit),
    });
  }
  if (property.cpe_class) {
    items.push({
      key: "energyClass",
      label: L.energyClass,
      value: property.cpe_class,
    });
  }
  if (property.thermal_insulation_class) {
    items.push({
      key: "thermalClass",
      label: L.thermalClass,
      value: property.thermal_insulation_class,
    });
  }
  if (property.charges_monthly != null) {
    items.push({
      key: "monthlyCharges",
      label: L.monthlyCharges,
      value: formatCurrency(property.charges_monthly),
    });
  }
  if (property.listing_kind === "rent" && property.availability_date) {
    items.push({
      key: "availableFrom",
      label: L.availableFrom,
      value: formatListingDate(property.availability_date, language),
    });
  }
  if (includeAddress && property.address) {
    items.push({ key: "address", label: "", value: property.address });
  }
  return items;
}
