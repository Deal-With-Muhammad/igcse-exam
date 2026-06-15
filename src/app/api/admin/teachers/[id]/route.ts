import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;

  const body = await req.json();
  const admin = createAdminClient();

  // Update auth credentials (email / password) first — if this fails we
  // haven't touched the profile yet.
  const authUpdate: { email?: string; password?: string; email_confirm?: boolean } = {};
  const newEmail = typeof body.email === "string" ? body.email.trim() : "";
  if (newEmail) { authUpdate.email = newEmail; authUpdate.email_confirm = true; }
  if (typeof body.password === "string" && body.password) authUpdate.password = body.password;
  if (Object.keys(authUpdate).length > 0) {
    const { error } = await admin.auth.admin.updateUserById(id, authUpdate);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update profile fields if provided.
  const update: Record<string, unknown> = {};
  if (typeof body.full_name === "string" && body.full_name.trim()) update.full_name = body.full_name.trim();
  if (newEmail) update.email = newEmail; // keep the profile row in sync with auth
  let finalRole: "admin" | "teacher" | undefined;
  if (body.role === "admin" || body.role === "teacher") {
    finalRole = body.role;
    update.role = finalRole;
  }
  if (Object.keys(update).length > 0) {
    const { error } = await admin.from("profiles").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Replace class assignments if provided. Admins keep no rows (they see all).
  if (Array.isArray(body.class_ids)) {
    const { data: current } = await admin.from("profiles").select("role").eq("id", id).single();
    const role = finalRole ?? current?.role;
    const classIds: string[] = role === "admin"
      ? []
      : body.class_ids.filter((c: unknown): c is string => typeof c === "string" && !!c);

    const { error: delErr } = await admin.from("teacher_classes").delete().eq("teacher_id", id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
    if (classIds.length > 0) {
      const { error: insErr } = await admin
        .from("teacher_classes")
        .insert(classIds.map((class_id) => ({ teacher_id: id, class_id })));
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
    }
  }

  const { data: profile } = await admin.from("profiles").select("*").eq("id", id).single();
  const { data: tc } = await admin.from("teacher_classes").select("class_id").eq("teacher_id", id);
  return NextResponse.json({ profile, class_ids: (tc ?? []).map((r) => r.class_id) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.id === id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
