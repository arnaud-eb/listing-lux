import { z } from "zod";

export type PhotoAnalysis = z.infer<typeof photoAnalysisSchema>;

export const photoAnalysisSchema = z.object({
  room_type: z
    .string()
    .describe(
      "Room type: kitchen, bedroom, living room, bathroom, balcony, exterior, building facade",
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
});
