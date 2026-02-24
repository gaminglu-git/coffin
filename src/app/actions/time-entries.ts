"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "./employees";

export type TimeEntryEvent = {
  id: string;
  employeeId: string;
  eventType: "clock_in" | "clock_out";
  recordedAt: string;
  source: "manual" | "auth_login" | "auth_logout";
  notes?: string | null;
};

export type WorkSession = {
  clockIn: TimeEntryEvent;
  clockOut: TimeEntryEvent | null;
  employeeId: string;
};

export async function clockIn(
  employeeId: string,
  notes?: string
): Promise<{ error?: string }> {
  const current = await getCurrentEmployee();
  if (!current) return { error: "Nicht eingeloggt." };
  if (current.id !== employeeId) return { error: "Sie können nur für sich selbst stempeln." };

  const supabase = await createClient();
  const { error } = await supabase.from("employee_time_entries").insert({
    employee_id: employeeId,
    event_type: "clock_in",
    source: "manual",
    notes: notes || null,
  });

  if (error) return { error: error.message };
  return {};
}

export async function clockOut(
  employeeId: string,
  notes?: string
): Promise<{ error?: string }> {
  const current = await getCurrentEmployee();
  if (!current) return { error: "Nicht eingeloggt." };
  if (current.id !== employeeId) return { error: "Sie können nur für sich selbst stempeln." };

  const supabase = await createClient();
  const { error } = await supabase.from("employee_time_entries").insert({
    employee_id: employeeId,
    event_type: "clock_out",
    source: "manual",
    notes: notes || null,
  });

  if (error) return { error: error.message };
  return {};
}

export async function getCurrentSession(
  employeeId: string
): Promise<TimeEntryEvent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_time_entries")
    .select("id, employee_id, event_type, recorded_at, source, notes")
    .eq("employee_id", employeeId)
    .eq("event_type", "clock_in")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  const { data: lastOut } = await supabase
    .from("employee_time_entries")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("event_type", "clock_out")
    .gt("recorded_at", data.recorded_at)
    .limit(1)
    .single();

  if (lastOut) return null;

  return {
    id: data.id,
    employeeId: data.employee_id,
    eventType: data.event_type,
    recordedAt: data.recorded_at,
    source: data.source,
    notes: data.notes,
  };
}

export async function getTimeEntries(
  employeeId?: string | null,
  from?: Date,
  to?: Date
): Promise<TimeEntryEvent[]> {
  const supabase = await createClient();
  let q = supabase
    .from("employee_time_entries")
    .select("id, employee_id, event_type, recorded_at, source, notes")
    .order("recorded_at", { ascending: true });

  if (employeeId) q = q.eq("employee_id", employeeId);
  if (from) q = q.gte("recorded_at", from.toISOString());
  if (to) q = q.lte("recorded_at", to.toISOString());

  const { data, error } = await q;

  if (error) {
    console.error("getTimeEntries error:", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    employeeId: r.employee_id,
    eventType: r.event_type as "clock_in" | "clock_out",
    recordedAt: r.recorded_at,
    source: r.source as "manual" | "auth_login" | "auth_logout",
    notes: r.notes,
  }));
}

/** Berechnet die Gesamtstunden aus gepaarten clock_in/clock_out-Einträgen. Nutzt DB-RPC für Performance. */
export async function getTotalHoursForEmployee(
  employeeId: string,
  from?: Date,
  to?: Date
): Promise<number> {
  const supabase = await createClient();
  const fromTs = from?.toISOString() ?? new Date(0).toISOString();
  const toTs = to?.toISOString() ?? new Date().toISOString();

  const { data, error } = await supabase.rpc("get_total_hours_for_employee", {
    p_employee_id: employeeId,
    p_from: fromTs,
    p_to: toTs,
  });

  if (error) {
    console.error("getTotalHoursForEmployee RPC error:", error);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}
