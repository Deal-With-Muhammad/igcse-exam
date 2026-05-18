import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { email, password, full_name, role, class_id } = body;
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error || !created.user) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 400 });
  }

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .insert({
      id: created.user.id,
      email,
      full_name,
      role: role === "admin" ? "admin" : "teacher",
      class_id: class_id || null,
    })
    .select("*")
    .single();
  if (pErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: pErr.message }, { status: 400 });
  }

  return NextResponse.json({ profile });
}
