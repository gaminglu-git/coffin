/**
 * Seed script to create the first admin/employee account.
 * Run once after applying migrations: npm run seed:admin
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from .env.local)
 * Optional: SEED_ADMIN_EMAIL, SEED_ADMIN_NAME, SEED_ADMIN_PASSWORD (defaults below)
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_ADMIN_EMAIL || "walter@minten-walter.de";
const displayName = process.env.SEED_ADMIN_NAME || "Walter";
const password = process.env.SEED_ADMIN_PASSWORD || "2026!";

async function seed() {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing } = await admin
    .from("employees")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existing) {
    console.log("Admin account already exists:", email);
    return;
  }

  const { data: userData, error: createError } =
    await admin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

  if (createError) {
    console.error("Failed to create user:", createError.message);
    process.exit(1);
  }

  if (!userData.user) {
    console.error("User created but no user data returned");
    process.exit(1);
  }

  const { error: insertError } = await admin.from("employees").insert({
    auth_user_id: userData.user.id,
    display_name: displayName,
    email: email.toLowerCase(),
  });

  if (insertError) {
    console.error("Failed to insert employee:", insertError.message);
    process.exit(1);
  }

  console.log("Admin account created:", email);
  console.log("Login at /admin with this email and password.");
}

seed();
