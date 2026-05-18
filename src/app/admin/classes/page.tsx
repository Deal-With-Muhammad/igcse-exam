import { createClient } from "@/lib/supabase/server";
import { ClassesClient } from "@/components/admin/classes-client";
import type { Class } from "@/types";

export default async function AdminClassesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("*")
    .order("sort_order", { ascending: true });
  return <ClassesClient classes={(data ?? []) as Class[]} />;
}
