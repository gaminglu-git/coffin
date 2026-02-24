"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/app/actions/employees";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function upsertIdentityKey(publicKey: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const employee = await getCurrentEmployee();
    if (!employee) {
      return { success: false, error: "Nicht eingeloggt." };
    }

    const { error } = await supabase
      .from("messenger_identity_keys")
      .upsert(
        {
          employee_id: employee.id,
          public_key: publicKey,
        },
        { onConflict: "employee_id" }
      );

    if (error) {
      console.error("upsertIdentityKey error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function getIdentityKeys(
  employeeIds: string[]
): Promise<Record<string, string>> {
  try {
    const supabase = await createClient();
    if (employeeIds.length === 0) return {};

    const { data, error } = await supabase
      .from("messenger_identity_keys")
      .select("employee_id, public_key")
      .in("employee_id", employeeIds);

    if (error) {
      console.error("getIdentityKeys error:", error);
      return {};
    }

    const result: Record<string, string> = {};
    for (const row of data ?? []) {
      result[row.employee_id as string] = row.public_key as string;
    }
    return result;
  } catch {
    return {};
  }
}

export async function hasIdentityKey(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const employee = await getCurrentEmployee();
    if (!employee) return false;

    const { data, error } = await supabase
      .from("messenger_identity_keys")
      .select("employee_id")
      .eq("employee_id", employee.id)
      .maybeSingle();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}
