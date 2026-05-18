import { requireSignedIn } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const profile = await requireSignedIn();
  const supabase = await createClient();

  let examQuery = supabase
    .from("exams")
    .select("id, share_code, title, subject, level, curriculum, total_marks, created_at, created_by, class_id, questions")
    .order("created_at", { ascending: false });

  // Teachers with a class assignment only see exams pinned to their class
  // (plus exams they personally created). Admins and unassigned teachers see all.
  if (profile.role === "teacher" && profile.class_id) {
    examQuery = examQuery.or(`class_id.eq.${profile.class_id},created_by.eq.${profile.id}`);
  }

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
