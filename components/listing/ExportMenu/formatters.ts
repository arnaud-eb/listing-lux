import {
  formatForAthome,
  formatForImmotop,
  formatForEmail,
  formatForSocialMedia,
} from "@/lib/copy-formatter";
import { copyPlainText, copyRichText } from "@/lib/clipboard";
import type { Listing, Property } from "@/lib/types";

export type CopyFormat = "athome" | "immotop" | "email" | "social";

interface CopyArgs {
  listing: Partial<Listing>;
  property: Property;
}

/**
 * Map dispatch — replaces the prior switch ladder. Each entry produces the
 * formatted text and writes it to the clipboard. Adding a new format = adding
 * one entry; no other code changes.
 */
export const FORMATTERS: Record<CopyFormat, (args: CopyArgs) => Promise<void>> = {
  athome: async ({ listing }) => {
    const result = formatForAthome(listing);
    await copyPlainText(result.text);
  },
  immotop: async ({ listing }) => {
    const result = formatForImmotop(listing);
    await copyPlainText(result.text);
  },
  email: async ({ listing, property }) => {
    const result = formatForEmail(listing, property);
    await copyRichText(result.html, result.plainText);
  },
  social: async ({ listing, property }) => {
    const text = formatForSocialMedia(listing, property);
    await copyPlainText(text);
  },
};
