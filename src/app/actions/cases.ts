"use server";

import { createClient } from "@/lib/supabase/server";
import type { Case } from "@/types";
import { vorsorgeConfigSchema, type VorsorgeConfigFormData } from "@/lib/validations/vorsorge";
import { caseWizardSchema, type CaseWizardFormData } from "@/lib/validations/case";

function generateFamilyPin(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export type CreateVorsorgeResult = { success: true; familyPin: string } | { success: false; error: string };

export async function createVorsorgeCaseAction(
  data: VorsorgeConfigFormData,
  estimatedPrice: number
): Promise<CreateVorsorgeResult> {
  const parsed = vorsorgeConfigSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Validierungsfehler" };
  }

  const familyPin = generateFamilyPin();
  const supabase = await createClient();

  const { error } = await supabase.from("cases").insert({
    name: `VORSORGE: ${parsed.data.contact.lastName}, ${parsed.data.contact.firstName}`,
    status: "Neu",
    family_pin: familyPin,
    wishes: {
      burialType: parsed.data.burialType,
      coffinUrn: parsed.data.coffinUrn,
      ceremony: parsed.data.ceremony,
      specialWishes: `Kostenschätzung: ${estimatedPrice.toLocaleString("de-DE")} €`,
    },
    contact: parsed.data.contact,
    checklists: [],
  });

  if (error) {
    console.error("Error inserting vorsorge case:", error);
    return { success: false, error: error.message };
  }

  return { success: true, familyPin };
}

export type CreateCaseResult = { success: true; familyPin: string } | { success: false; error: string };

export async function createCaseAction(data: CaseWizardFormData): Promise<CreateCaseResult> {
  const parsed = caseWizardSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Validierungsfehler" };
  }

  const familyPin = generateFamilyPin();
  const supabase = await createClient();

  const { error } = await supabase.from("cases").insert({
    name: `${parsed.data.deceased?.lastName ?? "Unbekannt"}, ${parsed.data.deceased?.firstName ?? "Unbekannt"}`,
    status: "Neu",
    family_pin: familyPin,
    wishes: parsed.data.wishes,
    deceased: parsed.data.deceased,
    contact: parsed.data.contact,
    checklists: parsed.data.checklists ?? [],
  });

  if (error) {
    console.error("Error inserting case:", error);
    return { success: false, error: error.message };
  }

  return { success: true, familyPin };
}

export async function getCaseById(id: string): Promise<Case | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("id, name, status, created_at, family_pin, wishes, deceased, contact, checklists")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    status: data.status,
    createdAt: data.created_at,
    familyPin: data.family_pin,
    wishes: data.wishes ?? {},
    deceased: data.deceased ?? {},
    contact: data.contact ?? {},
    checklists: data.checklists ?? [],
    notes: [],
    memories: [],
  };
}
