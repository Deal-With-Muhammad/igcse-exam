import { ExamEditor } from "@/components/exam-editor/exam-editor";
import { createClient } from "@/lib/supabase/server";
import { requireSignedIn } from "@/lib/auth";
import type { Class, Template } from "@/types";

export default async function NewExamPage() {
  const me = await requireSignedIn();
  const supabase = await createClient();
  const [{ data: templates }, { data: classes }] = await Promise.all([
    supabase.from("templates").select("*").order("is_default", { ascending: false }),
    supabase.from("classes").select("*").order("sort_order"),
  ]);
  return (
    <ExamEditor
      mode="create"
      templates={(templates ?? []) as Template[]}
      classes={(classes ?? []) as Class[]}
      me={me}
    />
  );
}
