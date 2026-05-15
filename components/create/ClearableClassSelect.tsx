"use client";

import { useState } from "react";
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
  // Radix Select v1 won't re-render placeholder when value → undefined; force
  // remount via resetKey. https://github.com/radix-ui/primitives/issues/1569
  const [resetKey, setResetKey] = useState(0);

  function handleValueChange(next: string) {
    if (next === NONE_VALUE) {
      onChange("");
      setResetKey((k) => k + 1);
      return;
    }
    onChange(next as CpeClass);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        key={resetKey}
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
