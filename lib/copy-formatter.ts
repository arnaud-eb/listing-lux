import type { Listing, Property, Highlight, Language } from "./types";
import { formatCurrency } from "./format";
import { PROPERTY_DETAIL_LABELS } from "./constants";
import {
  buildingDetailItems,
  listingKindLabel,
  type BuildingDetailKey,
} from "./building-details";

const BUILDING_EMOJIS: Partial<Record<BuildingDetailKey, string>> = {
  yearBuilt: "🏗️",
  floorsTotal: "🏢",
  floorOfUnit: "🛗",
  energyClass: "⚡",
  thermalClass: "🌡️",
  monthlyCharges: "💶",
  availableFrom: "📅",
  address: "📍",
};

/**
 * Building-detail line for email / social copy — formats the shared
 * buildingDetailItems (with the address appended last) so an agent's emailed or
 * shared listing carries the same facts in the same layout the PDF's
 * BuildingDetailsBar does. Returns null when nothing is populated.
 */
function buildBuildingDetailsLine(
  property: Property,
  language: Language,
  { emojis = false }: { emojis?: boolean } = {},
): string | null {
  const items = buildingDetailItems(property, language, { includeAddress: true });
  if (items.length === 0) return null;
  return items
    .map((item) => {
      const prefix = emojis && BUILDING_EMOJIS[item.key]
        ? `${BUILDING_EMOJIS[item.key]} `
        : "";
      return item.label
        ? `${prefix}${item.label}: ${item.value}`
        : `${prefix}${item.value}`;
    })
    .join(emojis ? " | " : " · ");
}

// --- Icon → Emoji mapping (derived at format-time, not stored in DB) ---

const ICON_TO_EMOJI: Record<string, string> = {
  trees: "🌳",
  car: "🚗",
  "cooking-pot": "🍳",
  bath: "🚿",
  mountain: "🏔️",
  "map-pin": "📍",
  shield: "🔒",
  zap: "⚡",
  warehouse: "📦",
  sofa: "🛋️",
  sun: "☀️",
  bed: "🛏️",
  home: "🏠",
  key: "🔑",
  thermometer: "🌡️",
  wifi: "📶",
  flower: "🌸",
  fence: "🏡",
  "train-front": "🚆",
  school: "🎓",
  waves: "🌊",
  dumbbell: "💪",
  baby: "👶",
  dog: "🐕",
  "wine": "🍷",
  "eye": "👁️",
  park: "🌳",
  elevator: "🛗",
  ruler: "📏",
  paintbrush: "🎨",
  sparkles: "✨",
};

export function getEmojiForIcon(icon: string): string {
  return ICON_TO_EMOJI[icon] ?? "✨";
}

// --- Strip emojis ---

export function stripEmojis(text: string): string {
  if (!text) return "";
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
      "",
    )
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- Char limits ---

export const ATHOME_CHAR_LIMIT = 2500;
export const IMMOTOP_CHAR_LIMIT = 3000;

// --- Highlight helpers ---

function buildPropertyDetailsLine(property: Property, language: Language): string {
  const labels = PROPERTY_DETAIL_LABELS[language] ?? PROPERTY_DETAIL_LABELS.en;
  const parts = [
    listingKindLabel(property, language),
    property.price != null ? formatCurrency(property.price) : null,
    property.sqm != null ? `${property.sqm} m²` : null,
    `${property.bedrooms} ${labels.bedroom(property.bedrooms)}`,
    `${property.bathrooms} ${labels.bathroom(property.bathrooms)}`,
  ].filter((p): p is string => p !== null);
  return parts.join(" | ");
}

function highlightTexts(highlights: Highlight[]): string[] {
  return highlights
    .map((h) => (typeof h === "string" ? h : h?.text))
    .filter((t): t is string => !!t);
}

function highlightWithEmojis(highlights: Highlight[]): string[] {
  return highlights
    .filter((h) => (typeof h === "string" ? h : h?.text))
    .map((h) => {
      if (typeof h === "string") return `✨ ${h}`;
      return `${getEmojiForIcon(h.icon)} ${h.text}`;
    });
}

// --- Format: Athome.lu ---

export interface PortalFormatResult {
  text: string;
  charCount: number;
  isOverLimit: boolean;
  overBy: number;
}

