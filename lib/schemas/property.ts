import { z } from "zod";
import { CPE_CLASSES, LISTING_KINDS } from "@/lib/constants";

/** Shared property fields — base for both form and DB schemas */
const propertyBase = {
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  sqm: z.number().positive().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  neighborhood: z.string().min(1),
  property_type: z.string().min(1),
  features: z.record(z.string(), z.boolean()),
  photo_urls: z.array(z.url()).min(5),
  /** Sale or rental — drives copy register, CTAs, and legal disclosures. The DB migration defaults missing values to 'sale'; the schema itself accepts undefined for backward compatibility with old form submissions. */
  listing_kind: z.enum(LISTING_KINDS).optional(),
  /** Luxembourg energy passport class — legally required disclosure (RGD 30 Nov 2007). */
  cpe_class: z.enum(CPE_CLASSES).optional().nullable(),
  /** Thermal insulation class — paired with cpe_class on Luxembourg portals. */
  thermal_insulation_class: z.enum(CPE_CLASSES).optional().nullable(),
  /** Year of construction. */
  year_built: z.number().int().min(1800).max(2100).optional().nullable(),
  /** Monthly charges (€). Required-ish for rentals, optional for sale. */
  charges_monthly: z.number().nonnegative().optional().nullable(),
  /** Total floors in the building. */
  floors_total: z.number().int().positive().optional().nullable(),
  /** Floor of this unit. 0 = ground floor, negative = basement. */
  floor_of_unit: z.number().int().optional().nullable(),
  /** Move-in date for rentals. ISO YYYY-MM-DD; pass-through to native <input type="date">. */
  availability_date: z.iso.date().optional().nullable(),
};

/** Form submission — base + optional photo analyses + optional address */
export const propertyFormSchema = z.object({
  ...propertyBase,
  photo_analyses: z.array(z.any()).optional(),
  address: z.string().optional().nullable(),
});

/** DB row — base + server-managed fields */
export const propertySchema = z.object({
  ...propertyBase,
  id: z.uuid(),
  address: z.string().optional().nullable(),
  created_at: z.string(),
});

export type PropertyFormInput = z.infer<typeof propertyFormSchema>;
export type ValidatedProperty = z.infer<typeof propertySchema>;
