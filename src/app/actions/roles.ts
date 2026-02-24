"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "./employees";

export type Role = {
  id: string;
  displayName: string;
};

export async function listRoles(): Promise<Role[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, display_name")
    .order("id");

  if (error) {
    console.error("listRoles error:", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    displayName: r.display_name,
  }));
}

export async function getEmployeeRoles(employeeId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_roles")
    .select("role_id")
    .eq("employee_id", employeeId);

  if (error) {
    console.error("getEmployeeRoles error:", error);
    return [];
  }

  return (data ?? []).map((r) => r.role_id);
}

export async function setEmployeeRoles(
  employeeId: string,
  roleIds: string[]
): Promise<{ error?: string }> {
  const current = await getCurrentEmployee();
  if (!current) return { error: "Nicht eingeloggt." };

  const currentRoles = await getEmployeeRoles(current.id);
  const isAdmin = currentRoles.includes("admin");
  if (!isAdmin) return { error: "Nur Administratoren können Rollen zuweisen." };

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("employee_roles")
    .delete()
    .eq("employee_id", employeeId);

  if (deleteError) return { error: deleteError.message };

  if (roleIds.length === 0) return {};

  const rows = roleIds.map((role_id) => ({ employee_id: employeeId, role_id }));
  const { error: insertError } = await supabase
    .from("employee_roles")
    .insert(rows);

  if (insertError) return { error: insertError.message };
  return {};
}

export async function hasRole(employeeId: string, roleId: string): Promise<boolean> {
  const roles = await getEmployeeRoles(employeeId);
  return roles.includes(roleId);
}