export function formatForAthome(listing: Partial<Listing>): PortalFormatResult {
  const title = stripEmojis(listing.title ?? "");
  const description = stripEmojis(listing.description ?? "");
  const highlights = highlightTexts((listing.highlights ?? []) as Highlight[])
    .map((h) => `- ${stripEmojis(h)}`)
    .join("\n");

  const text = [title, description, highlights ? `HIGHLIGHTS:\n${highlights}` : ""]
    .filter(Boolean)
    .join("\n\n");

  const charCount = text.length;
  return {
    text,
    charCount,
    isOverLimit: charCount > ATHOME_CHAR_LIMIT,
    overBy: Math.max(0, charCount - ATHOME_CHAR_LIMIT),
  };
}

// --- Format: ImmoTop.lu ---

export function formatForImmotop(listing: Partial<Listing>): PortalFormatResult {
  const title = listing.title ?? "";
  const description = listing.description ?? "";
  const highlights = highlightWithEmojis((listing.highlights ?? []) as Highlight[]).join("\n");

  const text = [title, description, highlights ? `HIGHLIGHTS:\n${highlights}` : ""]
    .filter(Boolean)
    .join("\n\n");

  const charCount = text.length;
  return {
    text,
    charCount,
    isOverLimit: charCount > IMMOTOP_CHAR_LIMIT,
    overBy: Math.max(0, charCount - IMMOTOP_CHAR_LIMIT),
  };
}

// --- Format: Email ---

export interface EmailFormatResult {
  plainText: string;
  html: string;
}

export function formatForEmail(
  listing: Partial<Listing>,
  property: Property,
): EmailFormatResult {
  const title = listing.title ?? "";
  const description = listing.description ?? "";
  const highlights = highlightWithEmojis((listing.highlights ?? []) as Highlight[]);

  const language = (listing.language ?? "en") as Language;
  const detailsLine = buildPropertyDetailsLine(property, language);
  const buildingLine = buildBuildingDetailsLine(property, language);

  // Plain text
  const plainParts = [
    title,
    detailsLine,
    buildingLine,
    description,
    highlights.length > 0 ? `HIGHLIGHTS:\n${highlights.join("\n")}` : "",
  ].filter(Boolean);
  const plainText = plainParts.join("\n\n");

  // HTML (bold title + details for email clients)
  const highlightsHtml = highlights.map((h) => `${h}<br>`).join("\n");
  const descriptionHtml = description
    .split("\n\n")
    .map((p) => `<p>${p}</p>`)
    .join("\n");
  const htmlParts = [
    `<strong>${title}</strong>`,
    `<strong>${detailsLine}</strong>`,
    buildingLine ? `<p>${buildingLine}</p>` : "",
    descriptionHtml,
    highlightsHtml ? `<strong>HIGHLIGHTS:</strong><br>\n${highlightsHtml}` : "",
  ].filter(Boolean);
  const html = htmlParts.join("<br>\n");

  return { plainText, html };
}

// --- Format: Social Media ---

export function formatForSocialMedia(
  listing: Partial<Listing>,
  property: Property,
): string {
  const title = listing.title ?? "";
  const description = listing.description ?? "";
  const highlights = highlightWithEmojis((listing.highlights ?? []) as Highlight[]);
  const hashtags = generateHashtags(listing);

  const language = (listing.language ?? "en") as Language;
  const labels = PROPERTY_DETAIL_LABELS[language] ?? PROPERTY_DETAIL_LABELS.en;
  const kindLabel = listingKindLabel(property, language);
  const detailParts = [
    kindLabel ? `🏷️ ${kindLabel}` : null,
    property.price != null ? `💰 ${formatCurrency(property.price)}` : null,
    property.sqm != null ? `📏 ${property.sqm} m²` : null,
    `🛏️ ${property.bedrooms} ${labels.bedroom(property.bedrooms)}`,
    `🚿 ${property.bathrooms} ${labels.bathroom(property.bathrooms)}`,
  ].filter((p): p is string => p !== null);
  const detailsLine = detailParts.join(" | ");
  const buildingLine = buildBuildingDetailsLine(property, language, {
    emojis: true,
  });

  const parts = [
    `🏠 ${title}`,
    detailsLine,
    buildingLine,
    description,
    highlights.length > 0 ? `HIGHLIGHTS:\n${highlights.join("\n")}` : "",
    hashtags,
  ].filter(Boolean);

  return parts.join("\n\n");
}

// --- Hashtags ---

/**
 * Format the listing's stored hashtags for social-media copy.
 * Hashtags are curated server-side at generation time (market base + property-type +
 * neighborhood + AI-generated listing-specific) and stored on the listing.
 * The user can edit/remove any of them in the UI — we just render what's stored.
 */
export function generateHashtags(listing: Partial<Listing>): string {
  const tags = listing.hashtags ?? [];
  return tags
    .map((t) => t?.trim())
    .filter((t): t is string => !!t)
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
    .join(" ");
}
