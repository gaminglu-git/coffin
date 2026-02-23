"use server";

import { createClient } from "@/lib/supabase/server";
import type { Correspondence, CorrespondenceKind } from "@/types";

export type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export async function listContacts(params?: {
  caseId?: string | null;
  caseOnly?: boolean;
  firmWideOnly?: boolean;
}): Promise<Correspondence[]> {
  const supabase = await createClient();
  let query = supabase
    .from("correspondences")
    .select("id, case_id, kind, display_name, email, phone, address, company_name, notes, created_at, updated_at")
    .order("display_name", { ascending: true });

  if (params?.caseId) {
    query = query.eq("case_id", params.caseId);
  } else if (params?.caseOnly) {
    query = query.not("case_id", "is", null);
  } else if (params?.firmWideOnly) {
    query = query.is("case_id", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listContacts error:", error);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    caseId: (r.case_id as string | null) ?? null,
    kind: r.kind as CorrespondenceKind,
    displayName: r.display_name as string,
    email: (r.email as string | null) ?? null,
    phone: (r.phone as string | null) ?? null,
    address: (r.address as string | null) ?? null,
    companyName: (r.company_name as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

export async function createContact(data: {
  caseId?: string | null;
  kind: CorrespondenceKind;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  companyName?: string | null;
  notes?: string | null;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: inserted, error } = await supabase
      .from("correspondences")
      .insert({
        case_id: data.caseId ?? null,
        kind: data.kind,
        display_name: data.displayName.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        company_name: data.companyName?.trim() || null,
        notes: data.notes?.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("createContact error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, id: inserted?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function updateContact(
  id: string,
  data: Partial<{
    caseId: string | null;
    kind: CorrespondenceKind;
    displayName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    companyName: string | null;
    notes: string | null;
  }>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const updates: Record<string, unknown> = {};
    if (data.caseId !== undefined) updates.case_id = data.caseId;
    if (data.kind !== undefined) updates.kind = data.kind;
    if (data.displayName !== undefined) updates.display_name = data.displayName.trim();
    if (data.email !== undefined) updates.email = data.email?.trim() || null;
    if (data.phone !== undefined) updates.phone = data.phone?.trim() || null;
    if (data.address !== undefined) updates.address = data.address?.trim() || null;
    if (data.companyName !== undefined) updates.company_name = data.companyName?.trim() || null;
    if (data.notes !== undefined) updates.notes = data.notes?.trim() || null;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("correspondences")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("updateContact error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("correspondences").delete().eq("id", id);

    if (error) {
      console.error("deleteContact error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}
