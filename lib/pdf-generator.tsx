import { Fragment } from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import codepoints from "lucide-static/font/codepoints.json";
import type { Listing, Property, Highlight, AgentProfile, Language } from "./types";
import { formatCurrency } from "./format";
import {
  LANGUAGE_LABELS,
  HIGHLIGHTS_LABEL,
  DESCRIPTION_LABEL,
  PROPERTY_DETAIL_LABELS,
} from "./constants";
import path from "path";

// --- Font registration (local TTF files in public/fonts/) ---

const fontsDir = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(fontsDir, "Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontsDir, "Inter-Bold.ttf"), fontWeight: 700 },
  ],
});

Font.register({
  family: "Playfair Display",
  src: path.join(fontsDir, "PlayfairDisplay-Bold.ttf"),
  fontWeight: 700,
});

// Lucide icon font — renders icons as text glyphs, eliminating per-element SVG parsing.
Font.register({
  family: "Lucide",
  src: path.join(fontsDir, "Lucide.ttf"),
});

// --- Styles ---

const GOLD = "#d4af35";
const NAVY = "#0a1128";
const GRAY_400 = "#9ca3af";
const GRAY_600 = "#4b5563";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    color: NAVY,
    padding: 40,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  agencyName: {
    fontFamily: "Inter",
    fontSize: 9,
    color: GRAY_400,
    textAlign: "right",
  },
  languageBadge: {
    fontSize: 8,
    color: GOLD,
    backgroundColor: "#faf7f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 16,
  },
  title: {
    fontFamily: "Playfair Display",
    fontSize: 22,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 8,
  },
  detailsBar: {
    flexDirection: "row",
    gap: 12,
    fontSize: 10,
    color: GRAY_600,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `1px solid #e5e7eb`,
  },
  detailItem: {
    fontSize: 10,
  },
  sectionTitle: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 10,
    color: GRAY_600,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 10,
    color: GRAY_600,
    flex: 1,
  },
  photoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  photoRowLast: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  // Single hero photo — used for 1-photo layout and as the top row when paired with a grid below.
  photoHeroSingle: {
    width: "100%",
    height: 300,
    objectFit: "cover",
    borderRadius: 4,
    marginBottom: 16,
  },
  photoHero: {
    width: "100%",
    height: 240,
    objectFit: "cover",
    borderRadius: 4,
  },
  // Two-up row — each photo takes half-width.
  photoPair: {
    flex: 1,
    height: 180,
    objectFit: "cover",
    borderRadius: 4,
  },
  // Three-up row — each photo takes a third of the width.
  photoTrio: {
    flex: 1,
    height: 120,
    objectFit: "cover",
    borderRadius: 4,
  },
  // 2x2 grid photos (used when 4 photos sit below the hero, i.e. total = 5).
  photoQuad: {
    width: "48%",
    height: 140,
    objectFit: "cover",
    borderRadius: 4,
  },
  photoGridQuad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    borderTop: `1px solid ${GOLD}`,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    fontSize: 8,
    color: GRAY_400,
  },
  footerLeft: {
    flexDirection: "column",
    gap: 2,
  },
  goldLine: {
    height: 2,
    backgroundColor: GOLD,
    marginVertical: 12,
    borderRadius: 1,
  },
});

// --- Lucide icon renderer for PDF ---
// Uses the Lucide icon font: each icon is a single Unicode glyph rendered as text.
// Single source of truth (lucide-static), no per-element SVG parsing, future-proof.

const CODEPOINTS = codepoints as Record<string, number>;

function LucideIcon({
  name,
  size = 12,
  color = GOLD,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  // Fall back to sparkles when the AI-supplied icon name doesn't exist in Lucide.
  // Matches the website's DynamicIcon fallback behavior.
  const code = CODEPOINTS[name] ?? CODEPOINTS.sparkles;
  if (code === undefined) return null;

  return (
    <Text style={{ fontFamily: "Lucide", fontSize: size, color }}>
      {String.fromCodePoint(code)}
    </Text>
  );
}

// --- PDF Components ---

function Header({ profile }: { profile?: AgentProfile | null }) {
  // Suppress when none of the fields the header consumes are populated.
  // Per-component guards (vs. one global hasAnyBranding) handle edge cases
  // like "user filled only agency_address" cleanly — no empty Views, no
  // empty Text nodes on the PDF.
  // .trim() defensively — a stray space from an old save shouldn't render
  // an empty header.
  if (!profile?.logo_url?.trim() && !profile?.agency_name?.trim()) return null;

  return (
    <View style={styles.header}>
      <View>
        {profile.logo_url && (
          <Image src={profile.logo_url} style={styles.logo} />
        )}
      </View>
      <View>
        {profile.agency_name && (
          <Text style={styles.agencyName}>{profile.agency_name}</Text>
        )}
      </View>
    </View>
  );
}

function DetailsBar({
  property,
  language,
}: {
  property: Property;
  language: Language;
}) {
  const labels = PROPERTY_DETAIL_LABELS[language];
  const items: string[] = [];
  if (property.price != null) items.push(formatCurrency(property.price));
  if (property.sqm != null) items.push(`${property.sqm} m²`);
  items.push(`${property.bedrooms} ${labels.bedroom(property.bedrooms)}`);
  items.push(`${property.bathrooms} ${labels.bathroom(property.bathrooms)}`);
  if (property.address) items.push(property.address);

  return (
    <View style={styles.detailsBar}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <Text style={styles.detailItem}>|</Text>}
          <Text style={styles.detailItem}>{item}</Text>
        </Fragment>
      ))}
    </View>
  );
}

