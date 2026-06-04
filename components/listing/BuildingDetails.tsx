"use client";

import { useLocale } from "next-intl";
import { BUILDING_DETAIL_LABELS } from "@/lib/constants";
import { buildingDetailItems } from "@/lib/building-details";
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
  const items = buildingDetailItems(property, lang);

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xs font-semibold text-navy-deep uppercase tracking-wider mb-4">
        {BUILDING_DETAIL_LABELS[lang].sectionTitle}
      </h2>
      <dl className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-baseline justify-between gap-4 text-sm"
          >
            <dt className="text-gray-500">{item.label}</dt>
            <dd className="text-navy-deep font-medium text-right">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
