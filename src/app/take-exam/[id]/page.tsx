import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ExamRegistration } from "@/components/exam-runner/exam-registration";
import type { Exam } from "@/types";

export default async function ExamRegPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("exams").select("*").eq("id", id).single();
  if (!data) notFound();
  return <ExamRegistration exam={data as Exam} />;
}
