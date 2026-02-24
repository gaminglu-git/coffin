import { z } from "zod";

export const eventRegistrationSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z
    .string()
    .min(1, "E-Mail ist erforderlich")
    .email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  phone: z.string().optional(),
  notes: z.string().max(500, "Maximal 500 Zeichen").optional(),
});

export type EventRegistrationFormData = z.infer<typeof eventRegistrationSchema>;
