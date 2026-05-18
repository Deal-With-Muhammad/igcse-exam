"use client";

import { Button, Card, useDisclosure } from "@heroui/react";
import { ArrowLeft, FileDown, Plus, Save, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { calcMaxScore } from "@/lib/exam/grading";
import { makeQuestion } from "@/lib/exam/factory";
import { generateShareCode } from "@/lib/share-code";
import type { Class, Exam, Profile, Question, QuestionType, Template } from "@/types";
import { ExamMetaCard, type ExamMeta } from "./exam-meta-card";
import { ExamSettingsCard, type ExamSettings } from "./exam-settings-card";
import { QuestionCard } from "./question-card";
import { BulkImportModal } from "./bulk-import-modal";

interface Props {
  mode: "create" | "edit";
  initialExam?: Exam;
  templates: Template[];
  classes: Class[];
  me: Profile;
}

export function ExamEditor({ mode, initialExam, templates, classes, me }: Props) {
  const router = useRouter();
  const defaultTemplate = templates.find((t) => t.is_default) || templates[0] || null;
  const teacherLocked = me.role === "teacher" && me.class_id !== null;

  const [meta, setMeta] = useState<ExamMeta>(() => ({
    title: initialExam?.title ?? "",
    curriculum: initialExam?.curriculum ?? "igcse",
    subject: initialExam?.subject ?? "",
    level: initialExam?.level ?? "",
    part: initialExam?.part ?? "",
    template_id: initialExam?.template_id ?? defaultTemplate?.id ?? null,
    class_id: initialExam?.class_id ?? (teacherLocked ? me.class_id : null),
    reference_images: initialExam?.reference_images ?? [],
  }));

  const [settings, setSettings] = useState<ExamSettings>(() => ({
    hasTimer: initialExam?.time_limit_minutes != null,
    time_limit_minutes: initialExam?.time_limit_minutes ?? null,
    terminate_on_switch: initialExam?.terminate_on_switch ?? true,
    max_warnings: initialExam?.max_warnings ?? 1,
  }));

  const [questions, setQuestions] = useState<Question[]>(initialExam?.questions ?? []);
  const [saving, setSaving] = useState(false);
  const bulkModal = useDisclosure();

  const updateQ = (i: number, q: Question) => {
    const arr = [...questions]; arr[i] = q; setQuestions(arr);
  };
  const removeQ = (i: number) => { const arr = [...questions]; arr.splice(i, 1); setQuestions(arr); };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= questions.length) return;
    const arr = [...questions];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setQuestions(arr);
  };
  const addQ = (t: QuestionType) => setQuestions((q) => [...q, makeQuestion(t)]);
  const onBulkImport = (qs: Question[]) => setQuestions((cur) => [...cur, ...qs]);

  const validate = (): string | null => {
    if (!meta.title.trim()) return "Title is required";
    if (!meta.subject.trim()) return "Subject is required";
    if (questions.length === 0) return "Add at least one question";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim() && !q.image_url) return `Question ${i + 1} needs text or an image`;
      if (q.type === "mcq") {
        const empty = q.options.filter((o) => !o.trim()).length;
        if (empty > 0) return `Question ${i + 1} has empty options`;
      }
      if (q.type === "fillblank" && !q.correctAnswer.trim()) return `Question ${i + 1} needs a correct answer`;
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    const supabase = createClient();
    try {
      const total = calcMaxScore(questions);
      const payload = {
        title: meta.title,
        description: "",
        curriculum: meta.curriculum,
        subject: meta.subject,
        level: meta.level,
        part: meta.part,
        template_id: meta.template_id,
        class_id: meta.class_id,
        time_limit_minutes: settings.hasTimer ? settings.time_limit_minutes : null,
        terminate_on_switch: settings.terminate_on_switch,
        max_warnings: settings.max_warnings,
        reference_images: meta.reference_images,
        total_marks: total,
        questions: questions as unknown as Record<string, unknown>[],
      };
      if (mode === "create") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { toast.error("Not signed in"); return; }
        const { data, error } = await supabase
          .from("exams")
          .insert({ ...payload, share_code: generateShareCode(), created_by: user.id })
          .select("id, share_code")
          .single();
        if (error || !data) { toast.error(error?.message || "Failed to save"); return; }
        toast.success(`Exam created — share code: ${data.share_code}`);
        router.push(`/dashboard/exams/${data.id}`);
      } else {
        const { error } = await supabase.from("exams").update(payload).eq("id", initialExam!.id);
        if (error) { toast.error(error.message); return; }
        toast.success("Exam updated");
        router.push(`/dashboard/exams/${initialExam!.id}`);
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href={mode === "edit" ? `/dashboard/exams/${initialExam!.id}` : "/dashboard"}>
            <Button isIconOnly variant="light"><ArrowLeft size={20} /></Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold truncate">{mode === "create" ? "Create Exam" : `Edit: ${meta.title || "Exam"}`}</h1>
        </div>
        <Button color="primary" onPress={save} isLoading={saving} startContent={<Save size={16} />} size="lg" className="font-semibold">
          {mode === "create" ? "Create Exam" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-4 mb-6">
        <ExamMetaCard meta={meta} onChange={setMeta} templates={templates} classes={classes} lockClass={teacherLocked} />
        <ExamSettingsCard settings={settings} onChange={setSettings} />
      </div>

      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <div>
          <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
          <p className="text-xs text-default-500">Total marks: {calcMaxScore(questions)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="flat" startContent={<UploadCloud size={16} />} onPress={bulkModal.onOpen}>Bulk Import</Button>
          <Button color="primary" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("mcq")}>+ MCQ</Button>
          <Button color="success" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("truefalse")}>+ T/F</Button>
          <Button color="warning" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("fillblank")}>+ Fill</Button>
          <Button color="secondary" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("short")}>+ Short</Button>
          <Button color="default" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("long")}>+ Long</Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card className="text-center p-8"><p className="text-default-500">No questions yet — add or bulk-import to get started</p></Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i} total={questions.length}
              onUpdate={(nq) => updateQ(i, nq)} onRemove={() => removeQ(i)}
              onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)} />
          ))}
        </div>
      )}

      {mode === "edit" && initialExam && (
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Link href={`/dashboard/exams/${initialExam.id}/pdf`}>
            <Button variant="flat" startContent={<FileDown size={16} />}>Export PDF</Button>
          </Link>
        </div>
      )}

      <BulkImportModal isOpen={bulkModal.isOpen} onClose={bulkModal.onClose} onImport={onBulkImport} />
    </div>
  );
}
