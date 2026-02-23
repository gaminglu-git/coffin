"use server";

import { createClient } from "@/lib/supabase/server";
import type { LetterTemplate, EmailTemplate } from "@/types";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function listLetterTemplates(): Promise<LetterTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("letter_templates")
    .select("id, name, subject, body, created_at, updated_at")
    .order("name");

  if (error) {
    console.error("listLetterTemplates error:", error);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    subject: (r.subject as string | null) ?? null,
    body: r.body as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_templates")
    .select("id, name, subject, body, created_at, updated_at")
    .order("name");

  if (error) {
    console.error("listEmailTemplates error:", error);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    subject: r.subject as string,
    body: r.body as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

export async function createLetterTemplate(data: {
  name: string;
  subject?: string | null;
  body: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("letter_templates").insert({
      name: data.name,
      subject: data.subject ?? null,
      body: data.body,
    });

    if (error) {
      console.error("createLetterTemplate error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function createEmailTemplate(data: {
  name: string;
  subject: string;
  body: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("email_templates").insert({
      name: data.name,
      subject: data.subject,
      body: data.body,
    });

    if (error) {
      console.error("createEmailTemplate error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function updateLetterTemplate(
  id: string,
  data: Partial<{ name: string; subject: string | null; body: string }>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.subject !== undefined) updates.subject = data.subject;
    if (data.body !== undefined) updates.body = data.body;

    const { error } = await supabase
      .from("letter_templates")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("updateLetterTemplate error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function updateEmailTemplate(
  id: string,
  data: Partial<{ name: string; subject: string; body: string }>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.subject !== undefined) updates.subject = data.subject;
    if (data.body !== undefined) updates.body = data.body;

    const { error } = await supabase
      .from("email_templates")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("updateEmailTemplate error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function deleteLetterTemplate(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("letter_templates").delete().eq("id", id);

    if (error) {
      console.error("deleteLetterTemplate error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function deleteEmailTemplate(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("email_templates").delete().eq("id", id);

    if (error) {
      console.error("deleteEmailTemplate error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}
