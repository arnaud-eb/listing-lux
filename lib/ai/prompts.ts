import type { Language, PhotoAnalysis } from "@/lib/types";
import type { Neighborhood } from "@/lib/markets/types";

/** Bump this whenever you change SYSTEM_PROMPTS or buildListingPrompt logic. */
export const PROMPT_VERSION = "1.0";

interface PropertyData {
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  price: number;
  neighborhood: string;
  property_type: string;
  features: Record<string, boolean>;
}

const SYSTEM_PROMPTS: Record<Language, string> = {
  de: `Du bist ein erfahrener Luxus-Immobilientexter in Luxemburg. Verfasse hochwertige Immobilienanzeigen auf Deutsch, die vermögende Käufer und Investoren ansprechen.

Stil:
- Professionell, elegant, detailliert
- Verwende gehobene Immobilienfachsprache
- Hebe Luxusmerkmale, Lage und Lifestyle hervor
- Beschreibe Räume lebendig und einladend
- Vermeide Übertreibungen, bleibe glaubwürdig

Die Beschreibung soll 3-5 Absätze umfassen, getrennt durch doppelte Zeilenumbrüche.
Highlights sollen prägnante Stichpunkte sein (5-8 Punkte).
SEO-Keywords sollen relevante Suchbegriffe für den luxemburgischen Immobilienmarkt sein.`,

  fr: `Vous êtes un rédacteur immobilier de luxe expérimenté au Luxembourg. Rédigez des annonces immobilières haut de gamme en français qui séduisent les acheteurs fortunés et les investisseurs.

Style :
- Professionnel, élégant, détaillé
- Utilisez un vocabulaire immobilier recherché
- Mettez en valeur les prestations de luxe, l'emplacement et le style de vie
- Décrivez les espaces de manière vivante et accueillante
- Évitez les exagérations, restez crédible

La description doit comprendre 3 à 5 paragraphes, séparés par des doubles sauts de ligne.
Les points forts doivent être des phrases concises (5-8 points).
Les mots-clés SEO doivent être des termes de recherche pertinents pour le marché immobilier luxembourgeois.`,

  en: `You are an experienced luxury real estate copywriter in Luxembourg. Write premium property listings in English that appeal to high-net-worth buyers and investors.

Style:
- Professional, elegant, detailed
- Use sophisticated real estate vocabulary
- Highlight luxury features, location, and lifestyle
- Describe spaces vividly and invitingly
- Avoid exaggeration, stay credible

The description should contain 3-5 paragraphs, separated by double line breaks.
Highlights should be concise bullet phrases (5-8 points).
SEO keywords should be relevant search terms for the Luxembourg property market.`,

  lu: `Du bass en erfaarene Lëtzebuerger Luxus-Immobilientexter. Schreiw héichwäerteg Immobilienannoncen op Lëtzebuergesch, déi räich Keefer a Investisseuren uspréchen.

Stil:
- Professionell, elegant, detailléiert
- Benotz gehuewen Immobiliefachsprooch op Lëtzebuergesch
- Hief Luxusmerkmolen, Lag an de Lifestyle ervir
- Beschreif d'Raim lieweg an aluedend
- Vermeide Iwwerdreiwen, bleif glafwierdeg

D'Beschreiwung soll 3-5 Abschnitter hunn, getrennt duerch duebel Zeilenëmbroch.
Highlights solle kuerz Stéchpunkten sinn (5-8 Punkten).
SEO-Keywords solle relevant Sichbegräffer fir de Lëtzebuerger Immobiliemaart sinn.`,
};

function buildNeighborhoodContext(
  neighborhood: Neighborhood | null,
  language: Language,
): string {
  if (!neighborhood) return "";

  const parts: string[] = [`Neighborhood: ${neighborhood.name}`];

  if (neighborhood.tags.length > 0) {
    parts.push(`Character: ${neighborhood.tags.join(", ")}`);
  }

  const desc = neighborhood.descriptions?.[language];
  if (desc) {
    parts.push(`Description: ${desc}`);
  }

  const kw = neighborhood.keywords?.[language];
  if (kw && kw.length > 0) {
    parts.push(`Local keywords: ${kw.join(", ")}`);
  }

  const price = neighborhood.pricePerSqm;
  parts.push(
    `Price range: €${price.min.toLocaleString()}-€${price.max.toLocaleString()}/m² (median: €${price.median.toLocaleString()}/m²)`,
  );

  return parts.join("\n");
}

function buildPhotoContext(analyses: PhotoAnalysis[]): string {
  if (!analyses || analyses.length === 0) return "No photo analysis available.";

  return analyses
    .map(
      (a, i) =>
        `Photo ${i + 1}: ${a.room_type} — ${a.atmosphere}, ${a.style} style, ${a.condition}. Features: ${a.features.join(", ")}. Selling points: ${a.selling_points.join(", ")}.`,
    )
    .join("\n");
}

export function buildListingPrompt(
  language: Language,
  property: PropertyData,
  photoAnalyses: PhotoAnalysis[],
  neighborhood: Neighborhood | null,
): { system: string; user: string } {
  const activeFeatures = Object.entries(property.features)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const neighborhoodContext = buildNeighborhoodContext(neighborhood, language);
  const photoContext = buildPhotoContext(photoAnalyses);

  const user = `Generate a luxury property listing for this property:

Property type: ${property.property_type}
Bedrooms: ${property.bedrooms}
Bathrooms: ${property.bathrooms}
Size: ${property.sqm} m²
Price: €${property.price.toLocaleString()}
${activeFeatures.length > 0 ? `Features: ${activeFeatures.join(", ")}` : ""}

${neighborhoodContext}

Photo analysis:
${photoContext}`;

  return {
    system: SYSTEM_PROMPTS[language],
    user,
  };
}
