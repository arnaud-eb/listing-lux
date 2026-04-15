"use client";

import PhoneInputWithCountry from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";
import { normalizeToE164 } from "@/lib/phone";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Phone input with country selector + auto-formatting based on country.
 * Wraps `react-phone-number-input` and styles it to match the codebase Input.
 *
 * Defaults to Luxembourg (+352) but lets the agent pick another country
 * (FR, BE, DE, etc.) since cross-border real estate is common in Luxembourg.
 */
export default function PhoneInput({
  value,
  onChange,
  id,
  placeholder = "+352 661 30 87 00",
  className,
}: PhoneInputProps) {
  return (
    <PhoneInputWithCountry
      id={id}
      value={normalizeToE164(value)}
      onChange={(v) => onChange(v ?? "")}
      defaultCountry="LU"
      international
      countryCallingCodeEditable={false}
      placeholder={placeholder}
      className={cn(
        // Container styles — match the Input look (border, padding, height)
        "flex h-11 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-transparent px-3 shadow-xs",
        "[&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-1.5",
        "[&_.PhoneInputCountrySelect]:appearance-none [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:absolute [&_.PhoneInputCountrySelect]:opacity-0 [&_.PhoneInputCountrySelect]:inset-0",
        "[&_.PhoneInputCountrySelectArrow]:opacity-50",
        "[&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:text-base md:[&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:placeholder:text-muted-foreground",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow]",
        className,
      )}
    />
  );
}
