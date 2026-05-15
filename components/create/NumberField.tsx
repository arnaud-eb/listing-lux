"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseIntegerInput } from "@/lib/format";

interface NumberFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: number | "";
  onChange: (next: number | "") => void;
  min?: number;
  max?: number;
  allowNegative?: boolean;
}

export default function NumberField({
  id,
  label,
  placeholder,
  value,
  onChange,
  min,
  max,
  allowNegative = false,
}: NumberFieldProps) {
  const t = useTranslations("wizard.numberField");

  // useState-during-render sync: re-mirror `value` into the local draft when
  // the parent resets externally (RESET / RESTORE_DRAFT). Local draft survives
  // transient states (lone "-") the parsed value can't represent.
  const [draft, setDraft] = useState<string>(value === "" ? "" : String(value));
  const [lastSeenValue, setLastSeenValue] = useState<number | "">(value);
  if (value !== lastSeenValue) {
    setLastSeenValue(value);
    setDraft(value === "" ? "" : String(value));
  }

  const belowMin = min !== undefined && value !== "" && value < min;
  const aboveMax = max !== undefined && value !== "" && value > max;
  const hasError = belowMin || aboveMax;
  const errorId = `${id}-error`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { cleaned, value: next } = parseIntegerInput(e.target.value, {
      allowNegative,
    });
    setDraft(cleaned);
    setLastSeenValue(next);
    onChange(next);
  }

  function handleBlur() {
    if (draft === "-") setDraft("");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
      />
      {hasError && (
        <p id={errorId} className="text-2xs text-red-500" role="alert">
          {belowMin ? t("minError", { min: min! }) : t("maxError", { max: max! })}
        </p>
      )}
    </div>
  );
}
