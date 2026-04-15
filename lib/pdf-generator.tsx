import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  Svg,
  Path,
  Circle,
  Rect,
  Line,
  Polygon,
  Polyline,
  Ellipse,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import iconNodes from "lucide-static/icon-nodes.json";
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
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  photo: {
    width: "48%",
    height: 140,
    objectFit: "cover",
    borderRadius: 4,
  },
  photoSingle: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    borderRadius: 4,
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
    fontSize: 8,
    color: GRAY_400,
  },
  goldLine: {
    height: 2,
    backgroundColor: GOLD,
    marginVertical: 12,
    borderRadius: 1,
  },
});

// --- Lucide icon SVG renderer for PDF ---

const ICON_NODES = iconNodes as Record<
  string,
  Array<[string, Record<string, string>]>
>;

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
  const nodes = ICON_NODES[name] ?? ICON_NODES.sparkles;
  if (!nodes) return null;

  const common = {
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {nodes.map(([type, attrs], i) => {
        switch (type) {
          case "path":
            return <Path key={i} d={attrs.d} {...common} />;
          case "circle":
            return (
              <Circle
                key={i}
                cx={attrs.cx}
                cy={attrs.cy}
                r={attrs.r}
                {...common}
              />
            );
          case "rect":
            return (
              <Rect
                key={i}
                x={attrs.x}
                y={attrs.y}
                width={attrs.width}
                height={attrs.height}
                rx={attrs.rx}
                ry={attrs.ry}
                {...common}
              />
            );
          case "line":
            return (
              <Line
                key={i}
                x1={attrs.x1}
                y1={attrs.y1}
                x2={attrs.x2}
                y2={attrs.y2}
                {...common}
              />
            );
          case "polygon":
            return <Polygon key={i} points={attrs.points} {...common} />;
          case "polyline":
            return <Polyline key={i} points={attrs.points} {...common} />;
          case "ellipse":
            return (
              <Ellipse
                key={i}
                cx={attrs.cx}
                cy={attrs.cy}
                rx={attrs.rx}
                ry={attrs.ry}
                {...common}
              />
            );
          default:
            return null;
        }
      })}
    </Svg>
  );
}

// --- PDF Components ---

function Header({ profile }: { profile?: AgentProfile | null }) {
  if (!profile) return null;

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
  return (
    <View style={styles.detailsBar}>
      <Text style={styles.detailItem}>{formatCurrency(property.price)}</Text>
      <Text style={styles.detailItem}>|</Text>
      <Text style={styles.detailItem}>{property.sqm} m²</Text>
      <Text style={styles.detailItem}>|</Text>
      <Text style={styles.detailItem}>
        {property.bedrooms} {labels.bedroom(property.bedrooms)}
      </Text>
      <Text style={styles.detailItem}>|</Text>
      <Text style={styles.detailItem}>
        {property.bathrooms} {labels.bathroom(property.bathrooms)}
      </Text>
      {property.address && (
        <>
          <Text style={styles.detailItem}>|</Text>
          <Text style={styles.detailItem}>{property.address}</Text>
        </>
      )}
    </View>
  );
}

function PhotoGrid({ urls }: { urls: string[] }) {
  const photos = urls.slice(0, 6);
  if (photos.length === 0) return null;

  // First photo large, rest in grid
  return (
    <View>
      <Image src={photos[0]} style={styles.photoSingle} />
      {photos.length > 1 && (
        <View style={styles.photoGrid}>
          {photos.slice(1).map((url, i) => (
            <Image key={i} src={url} style={styles.photo} />
          ))}
        </View>
      )}
    </View>
  );
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

function Highlights({ items }: { items: Highlight[] }) {
  if (!items || items.length === 0) return null;

  return (
    <View>
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

  const contactParts = [
    profile.full_name,
    profile.agency_name,
  ].filter(Boolean);

  const detailParts = [
    profile.phone,
    profile.email,
    profile.agency_website,
  ].filter(Boolean);

  return (
    <View style={styles.footer} fixed>
      <Text>{contactParts.join(" · ")}</Text>
      <Text>{detailParts.join(" · ")}</Text>
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

          <Text style={styles.sectionTitle}>{HIGHLIGHTS_LABEL[language]}</Text>
          <Highlights items={listing.highlights} />

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
