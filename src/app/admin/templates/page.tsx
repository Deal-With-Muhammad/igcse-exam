import { createClient } from "@/lib/supabase/server";
import { TemplatesClient } from "@/components/admin/templates-client";
import type { Template } from "@/types";

export default async function AdminTemplatesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select("*").order("created_at", { ascending: false });
  return <TemplatesClient templates={(data ?? []) as Template[]} />;
}
