"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/app/actions/employees";
import type {
  Communication,
  CommunicationType,
  CommunicationDirection,
} from "@/types";

export type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export async function listCommunications(params?: {
  caseId?: string;
  correspondenceId?: string;
}): Promise<Communication[]> {
  const supabase = await createClient();
  let query = supabase
    .from("communications")
    .select(
      "id, correspondence_id, case_id, employee_id, task_id, appointment_id, type, direction, subject, content, storage_path, created_at"
    )
    .order("created_at", { ascending: false });

  if (params?.caseId) {
    query = query.eq("case_id", params.caseId);
  }
  if (params?.correspondenceId) {
    query = query.eq("correspondence_id", params.correspondenceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listCommunications error:", error);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    correspondenceId: (r.correspondence_id as string | null) ?? null,
    caseId: r.case_id as string,
    employeeId: (r.employee_id as string | null) ?? null,
    taskId: (r.task_id as string | null) ?? null,
    appointmentId: (r.appointment_id as string | null) ?? null,
    type: r.type as CommunicationType,
    direction: r.direction as CommunicationDirection,
    subject: (r.subject as string | null) ?? null,
    content: (r.content as string | null) ?? null,
    storagePath: (r.storage_path as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function createCommunication(data: {
  correspondenceId?: string | null;
  caseId: string;
  employeeId?: string | null;
  taskId?: string | null;
  appointmentId?: string | null;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject?: string | null;
  content?: string | null;
  storagePath?: string | null;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const employeeId = data.employeeId ?? (await getCurrentEmployee())?.id ?? null;
    const { data: inserted, error } = await supabase
      .from("communications")
      .insert({
        correspondence_id: data.correspondenceId ?? null,
        case_id: data.caseId,
        employee_id: employeeId,
        task_id: data.taskId ?? null,
        appointment_id: data.appointmentId ?? null,
        type: data.type,
        direction: data.direction,
        subject: data.subject ?? null,
        content: data.content ?? null,
        storage_path: data.storagePath ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("createCommunication error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, id: inserted?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function updateCommunication(
  id: string,
  data: Partial<{
    correspondenceId: string | null;
    employeeId: string | null;
    taskId: string | null;
    appointmentId: string | null;
    type: CommunicationType;
    direction: CommunicationDirection;
    subject: string | null;
    content: string | null;
    storagePath: string | null;
  }>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const updates: Record<string, unknown> = {};
    if (data.correspondenceId !== undefined) updates.correspondence_id = data.correspondenceId;
    if (data.employeeId !== undefined) updates.employee_id = data.employeeId;
    if (data.taskId !== undefined) updates.task_id = data.taskId;
    if (data.appointmentId !== undefined) updates.appointment_id = data.appointmentId;
    if (data.type !== undefined) updates.type = data.type;
    if (data.direction !== undefined) updates.direction = data.direction;
    if (data.subject !== undefined) updates.subject = data.subject;
    if (data.content !== undefined) updates.content = data.content;
    if (data.storagePath !== undefined) updates.storage_path = data.storagePath;

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    const { error } = await supabase
      .from("communications")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("updateCommunication error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function deleteCommunication(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: comm } = await supabase
      .from("communications")
      .select("storage_path")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("communications").delete().eq("id", id);

    if (error) {
      console.error("deleteCommunication error:", error);
      return { success: false, error: error.message };
    }

    if (comm?.storage_path) {
      const admin = createAdminClient();
      await admin.storage.from("correspondence-docs").remove([comm.storage_path]);
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function uploadCommunicationDocument(
  communicationId: string,
  formData: FormData
): Promise<ActionResult & { storagePath?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "Keine Datei ausgewählt." };
    }

    const admin = createAdminClient();
    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `${communicationId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("correspondence-docs")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      console.error("uploadCommunicationDocument error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("communications")
      .update({ storage_path: storagePath })
      .eq("id", communicationId);

    if (updateError) {
      await admin.storage.from("correspondence-docs").remove([storagePath]);
      return { success: false, error: updateError.message };
    }

    return { success: true, storagePath };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function getCommunicationDocumentSignedUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<{ url: string } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("correspondence-docs")
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      return { error: error?.message ?? "URL konnte nicht erstellt werden." };
    }
    return { url: data.signedUrl };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { error: msg };
  }
}
