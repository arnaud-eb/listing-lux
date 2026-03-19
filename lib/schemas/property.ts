import { z } from "zod";

/** Shared property fields — base for both form and DB schemas */
const propertyBase = {
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  sqm: z.number().positive(),
  price: z.number().positive(),
  neighborhood: z.string().min(1),
  property_type: z.string().min(1),
  features: z.record(z.string(), z.boolean()),
  photo_urls: z.array(z.url()).min(5),
};

/** Form submission — base + optional photo analyses */
export const propertyFormSchema = z.object({
  ...propertyBase,
  photo_analyses: z.array(z.any()).optional(),
});

/** DB row — base + server-managed fields */
export const propertySchema = z.object({
  ...propertyBase,
  id: z.uuid(),
  created_at: z.string(),
});

export type PropertyFormInput = z.infer<typeof propertyFormSchema>;
export type ValidatedProperty = z.infer<typeof propertySchema>;
