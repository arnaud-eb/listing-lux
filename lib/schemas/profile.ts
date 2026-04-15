import { z } from "zod";

export const agentProfileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  agency_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Valid email is required"),
  logo_url: z.string().url().optional().nullable(),
  agency_address: z.string().optional(),
  agency_website: z
    .string()
    .url("Must be a valid URL (e.g. https://example.com)")
    .optional()
    .or(z.literal("")),
});

export type AgentProfileInput = z.infer<typeof agentProfileSchema>;
