"use server";

import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/types";

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapTaskRow);
}

function mapTaskRow(t: {
  id: string;
  title: string;
  assignee?: string | null;
  assignee_id?: string | null;
  due_date?: string | null;
  completed?: boolean;
  created_at: string;
  case_id?: string | null;
  reminder_at?: string | null;
}): Task {
  return {
    id: t.id,
    title: t.title,
    assignee: t.assignee ?? "Alle",
    assigneeId: t.assignee_id ?? null,
    dueDate: t.due_date ?? null,
    completed: t.completed ?? false,
    createdAt: t.created_at,
    caseId: t.case_id ?? null,
    reminderAt: t.reminder_at ?? null,
  };
}

export async function getTasksByCaseId(caseId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapTaskRow);
}
