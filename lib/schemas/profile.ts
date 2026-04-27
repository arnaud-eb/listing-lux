import { z } from "zod";
import type { AgentProfile } from "@/lib/types";

/**
 * Email format rule. Single source of truth for both server-side validation
 * (via the Zod schema below) and the client-side inline error in
 * BrandingForm — they import the helpers from here so they can never drift.
 *
 * The regex is intentionally simple ("at-least-one char @ at-least-one char
 * . at-least-one char"). Real email validation requires SMTP; this catches
 * obvious typos which is what client-side checks are for.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_INVALID_MESSAGE = "Enter a valid email (e.g. agent@agency.lu)";

/**
 * Returns true when the value is empty (the field is optional) OR matches
 * the email format. Use for inline form-level checks.
 */
export function isValidEmail(value: string): boolean {
  return value === "" || EMAIL_REGEX.test(value);
}

export const agentProfileSchema = z.object({
  // All fields are optional — branding is itself optional in the PDF flow,
  // so the form must accept any subset of fields, including none at all.
  full_name: z.string().optional().or(z.literal("")),
  agency_name: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .regex(EMAIL_REGEX, EMAIL_INVALID_MESSAGE)
    .optional()
    .or(z.literal("")),
  logo_url: z.string().url().optional().nullable(),
  agency_address: z.string().optional(),
  agency_website: z
    .string()
    .url("Must be a valid URL (e.g. https://example.com)")
    .optional()
    .or(z.literal("")),
});

export type AgentProfileInput = z.infer<typeof agentProfileSchema>;

/** True when a string is null/undefined/"" or only whitespace. */
export function isBlank(v: string | null | undefined): boolean {
  return !v || v.trim() === "";
}

/**
 * Returns true when no branding will appear on the PDF — either there's
 * no profile row at all, or the row exists but every branding-surfacing
 * field is effectively empty (null, "", or whitespace-only).
 *
 * Single source of truth for two consumers:
 * - LanguagesStep card: switches between "Add your branding" empty state
 *   and the populated avatar+name view.
 * - BrandingForm Clear All button: only appears when there's persisted
 *   branding worth clearing (typing into a fresh form is not a destructive
 *   operation).
 *
 * Mirrors the per-component PDF guards in lib/pdf-generator.tsx so the
 * card, the form button, and the rendered PDF all agree on what counts
 * as "empty".
 */
export function hasNoBranding(profile: AgentProfile | null | undefined): boolean {
  if (!profile) return true;
  return (
    isBlank(profile.logo_url) &&
    isBlank(profile.full_name) &&
    isBlank(profile.agency_name) &&
    isBlank(profile.email) &&
    isBlank(profile.phone) &&
    isBlank(profile.agency_website) &&
    isBlank(profile.agency_address)
  );
}
