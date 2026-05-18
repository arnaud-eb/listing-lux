"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import HistoryCard from "./HistoryCard";
import type { HistoryRow } from "./types";
import { getMoreListings } from "./actions";
import type { KindFilter } from "./HistoryFilter";

interface HistoryGridProps {
  initialRows: HistoryRow[];
  initialHasMore: boolean;
  kind: KindFilter;
  isFilterPending?: boolean;
  onClearFilter?: () => void;
}

export default function HistoryGrid({
  initialRows,
  initialHasMore,
  kind,
  isFilterPending = false,
  onClearFilter,
}: HistoryGridProps) {
  const t = useTranslations("wizard.history");
  const locale = useLocale();
  const [rows, setRows] = useState<HistoryRow[]>(initialRows);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    const last = rows[rows.length - 1];
    if (!last) return;
    startTransition(async () => {
      try {
        const result = await getMoreListings({
          cursor: last.created_at,
          kind,
        });
        setRows((prev) => [...prev, ...result.rows]);
        setHasMore(result.hasMore);
      } catch {
        toast.error(t("loadMoreError"));
      }
    });
  }

  function handleDeleted(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray-500 space-y-3">
        <p>{t("noResultsForFilter")}</p>
        {kind !== "all" && onClearFilter && (
          <Button
            type="button"
            variant="outline"
            className="border-gray-300 shadow-none"
            onClick={onClearFilter}
          >
            {t("filter.all")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        aria-busy={isFilterPending || undefined}
        className={`grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 transition-opacity duration-200 ${
          isFilterPending ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        {rows.map((row, i) => (
          <HistoryCard
            key={row.id}
            row={row}
            dateLocale={locale}
            priority={i === 0}
            onDeleted={handleDeleted}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
            className="border-gray-300 shadow-none"
          >
            {isPending && (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            )}
            {t("loadMore")}
          </Button>
        </div>
      )}
    </>
  );
}
