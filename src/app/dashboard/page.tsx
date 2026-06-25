import { requireSignedIn } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const profile = await requireSignedIn();
  const supabase = await createClient();

  let examQuery = supabase
    .from("exams")
    .select("id, share_code, title, subject, level, curriculum, total_marks, created_at, created_by, class_id, is_draft, questions")
    .order("created_at", { ascending: false });

  // Teachers with class assignments only see exams pinned to any of their
  // classes (plus exams they personally created). Admins and unassigned
  // teachers see all.
  if (profile.role === "teacher") {
    const { data: tc } = await supabase
      .from("teacher_classes")
      .select("class_id")
      .eq("teacher_id", profile.id);
    const classIds = (tc ?? []).map((r) => r.class_id);
    if (classIds.length > 0) {
      examQuery = examQuery.or(`class_id.in.(${classIds.join(",")}),created_by.eq.${profile.id}`);
    }
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
