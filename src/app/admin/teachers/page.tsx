import { createClient } from "@/lib/supabase/server";
import { TeachersClient } from "@/components/admin/teachers-client";

export default async function AdminTeachersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return <TeachersClient profiles={data ?? []} />;
}
