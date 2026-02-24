"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString()?.toLowerCase()?.trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (!email || !password) {
      return { error: "Bitte E-Mail und Passwort eingeben." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = (error as { message?: string })?.message;
      const code = (error as { code?: string })?.code;
      const errStr = typeof error === "object" ? JSON.stringify(error) : String(error);
      console.error("[Auth] Supabase error:", { msg, code, raw: errStr });
      const displayMsg =
        msg || (code ? `Fehler: ${code}` : null) || errStr || "Falsche E-Mail oder Passwort.";
      return { error: displayMsg };
    }

    redirect("/admin/dashboard");
  } catch (e) {
    unstable_rethrow(e);
    const err = e as Error;
    console.error("[Auth] Unexpected error:", err);
    return {
      error: err?.message || (err ? String(err) : "Unbekannter Fehler beim Login."),
    };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin");
}
