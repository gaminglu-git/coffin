import { z } from 'zod';

const BURIAL_TYPES = ['Erdbestattung', 'Feuerbestattung', 'Seebestattung', 'Baumbestattung / Friedwald', 'Noch unklar'] as const;

export const caseWizardSchema = z.object({
  wishes: z.object({
    burialType: z.enum(BURIAL_TYPES),
    specialWishes: z.string().optional(),
  }),
  deceased: z.object({
    firstName: z.string().min(1, 'Vorname ist erforderlich'),
    lastName: z.string().min(1, 'Nachname ist erforderlich'),
    birthDate: z.string().optional(),
    deathDate: z.string().optional(),
    deathPlace: z.string().optional(),
    religion: z.string().optional(),
    maritalStatus: z.string().optional(),
    address: z.string().optional(),
  }),
  contact: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional().refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      { message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' }
    ),
    relation: z.string().optional(),
    address: z.string().optional(),
  }),
  checklists: z.array(z.any()).optional(),
});

export type CaseWizardFormData = z.infer<typeof caseWizardSchema>;
