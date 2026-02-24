import { z } from "zod";

export const selectedLeistungSchema = z.object({
  leistungId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const vorsorgeConfigSchema = z.object({
  selectedLeistungen: z.array(selectedLeistungSchema),
  contact: z.object({
    firstName: z.string().min(1, "Vorname ist erforderlich"),
    lastName: z.string().min(1, "Nachname ist erforderlich"),
    email: z
      .string()
      .min(1, "E-Mail ist erforderlich")
      .email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  }),
});

export type VorsorgeConfigFormData = z.infer<typeof vorsorgeConfigSchema>;
