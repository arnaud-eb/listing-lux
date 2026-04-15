/**
 * Phone number utilities.
 *
 * The app stores phone numbers in E.164 format (e.g. "+352661308700") via
 * `react-phone-number-input`, but legacy data may use other formats — this
 * module normalizes them so the library doesn't reject them on render.
 */

/**
 * Normalize a phone number string to E.164 format.
 *
 * Handles common legacy/international formats:
 * - Empty input → `undefined` (so `react-phone-number-input` shows placeholder)
 * - Already E.164 (`+352661308700`) → returned unchanged
 * - International call prefix (`0032498230533`) → converted to `+32498230533`
 * - Whitespace → stripped before parsing
 * - Anything else → returned as-is for the library to handle/reject
 *
 * Note: this is intentionally permissive. It only fixes the most common
 * legacy formats; truly invalid phone numbers are passed through so the
 * user can see and correct them.
 */
export function normalizeToE164(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;

  const trimmed = raw.replace(/\s/g, "");
  if (trimmed.length === 0) return undefined;

  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("00")) return `+${trimmed.slice(2)}`;

  // Fallback: pass through for the library to interpret.
  // Likely won't be a valid E.164 — user will need to correct it.
  return trimmed;
}
