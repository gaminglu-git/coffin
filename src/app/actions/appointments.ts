"use server";

import { createClient } from "@/lib/supabase/server";
import type { Appointment } from "@/types";

export async function getAppointments(): Promise<Appointment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapAppointmentRow);
}

function mapAppointmentRow(a: {
  id: string;
  title: string;
  appointment_date: string;
  created_at: string;
  case_id?: string | null;
  assignee_id?: string | null;
  assignee?: string | null;
  end_at?: string | null;
  reminder_at?: string | null;
}): Appointment {
  return {
    id: a.id,
    title: a.title,
    date: a.appointment_date,
    createdAt: a.created_at,
    caseId: a.case_id ?? null,
    assigneeId: a.assignee_id ?? null,
    assignee: a.assignee ?? "Alle",
    endAt: a.end_at ?? null,
    reminderAt: a.reminder_at ?? null,
  };
}

export async function getAppointmentsByCaseId(caseId: string): Promise<Appointment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("case_id", caseId)
    .order("appointment_date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapAppointmentRow);
}
