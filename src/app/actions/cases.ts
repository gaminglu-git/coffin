"use server";

import { createClient } from "@/lib/supabase/server";
import type { Case } from "@/types";
import { sendFormNotification } from "@/lib/notify";
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

  const { data: insertedCase, error } = await supabase
    .from("cases")
    .insert({
      name: `${parsed.data.contact.lastName}, ${parsed.data.contact.firstName}`,
      status: "Neu",
      family_pin: familyPin,
      case_type: "vorsorge",
      wishes: {
        selectedLeistungen: parsed.data.selectedLeistungen,
        specialWishes: `Kostenschätzung: ${estimatedPrice.toLocaleString("de-DE")} €`,
      },
      contact: parsed.data.contact,
      checklists: [],
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error inserting vorsorge case:", error);
    return { success: false, error: error.message };
  }

  if (insertedCase?.id && parsed.data.selectedLeistungen.length > 0) {
    const { insertCaseLeistungen } = await import("@/app/actions/leistungen");
    const insertResult = await insertCaseLeistungen(
      insertedCase.id,
      parsed.data.selectedLeistungen
    );
    if (!insertResult.success) {
      console.error("Error inserting case_leistungen:", insertResult.error);
    }
  }

  const contactName = `${parsed.data.contact.lastName}, ${parsed.data.contact.firstName}`;
  sendFormNotification({
    caseType: "vorsorge",
    contactName,
    contactEmail: parsed.data.contact.email,
    familyPin,
    extra: `Kostenschätzung: ${estimatedPrice.toLocaleString("de-DE")} €`,
  }).catch((err) => console.error("[Notify] vorsorge:", err));

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

export type CaseListItem = { id: string; name: string; contact?: { firstName?: string; lastName?: string } };

export async function getCasesList(): Promise<CaseListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("id, name, contact")
    .order("name");

  if (error) throw new Error(error.message);

  return (data ?? []).map((c: { id: string; name: string; contact?: { firstName?: string; lastName?: string } }) => ({
    id: c.id,
    name: c.name,
    contact: c.contact ?? undefined,
  }));
}

export async function getCases(caseTypeFilter?: string): Promise<Case[]> {
  const supabase = await createClient();
  let query = supabase
    .from("cases")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (caseTypeFilter && caseTypeFilter !== "alle") {
    query = query.eq("case_type", caseTypeFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const emptyDeceased = { firstName: "", lastName: "", birthDate: "", deathDate: "", deathPlace: "", religion: "", maritalStatus: "", address: "" };
  const emptyContact = { firstName: "", lastName: "", phone: "", email: "", relation: "", address: "" };
  const emptyWishes = { burialType: "", specialWishes: "" };

  return (data ?? []).map((c: { id: string; name: string; status: string; created_at: string; family_pin?: string; wishes?: { burialType?: string }; deceased?: unknown; contact?: unknown; checklists?: unknown; position?: number; post_care_generated?: boolean; case_type?: string }) => ({
    id: c.id,
    name: c.name,
    status: c.status as Case["status"],
    createdAt: c.created_at,
    familyPin: c.family_pin ?? "",
    wishes: (c.wishes ? { ...emptyWishes, ...c.wishes } : emptyWishes) as Case["wishes"],
    deceased: (c.deceased ? { ...emptyDeceased, ...(c.deceased as object) } : emptyDeceased) as Case["deceased"],
    contact: (c.contact ? { ...emptyContact, ...(c.contact as object) } : emptyContact) as Case["contact"],
    checklists: (c.checklists as Case["checklists"]) ?? [],
    notes: [],
    memories: [],
    position: c.position ?? 0,
    postCareGenerated: c.post_care_generated,
    caseType: c.case_type as Case["caseType"] | undefined,
  }));
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

export type CaseWithDetails = Case & {
  notes: { id: string; text: string; author: string; createdAt: string }[];
  familyPhotos: { id: string; storagePath: string; url?: string; uploadedByName: string; caption?: string | null; createdAt: string }[];
};

export async function getCaseWithDetails(id: string): Promise<CaseWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*, notes(*), memories(*), family_photos(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const notes = (data.notes ?? []).sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const memories = (data.memories ?? []).sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const familyPhotos = (data.family_photos ?? []).map(
    (p: { id: string; storage_path: string; uploaded_by_name?: string; caption?: string | null; created_at: string }) => ({
      id: p.id,
      storagePath: p.storage_path,
      url: supabase.storage.from("family-files").getPublicUrl(p.storage_path).data.publicUrl,
      uploadedByName: p.uploaded_by_name ?? "",
      caption: p.caption,
      createdAt: p.created_at,
    })
  );

  return {
    id: data.id,
    name: data.name,
    status: data.status,
    createdAt: data.created_at,
    familyPin: data.family_pin ?? "",
    wishes: data.wishes ?? {},
    deceased: data.deceased ?? {},
    contact: data.contact ?? {},
    checklists: data.checklists ?? [],
    notes: notes.map((n: { id: string; text: string; author: string; created_at: string }) => ({
      id: n.id,
      text: n.text,
      author: n.author,
      createdAt: n.created_at,
    })),
    memories: memories.map((m: { id: string; text: string; created_at: string }) => ({
      id: m.id,
      text: m.text,
      createdAt: m.created_at,
    })),
    familyPhotos,
    caseType: data.case_type ?? undefined,
  } as CaseWithDetails;
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

  const contactName = `${parsed.data.contact.lastName}, ${parsed.data.contact.firstName}`;
  sendFormNotification({
    caseType: "trauerfall",
    contactName,
    contactEmail: parsed.data.contact.email,
    familyPin,
    extra: `Dringlichkeit: ${parsed.data.urgency}`,
  }).catch((err) => console.error("[Notify] trauerfall:", err));

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

  const contactName = `${parsed.data.contact.lastName}, ${parsed.data.contact.firstName}`;
  sendFormNotification({
    caseType: "beratung",
    contactName,
    contactEmail: parsed.data.contact.email,
    familyPin,
  }).catch((err) => console.error("[Notify] beratung:", err));

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
