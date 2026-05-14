import { ExamEditor } from "@/components/exam-editor/exam-editor";
import { createClient } from "@/lib/supabase/server";
import type { Template } from "@/types";

export default async function NewExamPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select("*").order("is_default", { ascending: false });
  return <ExamEditor mode="create" templates={(data ?? []) as Template[]} />;
}
