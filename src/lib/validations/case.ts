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

export const BURIAL_TYPES_ARR = [...BURIAL_TYPES] as string[];

const CASE_TYPES = ['vorsorge', 'trauerfall', 'beratung', 'sonstiges'] as const;

export const caseUpdateSchema = z.object({
  status: z.enum(['Neu', 'In Planung', 'Behörden & Orga', 'Trauerfeier', 'Abgeschlossen']).optional(),
  caseType: z.enum(CASE_TYPES).optional(),
  name: z.string().min(1).optional(),
  wishes: z.object({
    burialType: z.enum(BURIAL_TYPES).optional(),
    specialWishes: z.string().optional(),
  }).optional(),
  deceased: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    birthDate: z.string().optional(),
    deathDate: z.string().optional(),
    deathPlace: z.string().optional(),
    religion: z.string().optional(),
    maritalStatus: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  contact: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional().refine(
      (v) => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      { message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' }
    ),
    relation: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
});

export type CaseUpdateFormData = z.infer<typeof caseUpdateSchema>;

export const CASE_TYPES_ARR = [...CASE_TYPES] as string[];
