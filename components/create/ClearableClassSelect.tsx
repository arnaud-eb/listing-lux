"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CPE_CLASSES, type CpeClass } from "@/lib/constants";

interface ClearableClassSelectProps {
  id: string;
  label: string;
  placeholder: string;
  clearLabel: string;
  value: CpeClass | "";
  onChange: (next: CpeClass | "") => void;
}

// Radix Select v1 forbids `<SelectItem value="">`; sentinel mapped to "" below.
const NONE_VALUE = "__none__";

export default function ClearableClassSelect({
  id,
  label,
  placeholder,
  clearLabel,
  value,
  onChange,
}: ClearableClassSelectProps) {
  function handleValueChange(next: string) {
    onChange(next === NONE_VALUE ? "" : (next as CpeClass));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {/* Radix Select v1 latches controlled/uncontrolled at mount: an initial
          value="" (→ undefined) makes it uncontrolled, so a value restored
          afterwards (sessionStorage draft) is ignored and the field looks
          blank on reload. Keying on `value` remounts it so a restored value
          initialises as controlled — and also covers the clear→placeholder
          case the old resetKey handled (Radix issue #1569). */}
      <Select
        key={value}
        value={value || undefined}
        onValueChange={handleValueChange}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value={NONE_VALUE}
            className="italic text-muted-foreground"
          >
            — {clearLabel} —
          </SelectItem>
          <SelectSeparator />
          {CPE_CLASSES.map((cls) => (
            <SelectItem key={cls} value={cls}>
              {cls}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
