import { z } from 'zod';

const BURIAL_TYPES = ['Erdbestattung', 'Feuerbestattung', 'Seebestattung', 'Baumbestattung / Friedwald'] as const;
const COFFIN_URNS = ['Standard', 'Natur / Bio', 'Individuell'] as const;
const CEREMONIES = ['Keine Feier', 'Im kleinen Kreis', 'Große Trauerfeier'] as const;

export const vorsorgeConfigSchema = z.object({
  burialType: z.enum(BURIAL_TYPES),
  coffinUrn: z.enum(COFFIN_URNS),
  ceremony: z.enum(CEREMONIES),
  contact: z.object({
    firstName: z.string().min(1, 'Vorname ist erforderlich'),
    lastName: z.string().min(1, 'Nachname ist erforderlich'),
    email: z.string().min(1, 'E-Mail ist erforderlich').email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  }),
});

export type VorsorgeConfigFormData = z.infer<typeof vorsorgeConfigSchema>;
