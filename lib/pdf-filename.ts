import type { AgentProfile, Language, Property } from "./types";

/**
 * Strip Latin diacritics via Unicode NFKD decomposition: "Côté" → "Cote",
 * "Müller" → "Muller", "Sànchez" → "Sanchez". NFKD splits accented characters
 * into base + combining mark, then we drop every combining mark
 * (U+0300–U+036F).
 *
 * Why not the `slugify` package: its charmap converts "&" → "and" and "€" →
 * "euro" — surprising in a filename context and contrary to the existing
 * test contract that drops both. Disabling the charmap requires global
 * mutation. `String.prototype.normalize` is the standard JS way and gives us
 * exactly what we need for the Luxembourg/Belgium/France market (Latin
 * scripts with diacritics).
 *
 * Caveats: doesn't transliterate ß → ss, æ → ae, ø → o, or Cyrillic/CJK
 * scripts. None of those are expected in agency names for this market; if
 * they appear, the downstream `/[^a-zA-Z0-9\s-]/g` strip drops them silently.
 */
function stripDiacritics(input: string): string {
  // U+0300–U+036F is the "Combining Diacritical Marks" Unicode block.
  return input.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

/**
 * Convert an arbitrary string to Pascal-case ("UnicornRealEstate") with
 * proper Unicode handling — "Côté Lux" → "CoteLux", not "CtLux".
 */
export function toCamelCase(input: string): string {
  return stripDiacritics(input)
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

/** Title-case a neighborhood slug, preserving hyphen separators: "cloche-d-or" → "Cloche-D-Or". */
function formatNeighborhoodSegment(neighborhood: string): string {
  return stripDiacritics(neighborhood)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s/g, "-");
}

/** "apartment" → "Apartment". Property-type values are a closed ASCII set. */
function formatPropertyTypeSegment(propertyType: string): string {
  if (!propertyType) return "Listing";
  return propertyType.charAt(0).toUpperCase() + propertyType.slice(1);
}

/**
 * Build a PDF download filename from the agent profile and property.
 *
 * Pattern: `{Brand}-{Neighborhood}-{PropertyType}[-{LANG}].pdf`
 *
 * - Brand: agency name in Pascal-case, falls back to "ListingLux"
 * - Neighborhood: title-cased property neighborhood
 * - PropertyType: capitalized property type
 * - LANG: appended in uppercase only when exactly one language is exported
 */
export function buildPdfFilename(
  property: Pick<Property, "neighborhood" | "property_type">,
  profile?: Pick<AgentProfile, "agency_name"> | null,
  languages?: Language[],
): string {
  const brandPrefix = profile?.agency_name
    ? toCamelCase(profile.agency_name) || "ListingLux"
    : "ListingLux";

  const neighborhood = formatNeighborhoodSegment(
    property.neighborhood || "property",
  );
  const propertyType = formatPropertyTypeSegment(
    property.property_type || "listing",
  );

  const languageSuffix =
    languages && languages.length === 1
      ? `-${languages[0].toUpperCase()}`
      : "";

  return `${brandPrefix}-${neighborhood}-${propertyType}${languageSuffix}.pdf`;
}
