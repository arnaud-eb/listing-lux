import type { AgentProfile, Language, Property } from "./types";

/**
 * Convert a string to CamelCase by stripping special characters,
 * splitting on whitespace/hyphens, then capitalizing each word.
 *
 * Examples:
 *   "Unicorn Real Estate" → "UnicornRealEstate"
 *   "RE/MAX Luxe"         → "REMAXLuxe"
 *   "  spaces  "          → "Spaces"
 *   ""                    → ""
 */
export function toCamelCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

/**
 * Format a neighborhood slug for use in a filename:
 *   "luxembourg-city" → "Luxembourg-City"
 */
function formatNeighborhoodSegment(neighborhood: string): string {
  return neighborhood
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s/g, "-");
}

/**
 * Capitalize the first letter of a property type:
 *   "apartment" → "Apartment"
 */
function formatPropertyTypeSegment(propertyType: string): string {
  if (!propertyType) return "Listing";
  return propertyType.charAt(0).toUpperCase() + propertyType.slice(1);
}

/**
 * Build a PDF download filename from the agent profile and property.
 *
 * Pattern: `{Brand}-{Neighborhood}-{PropertyType}[-{LANG}].pdf`
 *
 * - Brand: agency name in CamelCase, falls back to "ListingLux"
 * - Neighborhood: title-cased property neighborhood
 * - PropertyType: capitalized property type
 * - LANG: appended in uppercase only when exactly one language is exported
 *
 * Examples:
 *   profile=Unicorn Real Estate, property in Kirchberg apartment, all 4 langs
 *     → "UnicornRealEstate-Kirchberg-Apartment.pdf"
 *   single FR export
 *     → "UnicornRealEstate-Kirchberg-Apartment-FR.pdf"
 *   no profile, cloche-d-or villa, single DE export
 *     → "ListingLux-Cloche-D-Or-Villa-DE.pdf"
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

  // Append language code only when exactly one language is selected
  const languageSuffix =
    languages && languages.length === 1
      ? `-${languages[0].toUpperCase()}`
      : "";

  return `${brandPrefix}-${neighborhood}-${propertyType}${languageSuffix}.pdf`;
}
