"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Employee = {
  id: string;
  auth_user_id: string;
  display_name: string;
  email: string;
  created_at: string;
};

export async function listEmployees(): Promise<Employee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, auth_user_id, display_name, email, created_at")
    .order("display_name");

  if (error) {
    console.error("listEmployees error:", error);
    return [];
  }
  return data ?? [];
}

export async function getCurrentEmployee(): Promise<Employee | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("employees")
    .select("id, auth_user_id, display_name, email, created_at")
    .eq("auth_user_id", user.id)
    .single();

  return data;
}

/** Ensures the current user has an employee record. Creates one if missing (for admins/auth users). */
export async function ensureCurrentEmployee(): Promise<Employee | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("employees")
    .select("id, auth_user_id, display_name, email, created_at")
    .eq("auth_user_id", user.id)
    .single();

  if (existing) return existing;

  const admin = createAdminClient();
  const displayName =
    (user.user_metadata?.display_name as string) ?? user.email?.split("@")[0] ?? "Mitarbeiter";
  const email = user.email ?? `${user.id}@temp.local`;

  const { data: insertData, error } = await admin
    .from("employees")
    .insert({
      auth_user_id: user.id,
      display_name: displayName,
      email: email.toLowerCase(),
    })
    .select("id, auth_user_id, display_name, email, created_at")
    .single();

  if (error) {
    console.error("ensureCurrentEmployee failed:", error);
    return null;
  }

  await admin.from("employee_roles").insert({
    employee_id: insertData.id,
    role_id: "mitarbeiter",
  });

  revalidatePath("/admin/dashboard");
  return insertData;
}

export async function createEmployee(
  email: string,
  displayName: string,
  password: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { data: userData, error: createError } =
    await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

  if (createError) {
    return { error: createError.message };
  }

  if (!userData.user) {
    return { error: "Benutzer konnte nicht angelegt werden." };
  }

  const { data: empData, error: insertError } = await admin
    .from("employees")
    .insert({
      auth_user_id: userData.user.id,
      display_name: displayName.trim(),
      email: email.trim().toLowerCase(),
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  if (empData?.id) {
    await admin.from("employee_roles").insert({
      employee_id: empData.id,
      role_id: "mitarbeiter",
    });
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/dashboard/employees");
  return {};
}

export async function inviteEmployee(
  email: string,
  displayName: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
      data: { display_name: displayName.trim() },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin`,
    });

  if (inviteError) {
    return { error: inviteError.message };
  }

  if (!inviteData.user) {
    return { error: "Einladung konnte nicht gesendet werden." };
  }

  const { data: empData, error: insertError } = await admin
    .from("employees")
    .insert({
      auth_user_id: inviteData.user.id,
      display_name: displayName.trim(),
      email: email.trim().toLowerCase(),
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  if (empData?.id) {
    await admin.from("employee_roles").insert({
      employee_id: empData.id,
      role_id: "mitarbeiter",
    });
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/dashboard/employees");
  return {};
}
