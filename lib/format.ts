/**
 * Shared number / price formatting utilities.
 *
 * All formatters use the market locale (fr-LU) so thousand separators
 * and currency symbols are consistent across the app.
 */

const LOCALE = "fr-LU";

// --- Number formatting (no currency symbol) ---

const NUMBER_FORMATTER = new Intl.NumberFormat(LOCALE);

/** Format a number with thousand separators (e.g. 850.000) */
export function formatNumber(value: number | ""): string {
  if (value === "" || value === 0) return "";
  return NUMBER_FORMATTER.format(value);
}

/** Strip non-digit characters and parse to number */
export function parseFormattedNumber(input: string): number | "" {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits);
}

// --- Integer input sanitization ---

/**
 * Sanitize a raw text input into a display string + parsed integer. Shared by
 * the property form's `NumberField` and the listing `PropertyHeader` inline
 * editors — both need to strip non-digits (optionally accepting a leading
 * minus), collapse multiple minuses, and parse the result without silently
 * truncating ("1,998" must produce 1998, not 1).
 *
 * `value === ""` covers empty input, a transient lone "-", and unparseable
 * garbage. Callers decide whether `""` should clear the model or be ignored.
 */
export function parseIntegerInput(
  raw: string,
  { allowNegative = false }: { allowNegative?: boolean } = {},
): { cleaned: string; value: number | "" } {
  let cleaned = raw.replace(allowNegative ? /[^\d-]/g : /\D/g, "");
  if (allowNegative) {
    const negative = cleaned.startsWith("-");
    cleaned = (negative ? "-" : "") + cleaned.replace(/-/g, "");
  }
  if (cleaned === "" || cleaned === "-") {
    return { cleaned, value: "" };
  }
  const n = parseInt(cleaned, 10);
  return { cleaned, value: Number.isFinite(n) ? n : "" };
}

// --- Currency formatting ---

const CURRENCY_FORMATTER = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Format a number as currency (e.g. 850.000 €) */
export function formatCurrency(amount: number): string {
  return CURRENCY_FORMATTER.format(amount);
}

// --- Date formatting ---

const DATE_LOCALES: Record<string, string> = {
  de: "de-LU",
  fr: "fr-LU",
  en: "en-GB",
};

/**
 * Format an ISO `YYYY-MM-DD` date for display in a listing language. Parsed as
 * a plain calendar date (component-wise) so there is no timezone shift.
 */
export function formatListingDate(iso: string, language: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat(DATE_LOCALES[language] ?? LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}
