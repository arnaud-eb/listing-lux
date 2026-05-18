"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Bath, BedDouble, Maximize } from "lucide-react";
import PriceDisplay from "@/components/shared/PriceDisplay";
import { getNeighborhoodBySlug } from "@/lib/markets";
import DeleteListingButton from "./DeleteListingButton";
import type { HistoryRow } from "./types";

interface HistoryCardProps {
  row: HistoryRow;
  dateLocale: string;
  priority?: boolean;
  onDeleted?: (id: string) => void;
}

export default function HistoryCard({
  row,
  dateLocale,
  priority = false,
  onDeleted,
}: HistoryCardProps) {
  const t = useTranslations("wizard.history");
  const neighborhood = getNeighborhoodBySlug(row.neighborhood);
  const createdAt = new Date(row.created_at).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const isRent = row.listing_kind === "rent";
  const kindLabel = isRent ? t("typeBadge.rent") : t("typeBadge.sale");
  const handleDeleted = onDeleted ? () => onDeleted(row.id) : undefined;

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <DeleteListingButton
        propertyId={row.id}
        title={row.title ?? undefined}
        onDeleted={handleDeleted}
      />
      <Link href={`/listing/${row.id}`} className="block">
        <div className="aspect-16/10 relative bg-gray-100 overflow-hidden">
          {row.photo_url ? (
            <Image
              src={row.photo_url}
              alt={row.title ?? t("altPropertyPhoto")}
              fill
              priority={priority}
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500 motion-reduce:group-hover:scale-100"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
              <Maximize className="size-8" />
            </div>
          )}
          <span
            className={`absolute top-3 left-3 z-10 inline-flex items-center px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm text-xs font-bold uppercase tracking-widest ${
              isRent ? "bg-navy-deep/90 text-white" : "bg-gold/90 text-navy-deep"
            }`}
          >
            {kindLabel}
          </span>
        </div>

        <div className="p-4">
          {row.title && (
            <h2 className="font-serif text-base font-semibold text-navy-deep line-clamp-1 mb-1">
              {row.title}
            </h2>
          )}

          <p className="text-sm text-gray-500 capitalize">
            {row.property_type}
            {neighborhood ? ` · ${neighborhood.name}` : ""}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" />
              {row.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" />
              {row.bathrooms}
            </span>
            {row.sqm != null && (
              <span className="flex items-center gap-1">
                <Maximize className="size-3.5" />
                {row.sqm} m²
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <PriceDisplay
              amount={row.price}
              className="text-sm font-semibold text-navy-deep"
            />
            <span className="ml-auto text-2xs text-gray-400">{createdAt}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
