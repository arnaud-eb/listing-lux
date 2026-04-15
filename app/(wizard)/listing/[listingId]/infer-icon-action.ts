"use server";

import { generateText } from "ai";
import { openai, LISTING_MODEL } from "@/lib/ai/client";

/**
 * Lightweight AI call to infer a Lucide icon name for a highlight.
 * Called on blur when a user edits a highlight's text.
 */
export async function inferHighlightIcon(
  text: string,
): Promise<{ icon: string }> {
  if (!text || text.trim().length < 2) {
    return { icon: "sparkles" };
  }

  try {
    const { text: result } = await generateText({
      model: openai(LISTING_MODEL),
      maxTokens: 20,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Given a real estate property highlight, respond with ONLY a single Lucide React icon name (kebab-case) that best represents it. Examples: trees, car, bath, mountain, shield, zap, sofa, cooking-pot, map-pin, sun, bed, home, key, thermometer, wifi, waves, elevator, ruler, paintbrush, fence, school, dumbbell. Respond with just the icon name, nothing else.",
        },
        {
          role: "user",
          content: text.trim(),
        },
      ],
    });

    const icon = result.trim().toLowerCase().replace(/[^a-z-]/g, "");
    return { icon: icon || "sparkles" };
  } catch {
    return { icon: "sparkles" };
  }
}
