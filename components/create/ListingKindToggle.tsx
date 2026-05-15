"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ListingKind } from "@/lib/constants";

interface ListingKindToggleProps {
  value: ListingKind;
  onChange: (next: ListingKind) => void;
  label: string;
  saleLabel: string;
  rentLabel: string;
}

export default function ListingKindToggle({
  value,
  onChange,
  label,
  saleLabel,
  rentLabel,
}: ListingKindToggleProps) {
  const options: { value: ListingKind; label: string }[] = [
    { value: "sale", label: saleLabel },
    { value: "rent", label: rentLabel },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <Label id="listing-kind-label">{label}</Label>
      <div
        role="group"
        aria-labelledby="listing-kind-label"
        className="inline-flex items-center gap-2"
      >
        {options.map(({ value: optionValue, label: optionLabel }) => {
          const isActive = value === optionValue;
          return (
            <Button
              key={optionValue}
              type="button"
              variant={isActive ? "default" : "outline"}
              aria-pressed={isActive}
              onClick={() => onChange(optionValue)}
              className={cn(
                "px-5 shadow-none",
                isActive && "bg-gold text-navy-deep hover:bg-gold/90",
                !isActive && "border-gray-300",
              )}
            >
              {optionLabel}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
