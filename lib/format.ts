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
