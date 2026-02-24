"use server";

import { createClient } from "@/lib/supabase/server";

export type MailAccount = {
  id: string;
  employeeId: string;
  email: string;
  provider: "gmail" | "outlook" | "custom";
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getMailAccounts(
  employeeId: string
): Promise<MailAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_mail_accounts")
    .select("*")
    .eq("employee_id", employeeId)
    .order("is_primary", { ascending: false });

  if (error) {
    console.error("getMailAccounts error:", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    employeeId: r.employee_id,
    email: r.email,
    provider: r.provider as "gmail" | "outlook" | "custom",
    isPrimary: r.is_primary ?? false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function addMailAccount(
  employeeId: string,
  email: string,
  provider: "gmail" | "outlook" | "custom" = "custom",
  isPrimary = false
): Promise<{ error?: string }> {
  const supabase = await createClient();

  if (isPrimary) {
    await supabase
      .from("employee_mail_accounts")
      .update({ is_primary: false })
      .eq("employee_id", employeeId);
  }

  const { error } = await supabase.from("employee_mail_accounts").insert({
    employee_id: employeeId,
    email: email.trim().toLowerCase(),
    provider,
    is_primary: isPrimary,
  });

  if (error) return { error: error.message };
  return {};
}

export async function removeMailAccount(
  accountId: string,
  employeeId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_mail_accounts")
    .delete()
    .eq("id", accountId)
    .eq("employee_id", employeeId);

  if (error) return { error: error.message };
  return {};
}

export async function setPrimaryMailAccount(
  accountId: string,
  employeeId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  await supabase
    .from("employee_mail_accounts")
    .update({ is_primary: false, updated_at: new Date().toISOString() })
    .eq("employee_id", employeeId);

  const { error } = await supabase
    .from("employee_mail_accounts")
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq("id", accountId)
    .eq("employee_id", employeeId);

  if (error) return { error: error.message };
  return {};
}
