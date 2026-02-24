import { z } from 'zod';

export const beratungConfigSchema = z.object({
  contact: z.object({
    firstName: z.string().min(1, 'Vorname ist erforderlich'),
    lastName: z.string().min(1, 'Nachname ist erforderlich'),
    email: z.string().min(1, 'E-Mail ist erforderlich').email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
    phone: z.string().optional(),
  }),
  message: z.string().min(1, 'Bitte beschreiben Sie Ihr Anliegen').max(2000, 'Maximal 2000 Zeichen'),
});

export type BeratungConfigFormData = z.infer<typeof beratungConfigSchema>;
