"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "./employees";
import { getTotalHoursForEmployee, getCurrentSession } from "./time-entries";

export type DashboardOverviewData = {
  displayName: string | null;
  employeeId: string | null;
  totalHours: number | null;
  isClockedIn: boolean;
  clockedInSince: string | null;
  myTasksCount: number;
  todayAppointments: number;
};

/** Lädt alle Dashboard-Übersichtsdaten parallel auf dem Server. */
export async function getDashboardOverviewData(): Promise<DashboardOverviewData> {
  const emp = await getCurrentEmployee();
  if (!emp) {
    return {
      displayName: null,
      employeeId: null,
      totalHours: null,
      isClockedIn: false,
      clockedInSince: null,
      myTasksCount: 0,
      todayAppointments: 0,
    };
  }

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const supabase = await createClient();

  const [hours, session, taskResult, apptResult] = await Promise.all([
    getTotalHoursForEmployee(emp.id, from, to),
    getCurrentSession(emp.id),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("assignee_id", emp.id)
      .eq("completed", false),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("appointment_date", today.toISOString())
      .lt("appointment_date", tomorrow.toISOString()),
  ]);

  return {
    displayName: emp.display_name,
    employeeId: emp.id,
    totalHours: hours,
    isClockedIn: !!session,
    clockedInSince: session?.recordedAt ?? null,
    myTasksCount: taskResult.count ?? 0,
    todayAppointments: apptResult.count ?? 0,
  };
}
