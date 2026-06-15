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
  const { email, password, full_name, role } = body;
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const finalRole = role === "admin" ? "admin" : "teacher";
  // Admins implicitly see every class, so class assignments only apply to teachers.
  const classIds: string[] = finalRole === "teacher" && Array.isArray(body.class_ids)
    ? body.class_ids.filter((c: unknown): c is string => typeof c === "string" && !!c)
    : [];

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
      role: finalRole,
    })
    .select("*")
    .single();
  if (pErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: pErr.message }, { status: 400 });
  }

  if (classIds.length > 0) {
    const { error: tcErr } = await admin
      .from("teacher_classes")
      .insert(classIds.map((class_id) => ({ teacher_id: created.user!.id, class_id })));
    if (tcErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: tcErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ profile, class_ids: classIds });
}
