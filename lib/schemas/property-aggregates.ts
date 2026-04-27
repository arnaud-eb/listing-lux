import { z } from "zod";
import { PROPERTY_TYPES, FEATURE_OPTIONS } from "@/lib/constants";

const propertyTypeValues = PROPERTY_TYPES.map((t) => t.value) as [
  string,
  ...string[],
];

const featureIds = FEATURE_OPTIONS.map((f) => f.id) as [string, ...string[]];

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