function PhotoGrid({ urls }: { urls: string[] }) {
  // Count-aware layout: photos fill the block proportionally, so fewer photos
  // don't leave awkward empty grid cells and don't push text off the page.
  const photos = urls.slice(0, 5);
  if (photos.length === 0) return null;

  switch (photos.length) {
    case 1:
      // Single hero image, taller so it fills the space.
      return (
        <View>
          <Image src={photos[0]} style={styles.photoHeroSingle} />
        </View>
      );

    case 2:
      // Two side-by-side, equal width.
      return (
        <View style={styles.photoRowLast}>
          <Image src={photos[0]} style={styles.photoPair} />
          <Image src={photos[1]} style={styles.photoPair} />
        </View>
      );

    case 3:
      // Hero on top, two equal below.
      return (
        <View>
          <View style={styles.photoRow}>
            <Image src={photos[0]} style={styles.photoHero} />
          </View>
          <View style={styles.photoRowLast}>
            <Image src={photos[1]} style={styles.photoPair} />
            <Image src={photos[2]} style={styles.photoPair} />
          </View>
        </View>
      );

    case 4:
      // Hero on top, three equal below.
      return (
        <View>
          <View style={styles.photoRow}>
            <Image src={photos[0]} style={styles.photoHero} />
          </View>
          <View style={styles.photoRowLast}>
            <Image src={photos[1]} style={styles.photoTrio} />
            <Image src={photos[2]} style={styles.photoTrio} />
            <Image src={photos[3]} style={styles.photoTrio} />
          </View>
        </View>
      );

    case 5:
    default:
      // Hero + 2x2 grid (original 5-photo layout).
      return (
        <View>
          <Image src={photos[0]} style={styles.photoHeroSingle} />
          <View style={styles.photoGridQuad}>
            {photos.slice(1).map((url, i) => (
              <Image key={i} src={url} style={styles.photoQuad} />
            ))}
          </View>
        </View>
      );
  }
}

function Description({ text }: { text: string }) {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return (
    <View>
      {paragraphs.map((p, i) => (
        <Text key={i} style={styles.description}>
          {p}
        </Text>
      ))}
    </View>
  );
}

function HighlightsSection({
  items,
  title,
}: {
  items: Highlight[];
  title: string;
}) {
  if (!items || items.length === 0) return null;

  // wrap={false} prevents the highlights list from splitting across pages,
  // avoiding orphan items (e.g. a single bullet stranded on a mostly-empty page).
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((h, i) => {
        const highlight = typeof h === "string" ? { text: h, icon: "sparkles" } : h;
        return (
          <View key={i} style={styles.highlightRow}>
            <LucideIcon name={highlight.icon} size={12} color={GOLD} />
            <Text style={styles.highlightText}>{highlight.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Footer({ profile }: { profile?: AgentProfile | null }) {
  if (!profile) return null;

  // .trim() filter so a whitespace-only field doesn't bleed " · " separators
  // into the rendered footer.
  const isPresent = (v: string | null | undefined): v is string =>
    typeof v === "string" && v.trim() !== "";

  const contactParts = [profile.full_name, profile.agency_name].filter(
    isPresent,
  );

  const detailParts = [
    profile.phone,
    profile.email,
    profile.agency_website,
  ].filter(isPresent);

  // Same per-component reasoning as Header: don't render at all when
  // there's nothing to populate either side.
  const hasLeft = contactParts.length > 0 || Boolean(profile.agency_address);
  const hasRight = detailParts.length > 0;
  if (!hasLeft && !hasRight) return null;

  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerLeft}>
        {contactParts.length > 0 && (
          <Text>{contactParts.join(" · ")}</Text>
        )}
        {profile.agency_address && (
          <Text>{profile.agency_address}</Text>
        )}
      </View>
      {hasRight && <Text>{detailParts.join(" · ")}</Text>}
    </View>
  );
}

// --- Main PDF Document ---

interface ListingPDFProps {
  property: Property;
  listings: Array<{ language: Language; listing: Listing }>;
  profile?: AgentProfile | null;
}

function ListingPDF({ property, listings, profile }: ListingPDFProps) {
  return (
    <Document>
      {listings.map(({ language, listing }) => (
        <Page key={language} size="A4" style={styles.page}>
          <Header profile={profile} />

          <Text style={styles.languageBadge}>{LANGUAGE_LABELS[language]}</Text>
          <Text style={styles.title}>{listing.title}</Text>

          <DetailsBar property={property} language={language} />
          <PhotoGrid urls={property.photo_urls} />

          <Text style={styles.sectionTitle}>{DESCRIPTION_LABEL[language]}</Text>
          <Description text={listing.description} />

          <View style={styles.goldLine} />

          <HighlightsSection
            items={listing.highlights}
            title={HIGHLIGHTS_LABEL[language]}
          />

          <Footer profile={profile} />
        </Page>
      ))}
    </Document>
  );
}

// --- Export function (used in API route) ---

export async function generateListingPDF(
  property: Property,
  listings: Array<{ language: Language; listing: Listing }>,
  profile?: AgentProfile | null,
): Promise<Buffer> {
  return renderToBuffer(
    <ListingPDF property={property} listings={listings} profile={profile} />,
  );
}
