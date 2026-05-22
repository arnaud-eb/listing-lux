import { z } from "zod";
import { CPE_CLASSES, ROOM_TYPES } from "@/lib/constants";

export type PhotoAnalysis = z.infer<typeof photoAnalysisSchema>;

export const photoAnalysisSchema = z.object({
  room_type: z
    .enum(ROOM_TYPES)
    .describe(
      "The primary subject of the photo, given as one of the listed ids. Use 'facade' for the building's exterior front, 'exterior' for grounds / garden surroundings / street views, 'floor-plan' for a floor plan or blueprint, and 'other' when none of the ids fit.",
    ),
  features: z
    .array(z.string())
    .describe(
      "Key features visible: granite countertops, hardwood floors, high ceilings, etc.",
    ),
  style: z
    .string()
    .describe("Style: contemporary, modern, traditional, minimalist, art deco"),
  condition: z
    .string()
    .describe(
      "Condition: newly renovated, immaculate, well-maintained, needs updating",
    ),
  selling_points: z
    .array(z.string())
    .describe("Top selling points for marketing"),
  atmosphere: z
    .string()
    .describe("Overall atmosphere: bright, cozy, spacious, etc."),
  /**
   * Luxembourg energy passport class extracted from a CPE certificate photo.
   * Null when the photo is a regular property photo (no CPE document visible).
   * Populated only when the agent uploads a CPE certificate scan/PDF render.
   */
  cpe_class: z
    .enum(CPE_CLASSES)
    .nullable()
    .describe(
      "Energy performance class from a CPE certificate photo (A+, A, B, C, D, E, F, G, H, I). Set ONLY when the photo IS a CPE certificate or visibly contains the energy class label; otherwise null. Never guess from interior photos.",
    ),
  /** Thermal insulation class from the same CPE certificate. Same null rules as cpe_class. */
  thermal_insulation_class: z
    .enum(CPE_CLASSES)
    .nullable()
    .describe(
      "Thermal insulation class from the CPE certificate, paired with cpe_class. Same value range. Set ONLY when visibly present on a CPE certificate photo; otherwise null.",
    ),
});
