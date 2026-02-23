"use server";

import { createClient } from "@/lib/supabase/server";

export type Notification = {
  id: string;
  employeeId: string;
  type: "handover" | "task_assigned" | "communication";
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function listNotifications(limit = 20): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, employee_id, type, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listNotifications error:", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    employeeId: r.employee_id,
    type: r.type as Notification["type"],
    title: r.title,
    body: r.body,
    link: r.link,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    console.error("getUnreadCount error:", error);
    return 0;
  }
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("markNotificationRead error:", error);
    return { error: error.message };
  }
  return {};
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) {
    console.error("markAllNotificationsRead error:", error);
    return { error: error.message };
  }
  return {};
}

export type NotificationPreferences = {
  handover: boolean;
  taskAssigned: boolean;
  communication: boolean;
};

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();
  if (!emp) return null;

  const { data } = await supabase
    .from("notification_preferences")
    .select("handover, task_assigned, communication")
    .eq("employee_id", emp.id)
    .single();

  if (!data) {
    return { handover: true, taskAssigned: true, communication: true };
  }
  return {
    handover: data.handover ?? true,
    taskAssigned: data.task_assigned ?? true,
    communication: data.communication ?? true,
  };
}

export async function updateNotificationPreferences(
  prefs: NotificationPreferences
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();
  if (!emp) return { error: "Nicht eingeloggt" };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        employee_id: emp.id,
        handover: prefs.handover,
        task_assigned: prefs.taskAssigned,
        communication: prefs.communication,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id" }
    );

  if (error) {
    console.error("updateNotificationPreferences error:", error);
    return { error: error.message };
  }
  return {};
}
