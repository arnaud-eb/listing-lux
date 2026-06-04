import { describe, it, expect } from "vitest";
import { buildingDetailItems, listingKindLabel } from "./building-details";
import { formatCurrency, formatListingDate } from "./format";
import { BUILDING_DETAIL_LABELS } from "./constants";
import type { Property } from "./types";

const baseProperty: Property = {
  id: "prop-1",
  bedrooms: 3,
  bathrooms: 2,
  sqm: 150,
  price: 1200000,
  neighborhood: "Kirchberg",
  property_type: "apartment",
  features: {},
  photo_urls: [],
  created_at: "2026-01-01",
};

describe("buildingDetailItems", () => {
  it("returns an empty array when no building fields are populated", () => {
    expect(buildingDetailItems(baseProperty, "en")).toEqual([]);
  });

  it("never includes the listing kind (that belongs on the property-details line)", () => {
    const items = buildingDetailItems(
      { ...baseProperty, listing_kind: "sale", year_built: 1990 },
      "en",
    );
    expect(items.map((i) => i.key)).toEqual(["yearBuilt"]);
  });

  it("excludes the address by default", () => {
    const items = buildingDetailItems(
      { ...baseProperty, address: "12 rue des rives" },
      "en",
    );
    expect(items).toEqual([]);
  });

  it("appends the address as a bare last item when requested", () => {
    const items = buildingDetailItems(
      { ...baseProperty, year_built: 1990, address: "12 rue des rives" },
      "en",
      { includeAddress: true },
    );
    expect(items[0].key).toBe("yearBuilt");
    expect(items.at(-1)).toEqual({
      key: "address",
      label: "",
      value: "12 rue des rives",
    });
  });

  it("walks fields in display order, address last", () => {
    const property: Property = {
      ...baseProperty,
      listing_kind: "rent",
      year_built: 1990,
      floors_total: 5,
      floor_of_unit: 2,
      cpe_class: "B",
      thermal_insulation_class: "C",
      charges_monthly: 250,
      availability_date: "2026-09-01",
      address: "12 rue des rives",
    };
    const keys = buildingDetailItems(property, "en", {
      includeAddress: true,
    }).map((i) => i.key);
    expect(keys).toEqual([
      "yearBuilt",
      "floorsTotal",
      "floorOfUnit",
      "energyClass",
      "thermalClass",
      "monthlyCharges",
      "availableFrom",
      "address",
    ]);
  });

  it("returns only the address when no building fields are set", () => {
    const items = buildingDetailItems(
      { ...baseProperty, address: "12 rue des rives" },
      "en",
      { includeAddress: true },
    );
    expect(items.map((i) => i.key)).toEqual(["address"]);
  });

  it("stringifies numeric values with their labels", () => {
    const items = buildingDetailItems(
      { ...baseProperty, year_built: 1990, floors_total: 5 },
      "en",
    );
    expect(items).toEqual([
      {
        key: "yearBuilt",
        label: BUILDING_DETAIL_LABELS.en.yearBuilt,
        value: "1990",
      },
      {
        key: "floorsTotal",
        label: BUILDING_DETAIL_LABELS.en.floorsTotal,
        value: "5",
      },
    ]);
  });

  it("renders floor 0 as the ground-floor label", () => {
    const [item] = buildingDetailItems(
      { ...baseProperty, floor_of_unit: 0 },
      "en",
    );
    expect(item.value).toBe(BUILDING_DETAIL_LABELS.en.groundFloor);
  });

  it("renders a non-zero floor as its number", () => {
    const [item] = buildingDetailItems(
      { ...baseProperty, floor_of_unit: 3 },
      "en",
    );
    expect(item.value).toBe("3");
  });

  it("formats monthly charges as currency", () => {
    const [item] = buildingDetailItems(
      { ...baseProperty, charges_monthly: 250 },
      "en",
    );
    expect(item.value).toBe(formatCurrency(250));
  });

  it("includes availability date only for rentals", () => {
    const forSale = buildingDetailItems(
      { ...baseProperty, listing_kind: "sale", availability_date: "2026-09-01" },
      "en",
    );
    expect(forSale.some((i) => i.key === "availableFrom")).toBe(false);

    const forRent = buildingDetailItems(
      { ...baseProperty, listing_kind: "rent", availability_date: "2026-09-01" },
      "en",
    );
    const availableFrom = forRent.find((i) => i.key === "availableFrom");
    expect(availableFrom?.value).toBe(formatListingDate("2026-09-01", "en"));
  });

  it("uses the requested language's labels", () => {
    const [item] = buildingDetailItems(
      { ...baseProperty, year_built: 1990 },
      "fr",
    );
    expect(item.label).toBe(BUILDING_DETAIL_LABELS.fr.yearBuilt);
  });
});

describe("listingKindLabel", () => {
  it("returns null when the kind is unknown", () => {
    expect(listingKindLabel(baseProperty, "en")).toBeNull();
  });

  it("returns the for-sale label", () => {
    expect(listingKindLabel({ ...baseProperty, listing_kind: "sale" }, "fr")).toBe(
      BUILDING_DETAIL_LABELS.fr.forSale,
    );
  });

  it("returns the for-rent label", () => {
    expect(listingKindLabel({ ...baseProperty, listing_kind: "rent" }, "en")).toBe(
      BUILDING_DETAIL_LABELS.en.forRent,
    );
  });
});
