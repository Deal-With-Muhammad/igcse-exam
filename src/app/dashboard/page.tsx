import { requireSignedIn } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const profile = await requireSignedIn();
  const supabase = await createClient();

  const examQuery = supabase
    .from("exams")
    .select("id, share_code, title, subject, level, curriculum, total_marks, created_at, created_by, questions")
    .order("created_at", { ascending: false });
  const subQuery = supabase
    .from("submissions")
    .select("id, exam_id, exam_title, student_name, student_class, branch_name, submitted_at, graded, total_score, max_score");

  const [{ data: exams }, { data: submissions }] = await Promise.all([examQuery, subQuery]);

  return (
    <DashboardClient
      profile={profile}
      exams={exams ?? []}
      submissions={submissions ?? []}
    />
  );
}
