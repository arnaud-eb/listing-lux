"use client";

import { useLocale } from "next-intl";
import { BUILDING_DETAIL_LABELS } from "@/lib/constants";
import { formatCurrency, formatListingDate } from "@/lib/format";
import type { Language, Property } from "@/lib/types";

/**
 * Structured building facts (year built, floors, energy class, charges, …).
 * Renders nothing when the property carries none of them, so a property
 * created before these fields existed leaves no empty card.
 */
export default function BuildingDetails({ property }: { property: Property }) {
  const localeStr = useLocale();
  const lang: Language =
    localeStr === "en" ? "en" : localeStr === "de" ? "de" : "fr";
  const L = BUILDING_DETAIL_LABELS[lang];

  const rows: { label: string; value: string }[] = [];
  if (property.year_built != null)
    rows.push({ label: L.yearBuilt, value: String(property.year_built) });
  if (property.floors_total != null)
    rows.push({ label: L.floorsTotal, value: String(property.floors_total) });
  if (property.floor_of_unit != null)
    rows.push({
      label: L.floorOfUnit,
      value:
        property.floor_of_unit === 0
          ? L.groundFloor
          : String(property.floor_of_unit),
    });
  if (property.cpe_class)
    rows.push({ label: L.energyClass, value: property.cpe_class });
  if (property.thermal_insulation_class)
    rows.push({
      label: L.thermalClass,
      value: property.thermal_insulation_class,
    });
  if (property.charges_monthly != null)
    rows.push({
      label: L.monthlyCharges,
      value: formatCurrency(property.charges_monthly),
    });
  if (property.listing_kind === "rent" && property.availability_date)
    rows.push({
      label: L.availableFrom,
      value: formatListingDate(property.availability_date, lang),
    });

  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xs font-semibold text-navy-deep uppercase tracking-wider mb-4">
        {L.sectionTitle}
      </h2>
      <dl className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-4 text-sm"
          >
            <dt className="text-gray-500">{r.label}</dt>
            <dd className="text-navy-deep font-medium text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
