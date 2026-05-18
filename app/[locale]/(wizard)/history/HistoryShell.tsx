"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import HistoryFilter, { type KindFilter } from "./HistoryFilter";
import HistoryGrid from "./HistoryGrid";
import type { HistoryRow } from "./types";

interface HistoryShellProps {
  initialRows: HistoryRow[];
  initialHasMore: boolean;
  kind: KindFilter;
  showFilter: boolean;
}

export default function HistoryShell({
  initialRows,
  initialHasMore,
  kind,
  showFilter,
}: HistoryShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFilterPending, startFilterTransition] = useTransition();

  function handleFilterChange(next: KindFilter) {
    const query = next === "all" ? "" : `?kind=${next}`;
    startFilterTransition(() => {
      router.replace(`${pathname}${query}`, { scroll: false });
    });
  }

  return (
    <>
      {showFilter && <HistoryFilter value={kind} onChange={handleFilterChange} />}
      <HistoryGrid
        key={kind}
        initialRows={initialRows}
        initialHasMore={initialHasMore}
        kind={kind}
        isFilterPending={isFilterPending}
        onClearFilter={() => handleFilterChange("all")}
      />
    </>
  );
}
