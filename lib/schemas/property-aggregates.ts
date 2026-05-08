import { z } from "zod";
import { PROPERTY_TYPES, FEATURE_OPTIONS, CPE_CLASSES } from "@/lib/constants";

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
  /**
   * The energy passport class extracted across the photo set. Set ONLY when one of the
   * photos is a CPE certificate that displays the class. Null otherwise — never inferred
   * from build year, materials, or other indirect signals.
   */
  cpe_class: z
    .enum(CPE_CLASSES)
    .nullable()
    .optional()
    .describe(
      "Energy performance class read off a CPE certificate photo, if present. Null otherwise.",
    ),
  thermal_insulation_class: z
    .enum(CPE_CLASSES)
    .nullable()
    .optional()
    .describe(
      "Thermal insulation class read off the same CPE certificate, if present. Null otherwise.",
    ),
});

export type PropertyAggregates = z.infer<typeof propertyAggregatesSchema>;
