import { ExamDetail } from "@/components/dashboard/exam-detail";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Exam, Submission } from "@/types";

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: exam }, { data: subs }] = await Promise.all([
    supabase.from("exams").select("*").eq("id", id).single(),
    supabase.from("submissions").select("*").eq("exam_id", id).order("submitted_at", { ascending: false }),
  ]);
  if (!exam) notFound();
  return <ExamDetail exam={exam as Exam} submissions={(subs ?? []) as Submission[]} />;
}
