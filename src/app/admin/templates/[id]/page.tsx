import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/admin/template-editor";
import { notFound } from "next/navigation";
import type { Template } from "@/types";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select("*").eq("id", id).single();
  if (!data) notFound();
  return <TemplateEditor mode="edit" initial={data as Template} />;
}
