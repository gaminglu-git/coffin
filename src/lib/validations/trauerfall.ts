import { z } from 'zod';

const URGENCY_OPTIONS = ['Sofort', 'Heute', 'Diese Woche', 'Unklar'] as const;

export const trauerfallConfigSchema = z.object({
  urgency: z.enum(URGENCY_OPTIONS),
  deceased: z.object({
    firstName: z.string().min(1, 'Vorname ist erforderlich'),
    lastName: z.string().min(1, 'Nachname ist erforderlich'),
    deathPlace: z.string().optional(),
    deathDate: z.string().optional(),
  }),
  contact: z.object({
    firstName: z.string().min(1, 'Vorname ist erforderlich'),
    lastName: z.string().min(1, 'Nachname ist erforderlich'),
    phone: z.string().min(1, 'Telefon ist erforderlich'),
    email: z.string().min(1, 'E-Mail ist erforderlich').email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  }),
});

export type TrauerfallConfigFormData = z.infer<typeof trauerfallConfigSchema>;
