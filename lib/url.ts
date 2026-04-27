/**
 * URL utilities.
 *
 * Forms accept user-friendly input (e.g. "agency.lu" or "www.agency.lu")
 * and normalize to a canonical URL with a protocol before validation.
 */

/**
 * Normalize a user-typed website to a canonical URL with `https://` prefix.
 *
 * - Empty/whitespace input → `undefined` (website is optional)
 * - Already has `http://` or `https://` → returned unchanged (whitespace trimmed)
 * - Otherwise → prepends `https://`
 *
 * Examples:
 *   "agency.lu"            → "https://agency.lu"
 *   "www.agency.lu"        → "https://www.agency.lu"
 *   "https://agency.lu"    → "https://agency.lu"
 *   "http://agency.lu"     → "http://agency.lu"
 *   "  agency.lu  "        → "https://agency.lu"
 *   ""                     → undefined
 *
 * This is a transformation, not a validator. Malformed input (e.g. "not a url")
 * will be normalized to "https://not a url" and rejected downstream by Zod.
 */
export function normalizeWebsite(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
