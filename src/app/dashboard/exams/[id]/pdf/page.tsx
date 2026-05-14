import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PdfExportClient } from "@/components/pdf/pdf-export-client";
import type { Exam, Template } from "@/types";

export default async function PdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: exam } = await supabase.from("exams").select("*").eq("id", id).single();
  if (!exam) notFound();
  const e = exam as Exam;
  const { data: template } = e.template_id
    ? await supabase.from("templates").select("*").eq("id", e.template_id).single()
    : await supabase.from("templates").select("*").eq("is_default", true).single();
  return <PdfExportClient exam={e} template={template as Template | null} />;
}
