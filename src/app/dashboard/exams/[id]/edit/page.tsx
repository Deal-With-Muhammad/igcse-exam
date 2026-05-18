import { ExamEditor } from "@/components/exam-editor/exam-editor";
import { createClient } from "@/lib/supabase/server";
import { requireSignedIn } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Class, Exam, Template } from "@/types";

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireSignedIn();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: exam }, { data: templates }, { data: classes }] = await Promise.all([
    supabase.from("exams").select("*").eq("id", id).single(),
    supabase.from("templates").select("*").order("is_default", { ascending: false }),
    supabase.from("classes").select("*").order("sort_order"),
  ]);
  if (!exam) notFound();
  return (
    <ExamEditor
      mode="edit"
      initialExam={exam as Exam}
      templates={(templates ?? []) as Template[]}
      classes={(classes ?? []) as Class[]}
      me={me}
    />
  );
}
