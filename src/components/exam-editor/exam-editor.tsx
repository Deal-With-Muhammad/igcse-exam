"use client";

import { Button, Card, CardBody, Chip, Divider, useDisclosure } from "@heroui/react";
import { ArrowLeft, FileText, Plus, Save, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { calcMaxScore } from "@/lib/exam/grading";
import { makeQuestion } from "@/lib/exam/factory";
import { questionImages } from "@/lib/exam/images";
import { htmlToPlainText } from "@/lib/rich-text/html";
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
  /** Class ids the signed-in teacher is assigned to (empty for admins/unassigned). */
  myClassIds: string[];
}

export function ExamEditor({ mode, initialExam, templates, classes, me, myClassIds }: Props) {
  const router = useRouter();
  const defaultTemplate = templates.find((t) => t.is_default) || templates[0] || null;
  const isTeacher = me.role === "teacher";
  const hasAssignedClasses = isTeacher && myClassIds.length > 0;

  // Teachers can only pin an exam to a class they're assigned to. Admins and
  // unassigned teachers can choose any class. Keep the exam's existing class
  // selectable even if it's outside the teacher's current set.
  const selectableClasses = hasAssignedClasses
    ? classes.filter((c) => myClassIds.includes(c.id) || c.id === initialExam?.class_id)
    : classes;
  // Lock the picker only when there's exactly one option.
  const teacherLocked = hasAssignedClasses && selectableClasses.length === 1;

  const [meta, setMeta] = useState<ExamMeta>(() => ({
    title: initialExam?.title ?? "",
    curriculum: initialExam?.curriculum ?? "igcse",
    subject: initialExam?.subject ?? "",
    level: initialExam?.level ?? "",
    part: initialExam?.part ?? "",
    template_id: initialExam?.template_id ?? defaultTemplate?.id ?? null,
    class_id: initialExam?.class_id ?? (hasAssignedClasses ? myClassIds[0] : null),
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
  const [savingDraft, setSavingDraft] = useState(false);
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
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    setQuestions((arr) => {
      const next = [...arr];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  // Native drag-and-drop state: `armed` is the card whose grip was grabbed
  // (only that wrapper becomes draggable), `dragIndex`/`overIndex` track the
  // active drag for the drop indicator.
  const [armed, setArmed] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const addQ = (t: QuestionType) => setQuestions((q) => [...q, makeQuestion(t)]);
  const onBulkImport = (qs: Question[]) => setQuestions((cur) => [...cur, ...qs]);

  const validate = (): string | null => {
    if (!meta.title.trim()) return "Title is required";
    if (!meta.subject.trim()) return "Subject is required";
    if (questions.length === 0) return "Add at least one question";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!htmlToPlainText(q.text).trim() && questionImages(q).length === 0) return `Question ${i + 1} needs text or an image`;
      if (q.type === "mcq") {
        const empty = q.options.filter((o) => !o.trim()).length;
        if (empty > 0) return `Question ${i + 1} has empty options`;
      }
      if (q.type === "fillblank" && !q.correctAnswer.trim()) return `Question ${i + 1} needs a correct answer`;
    }
    return null;
  };

  const save = async (asDraft: boolean) => {
    // Drafts only need a title so work-in-progress can be saved; publishing
    // runs the full validation.
    if (asDraft) {
      if (!meta.title.trim()) { toast.error("Add a title to save a draft"); return; }
    } else {
      const err = validate();
      if (err) { toast.error(err); return; }
    }
    if (asDraft) setSavingDraft(true); else setSaving(true);
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
        is_draft: asDraft,
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
        toast.success(asDraft ? "Draft saved" : `Exam published — share code: ${data.share_code}`);
        router.push(`/dashboard/exams/${data.id}`);
      } else {
        const { error } = await supabase.from("exams").update(payload).eq("id", initialExam!.id);
        if (error) { toast.error(error.message); return; }
        toast.success(asDraft ? "Saved as draft" : "Exam saved");
        router.push(`/dashboard/exams/${initialExam!.id}`);
      }
    } finally { setSaving(false); setSavingDraft(false); }
  };

  const totalMarks = calcMaxScore(questions);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href={mode === "edit" ? `/dashboard/exams/${initialExam!.id}` : "/dashboard"}>
            <Button isIconOnly variant="light"><ArrowLeft size={20} /></Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold truncate">{mode === "create" ? "Create Exam" : `Edit: ${meta.title || "Exam"}`}</h1>
        </div>
        <div className="flex items-center gap-2">
          {initialExam?.is_draft && <Chip size="sm" color="warning" variant="flat">Draft</Chip>}
          <Button variant="flat" onPress={() => save(true)} isLoading={savingDraft} isDisabled={saving} startContent={<FileText size={16} />} className="hidden sm:flex">
            Save as Draft
          </Button>
          <Button color="primary" onPress={() => save(false)} isLoading={saving} isDisabled={savingDraft} startContent={<Save size={16} />} className="font-semibold hidden sm:flex">
            {mode === "create" ? "Publish" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Stationary side panel — add questions, running totals, save.
            Sits on the right on desktop (sticky); drops below the form on mobile.
            The column stretches to full height so the sticky child has room to
            stay pinned while the questions list scrolls. */}
        <aside className="w-full lg:w-72 lg:order-2 lg:flex-shrink-0 order-last">
          <div className="lg:sticky lg:top-4 space-y-3">
            <Card>
              <CardBody className="p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-default-500">Total marks</span>
                  <span className="text-2xl font-bold text-primary">{totalMarks}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm text-default-500">Questions</span>
                  <span className="text-lg font-semibold">{questions.length}</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-3 space-y-2">
                <p className="text-xs font-semibold text-default-500 px-1">ADD QUESTION</p>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  <Button color="primary" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("mcq")} className="justify-start">Multiple Choice</Button>
                  <Button color="success" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("truefalse")} className="justify-start">True / False</Button>
                  <Button color="warning" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("fillblank")} className="justify-start">Fill in Blank</Button>
                  <Button color="secondary" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("short")} className="justify-start">Short Answer</Button>
                  <Button color="default" variant="flat" startContent={<Plus size={16} />} onPress={() => addQ("long")} className="justify-start">Long Answer</Button>
                </div>
                <Divider className="my-1" />
                <Button variant="flat" startContent={<UploadCloud size={16} />} onPress={bulkModal.onOpen} className="w-full justify-start">Bulk Import</Button>
              </CardBody>
            </Card>

            <Button color="primary" onPress={() => save(false)} isLoading={saving} isDisabled={savingDraft} startContent={<Save size={16} />} size="lg" className="font-semibold w-full">
              {mode === "create" ? "Publish" : "Save Changes"}
            </Button>
            <Button variant="flat" onPress={() => save(true)} isLoading={savingDraft} isDisabled={saving} startContent={<FileText size={16} />} className="w-full">
              Save as Draft
            </Button>
          </div>
        </aside>

        {/* Main column — exam details, settings, questions. */}
        <div className="flex-1 min-w-0 w-full lg:order-1 space-y-4">
          <ExamMetaCard meta={meta} onChange={setMeta} templates={templates} classes={selectableClasses} lockClass={teacherLocked} />
          <ExamSettingsCard settings={settings} onChange={setSettings} />

          <h2 className="text-lg font-semibold pt-1">Questions ({questions.length})</h2>

          {questions.length === 0 ? (
            <Card className="text-center p-8"><p className="text-default-500">No questions yet — add one from the panel or bulk-import to get started</p></Card>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  draggable={armed === i}
                  onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(i)); } catch { /* some browsers */ } }}
                  onDragOver={(e) => { if (dragIndex === null) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overIndex !== i) setOverIndex(i); }}
                  onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) reorder(dragIndex, i); setDragIndex(null); setOverIndex(null); setArmed(null); }}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); setArmed(null); }}
                  onMouseUp={() => { if (dragIndex === null) setArmed(null); }}
                  className={[
                    "transition-all",
                    dragIndex === i ? "opacity-50" : "",
                    overIndex === i && dragIndex !== null && dragIndex !== i ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-large" : "",
                  ].join(" ")}
                >
                  <QuestionCard question={q} index={i} total={questions.length}
                    onUpdate={(nq) => updateQ(i, nq)} onRemove={() => removeQ(i)}
                    onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)}
                    onDragHandleDown={() => setArmed(i)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BulkImportModal isOpen={bulkModal.isOpen} onClose={bulkModal.onClose} onImport={onBulkImport} />
    </div>
  );
}
