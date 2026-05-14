import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/exam-runner/exam-runner";
import type { Exam } from "@/types";

export default async function ExamRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("exams").select("*").eq("id", id).single();
  if (!data) notFound();
  return <ExamRunner exam={data as Exam} />;
}
