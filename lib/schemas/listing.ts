import { z } from "zod";

export const listingOutputSchema = z.object({
  title: z
    .string()
    .describe("Compelling property listing title, 8-15 words"),
  description: z
    .string()
    .describe(
      "Full property description, 3-5 paragraphs separated by double newlines. Engaging, professional luxury real estate tone.",
    ),
  highlights: z
    .array(z.object({
      text: z.string().min(1),
      icon: z.string().describe("Lucide React icon name that best represents this highlight (e.g. 'trees', 'car', 'bath', 'mountain', 'shield', 'zap')"),
    }))
    .describe("5-8 key selling points with contextual Lucide icon names"),
  hashtags: z
    .array(z.string().min(1))
    .describe(
      "3-5 listing-specific social-media hashtags (e.g. distinctive architectural style, standout amenities, lifestyle). Do NOT include generic market/location hashtags (#Luxembourg, #RealEstate) — those are added separately. Each value should be a single word or CamelCase, leading # optional.",
    ),
});

export type ListingOutput = z.infer<typeof listingOutputSchema>;
