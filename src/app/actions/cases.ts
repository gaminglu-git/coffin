"use server";

import { createClient } from "@/lib/supabase/server";
import type { Case } from "@/types";
import { getPlaceholderValuesFromFormData, replacePlaceholdersInChecklists } from "@/lib/template-placeholders";
import { vorsorgeConfigSchema, type VorsorgeConfigFormData } from "@/lib/validations/vorsorge";
import { caseWizardSchema, caseUpdateSchema, type CaseWizardFormData, type CaseUpdateFormData } from "@/lib/validations/case";
import { trauerfallConfigSchema, type TrauerfallConfigFormData } from "@/lib/validations/trauerfall";
import { beratungConfigSchema, type BeratungConfigFormData } from "@/lib/validations/beratung";

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
    name: `${parsed.data.contact.lastName}, ${parsed.data.contact.firstName}`,
    status: "Neu",
    family_pin: familyPin,
    case_type: "vorsorge",
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
  const caseName = `${parsed.data.deceased?.lastName ?? "Unbekannt"}, ${parsed.data.deceased?.firstName ?? "Unbekannt"}`;
  const placeholderValues = getPlaceholderValuesFromFormData({
    deceased: parsed.data.deceased,
    contact: parsed.data.contact,
    name: caseName,
  });
  const checklists = replacePlaceholdersInChecklists(parsed.data.checklists ?? [], placeholderValues);

  const { error } = await supabase.from("cases").insert({
    name: caseName,
    status: "Neu",
    family_pin: familyPin,
    case_type: "trauerfall",
    wishes: parsed.data.wishes,
    deceased: parsed.data.deceased,
    contact: parsed.data.contact,
    checklists,
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
    .select("id, name, status, created_at, family_pin, wishes, deceased, contact, checklists, case_type")
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
    caseType: data.case_type ?? undefined,
  };
}

export type CreateTrauerfallResult = { success: true; familyPin: string } | { success: false; error: string };

export async function createTrauerfallCaseAction(data: TrauerfallConfigFormData): Promise<CreateTrauerfallResult> {
  const parsed = trauerfallConfigSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Validierungsfehler" };
  }

  const familyPin = generateFamilyPin();
  const supabase = await createClient();
  const caseName = `${parsed.data.deceased.lastName}, ${parsed.data.deceased.firstName}`;

  const { error } = await supabase.from("cases").insert({
    name: caseName,
    status: "Neu",
    family_pin: familyPin,
    case_type: "trauerfall",
    wishes: {
      burialType: "Noch unklar",
      specialWishes: `Dringlichkeit: ${parsed.data.urgency}. Sterbeort: ${parsed.data.deceased.deathPlace ?? "—"}. Sterbedatum: ${parsed.data.deceased.deathDate ?? "—"}`,
    },
    deceased: parsed.data.deceased,
    contact: parsed.data.contact,
    checklists: [],
  });

  if (error) {
    console.error("Error inserting trauerfall case:", error);
    return { success: false, error: error.message };
  }

  return { success: true, familyPin };
}

export type CreateBeratungResult = { success: true; familyPin: string } | { success: false; error: string };

export async function createBeratungCaseAction(data: BeratungConfigFormData): Promise<CreateBeratungResult> {
  const parsed = beratungConfigSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Validierungsfehler" };
  }

  const familyPin = generateFamilyPin();
  const supabase = await createClient();
  const caseName = `${parsed.data.contact.lastName}, ${parsed.data.contact.firstName}`;

  const { error } = await supabase.from("cases").insert({
    name: caseName,
    status: "Neu",
    family_pin: familyPin,
    case_type: "beratung",
    wishes: {
      burialType: "Noch unklar",
      specialWishes: parsed.data.message,
    },
    contact: parsed.data.contact,
    deceased: {},
    checklists: [],
  });

  if (error) {
    console.error("Error inserting beratung case:", error);
    return { success: false, error: error.message };
  }

  return { success: true, familyPin };
}

export type UpdateCaseResult = { success: true } | { success: false; error: string };

export async function updateCaseAction(caseId: string, data: CaseUpdateFormData): Promise<UpdateCaseResult> {
  const parsed = caseUpdateSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Validierungsfehler" };
  }
  const supabase = await createClient();
  const { data: existing } = await supabase.from("cases").select("wishes, deceased, contact").eq("id", caseId).single();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.status != null) payload.status = parsed.data.status;
  if (parsed.data.caseType != null) payload.case_type = parsed.data.caseType;
  if (parsed.data.name != null) payload.name = parsed.data.name;
  if (parsed.data.wishes != null) {
    payload.wishes = existing?.wishes ? { ...existing.wishes, ...parsed.data.wishes } : parsed.data.wishes;
  }
  if (parsed.data.deceased != null) {
    payload.deceased = existing?.deceased ? { ...existing.deceased, ...parsed.data.deceased } : parsed.data.deceased;
  }
  if (parsed.data.contact != null) {
    payload.contact = existing?.contact ? { ...existing.contact, ...parsed.data.contact } : parsed.data.contact;
  }

  const { error } = await supabase.from("cases").update(payload).eq("id", caseId);
  if (error) {
    console.error("updateCaseAction error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type UpdateChecklistsResult = { success: true } | { success: false; error: string };

export async function updateCaseChecklists(
  caseId: string,
  checklists: { title: string; items: { text: string; completed: boolean }[] }[]
): Promise<UpdateChecklistsResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("cases")
      .update({ checklists, updated_at: new Date().toISOString() })
      .eq("id", caseId);

    if (error) {
      console.error("updateCaseChecklists error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("updateCaseChecklists error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}
