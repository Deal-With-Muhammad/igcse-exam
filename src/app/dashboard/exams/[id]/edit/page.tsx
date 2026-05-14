import { ExamEditor } from "@/components/exam-editor/exam-editor";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Exam, Template } from "@/types";

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: exam }, { data: templates }] = await Promise.all([
    supabase.from("exams").select("*").eq("id", id).single(),
    supabase.from("templates").select("*").order("is_default", { ascending: false }),
  ]);
  if (!exam) notFound();
  return <ExamEditor mode="edit" initialExam={exam as Exam} templates={(templates ?? []) as Template[]} />;
}
