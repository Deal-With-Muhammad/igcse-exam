import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, UserRole } from "@/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) console.error("[auth] getUser error:", userErr.message);
  if (!user) {
    console.log("[auth] no user from cookies");
    return null;
  }
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (pErr) {
    console.error("[auth] profile query error:", pErr.code, pErr.message, "for user", user.id);
    return null;
  }
  if (!profile) {
    console.warn("[auth] no profile row found for user", user.id, "— creating one");
    // Self-heal: if the auth user exists but the profile row doesn't, create
    // a teacher profile. (Admins are created via the bootstrap script which
    // already inserts a row, so this only catches stragglers from old data.)
    const { data: created, error: insertErr } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name as string) || "",
        role: "teacher",
      })
      .select("*")
      .single();
    if (insertErr) {
      console.error("[auth] profile self-create failed:", insertErr.message);
      return null;
    }
    return created as Profile;
  }
  return profile as Profile;
}

export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!roles.includes(profile.role)) redirect("/dashboard");
  return profile;
}

export async function requireSignedIn(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  return profile;
}
