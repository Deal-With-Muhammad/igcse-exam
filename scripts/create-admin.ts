/**
 * Bootstrap the first admin (or add another).
 * Usage:
 *   npm run create-admin -- --email admin@els.edu --password "StrongPass123" --name "Admin"
 *   or, interactively: npm run create-admin
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

function arg(key: string): string | undefined {
  const idx = process.argv.indexOf(`--${key}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function ask(rl: readline.Interface, prompt: string, def?: string): Promise<string> {
  const ans = (await rl.question(`${prompt}${def ? ` [${def}]` : ""}: `)).trim();
  return ans || def || "";
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const email = arg("email") || (await ask(rl, "Admin email"));
  const password = arg("password") || (await ask(rl, "Initial password"));
  const name = arg("name") || (await ask(rl, "Full name", "Administrator"));
  const role = (arg("role") || "admin") as "admin" | "teacher";
  rl.close();

  if (!email || !password) {
    console.error("Email and password are required.");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error || !created.user) {
    console.error("Failed to create auth user:", error?.message);
    process.exit(1);
  }

  const { error: pErr } = await admin
    .from("profiles")
    .insert({ id: created.user.id, email, full_name: name, role });
  if (pErr) {
    console.error("Failed to create profile, rolling back auth user...", pErr.message);
    await admin.auth.admin.deleteUser(created.user.id);
    process.exit(1);
  }

  console.log("✓ Created:");
  console.log("  Email:", email);
  console.log("  Role:", role);
  console.log("  ID:", created.user.id);
  console.log("\nYou can now sign in at /sign-in");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
