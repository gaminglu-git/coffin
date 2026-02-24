import { z } from "zod";

export const leistungCategorySchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const LEISTUNG_TYPES = [
  "bestattungsart",
  "ausstattung_sarg",
  "ausstattung_urne",
  "rahmen",
  "sonstiges",
] as const;

export const LEISTUNG_PRICE_TYPES = ["fixed", "per_unit", "min_price", "on_request"] as const;

export const leistungSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  priceCents: z.number().int().min(0),
  priceType: z.enum(LEISTUNG_PRICE_TYPES).optional().default("fixed"),
  unitLabel: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  imageStoragePath: z.string().optional().nullable(),
  isPublic: z.boolean(),
  leistungType: z.enum(LEISTUNG_TYPES).optional().default("sonstiges"),
  categoryId: z.string().uuid().optional().nullable(),
  inventoryItemId: z.string().uuid().optional().nullable(),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type LeistungCategoryFormData = z.infer<typeof leistungCategorySchema>;
export type LeistungFormData = z.infer<typeof leistungSchema>;
