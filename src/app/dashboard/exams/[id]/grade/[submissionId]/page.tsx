import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { GradeClient } from "@/components/exam-grader/grade-client";
import type { Exam, Submission } from "@/types";

export default async function GradePage({ params }: { params: Promise<{ id: string; submissionId: string }> }) {
  const { id, submissionId } = await params;
  const supabase = await createClient();
  const [{ data: exam }, { data: submission }] = await Promise.all([
    supabase.from("exams").select("*").eq("id", id).single(),
    supabase.from("submissions").select("*").eq("id", submissionId).single(),
  ]);
  if (!exam || !submission) notFound();
  return <GradeClient exam={exam as Exam} submission={submission as Submission} />;
}
