import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ExamRegistration } from "@/components/exam-runner/exam-registration";
import type { Exam, Template } from "@/types";

export default async function ExamRegPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("exams").select("*").eq("id", id).single();
  if (!data) notFound();
  const exam = data as Exam;
  const { data: template } = exam.template_id
    ? await supabase.from("templates").select("*").eq("id", exam.template_id).single()
    : await supabase.from("templates").select("*").eq("is_default", true).single();
  return <ExamRegistration exam={exam} template={template as Template | null} />;
}
