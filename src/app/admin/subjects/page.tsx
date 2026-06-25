import { createClient } from "@/lib/supabase/server";
import { SubjectsClient } from "@/components/admin/subjects-client";
import type { Subject } from "@/types";

export default async function AdminSubjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .order("sort_order", { ascending: true });
  return <SubjectsClient subjects={(data ?? []) as Subject[]} />;
}
