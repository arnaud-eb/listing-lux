import { z } from "zod";
import { PROPERTY_TYPES, FEATURE_OPTIONS, type CpeClass } from "@/lib/constants";

const propertyTypeValues = PROPERTY_TYPES.map((t) => t.value) as [
  string,
  ...string[],
];

const featureIds = FEATURE_OPTIONS.map((f) => f.id) as [string, ...string[]];

/**
 * What the LLM emits. Kept lean — `cpe_class` and `thermal_insulation_class` are NOT
 * part of this schema because OpenAI's strict structured-output mode rejects optional
 * fields, and a `.nullable()` field would force the LLM to emit a class for properties
 * with no CPE certificate (the rubric §6 anchor 1 forbids this). The CPE values are
 * read separately from `PhotoAnalysis[].cpe_class` in `derivePropertyAggregates`.
 */
export const propertyAggregatesSchema = z.object({
  property_type: z
    .enum(propertyTypeValues)
    .describe(
      "Best-fit overall property type given the photos. Pick the single closest match.",
    ),
  features: z
    .array(z.enum(featureIds))
    .describe(
      "Visible amenities. Only include items that are clearly evidenced by the photos — do not guess.",
    ),
});

export type PropertyAggregates = z.infer<typeof propertyAggregatesSchema>;

/** What `derivePropertyAggregates` returns: schema fields + post-aggregation CPE reads. */
export interface DerivedAggregates extends PropertyAggregates {
  cpe_class: CpeClass | null;
  thermal_insulation_class: CpeClass | null;
}
