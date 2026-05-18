"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type KindFilter = "all" | "sale" | "rent";

interface HistoryFilterProps {
  value: KindFilter;
  onChange: (next: KindFilter) => void;
}

export default function HistoryFilter({ value, onChange }: HistoryFilterProps) {
  const t = useTranslations("wizard.history.filter");

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as KindFilter)}
      className="mb-6"
    >
      <TabsList className="gap-1">
        <TabsTrigger value="all" className="uppercase font-semibold">
          {t("all")}
        </TabsTrigger>
        <TabsTrigger value="sale" className="uppercase font-semibold">
          {t("sale")}
        </TabsTrigger>
        <TabsTrigger value="rent" className="uppercase font-semibold">
          {t("rent")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
