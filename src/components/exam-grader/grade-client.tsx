"use client";

import { Button, Card, CardBody, CardHeader, Chip, Divider, Progress } from "@heroui/react";
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { Exam, Submission } from "@/types";
import { autoGrade, calcMaxScore, isAutoGradedType } from "@/lib/exam/grading";
import { createClient } from "@/lib/supabase/client";
import { QuestionGrade } from "./question-grade";

export function GradeClient({ exam, submission }: { exam: Exam; submission: Submission }) {
  const router = useRouter();
  const maxScore = useMemo(() => calcMaxScore(exam.questions), [exam.questions]);

  const initialGrades = useMemo(() => {
    if (submission.graded && submission.grades?.length === exam.questions.length) {
      return submission.grades;
    }
    return exam.questions.map((q, i) => autoGrade(q, submission.answers[i] ?? null));
  }, [exam.questions, submission.answers, submission.grades, submission.graded]);

  const initialOverrides = useMemo(() => {
    if (!submission.graded || !submission.grades?.length) return exam.questions.map(() => false);
    return exam.questions.map((q, i) => {
      if (!isAutoGradedType(q.type)) return false;
      const auto = autoGrade(q, submission.answers[i] ?? null);
      return submission.grades[i] !== auto;
    });
  }, [exam.questions, submission.answers, submission.grades, submission.graded]);

  const [grades, setGrades] = useState<number[]>(initialGrades);
  const [comments, setComments] = useState<string[]>(submission.comments?.length === exam.questions.length ? submission.comments : exam.questions.map(() => ""));
  const [overrides, setOverrides] = useState<boolean[]>(initialOverrides);
  const [saving, setSaving] = useState(false);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const total = grades.reduce((s, g) => s + (Number(g) || 0), 0);
  const pct = maxScore > 0 ? (total / maxScore) * 100 : 0;
  const zeros = grades.map((g, i) => (g === 0 ? i : -1)).filter((i) => i !== -1);

  const setGrade = (i: number, v: number) => {
    const max = exam.questions[i].points;
    const clamped = Math.max(0, Math.min(Number(v) || 0, max));
    setGrades((arr) => { const a = [...arr]; a[i] = clamped; return a; });
  };

  const setComment = (i: number, v: string) => setComments((arr) => { const a = [...arr]; a[i] = v; return a; });

  const toggleOverride = (i: number) => {
    setOverrides((arr) => {
      const a = [...arr];
      const next = !a[i];
      a[i] = next;
      if (!next) {
        // Recalculate auto grade
        const q = exam.questions[i];
        setGrade(i, autoGrade(q, submission.answers[i] ?? null));
      }
      return a;
    });
  };

  const jumpTo = (i: number) => {
    refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
    refs.current[i]?.classList.add("ring-2", "ring-warning");
    setTimeout(() => refs.current[i]?.classList.remove("ring-2", "ring-warning"), 1600);
  };

  const save = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("submissions").update({
        grades,
        comments,
        total_score: total,
        max_score: maxScore,
        graded: true,
        graded_at: new Date().toISOString(),
      }).eq("id", submission.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Grades saved");
      router.push(`/dashboard/exams/${exam.id}`);
    } finally { setSaving(false); }
  };

  const blurs = submission.switch_log?.filter((s) => s.event === "blur") || [];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/dashboard/exams/${exam.id}`}>
          <Button isIconOnly variant="light"><ArrowLeft size={20} /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold">Grade — {submission.student_name}</h1>
          <p className="text-xs text-default-500">{exam.title} · {submission.student_class} · {submission.branch_name}</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader><h2 className="font-semibold">Score</h2></CardHeader>
        <Divider />
        <CardBody>
          <div className="flex items-center gap-3">
            <Progress value={pct} color={pct >= 50 ? "success" : "danger"} className="flex-1" />
            <span className="font-bold text-lg whitespace-nowrap">{total}/{maxScore}</span>
            <span className="text-sm text-default-500">{pct.toFixed(1)}%</span>
          </div>
          {zeros.length > 0 && (
            <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-100/30 border border-warning-200 rounded">
              <p className="text-sm font-medium text-warning-800 flex items-center gap-1"><AlertTriangle size={14} /> {zeros.length} question(s) at 0 marks</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {zeros.map((i) => <Button key={i} size="sm" variant="flat" color="warning" onPress={() => jumpTo(i)}>Q{i + 1}</Button>)}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className={`mb-4 ${blurs.length > 0 ? "border-warning" : "border-success"}`}>
        <CardHeader className={blurs.length > 0 ? "bg-warning-50 dark:bg-warning-100/30" : "bg-success-50 dark:bg-success-100/30"}>
          <div className="flex items-center gap-2">
            {blurs.length > 0 ? <AlertTriangle size={18} className="text-warning" /> : <CheckCircle size={18} className="text-success" />}
            <h3 className="font-semibold">{blurs.length > 0 ? `${blurs.length} window switch${blurs.length === 1 ? "" : "es"} detected` : "Stayed focused throughout"}</h3>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="text-sm space-y-1">
          {submission.terminated && (
            <Chip color="danger" variant="flat" size="sm">Auto-terminated</Chip>
          )}
          {blurs.length > 0 ? (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {blurs.map((b, i) => (
                <div key={i} className="text-xs text-default-600">
                  #{i + 1}: {new Date(b.timestamp).toLocaleString()}{b.timeAway ? ` · ${b.timeAway}s away` : ""}
                </div>
              ))}
            </div>
          ) : <p className="text-default-500 text-xs">Total warnings: {submission.warnings ?? 0}</p>}
        </CardBody>
      </Card>

      <div className="space-y-3">
        {exam.questions.map((q, i) => (
          <div key={q.id} ref={(el) => { refs.current[i] = el; }} className="transition-all">
            <QuestionGrade
              question={q}
              index={i}
              studentAnswer={submission.answers[i] ?? null}
              grade={grades[i]}
              comment={comments[i] || ""}
              manualOverride={overrides[i]}
              onGradeChange={(v) => setGrade(i, v)}
              onCommentChange={(v) => setComment(i, v)}
              onToggleOverride={() => toggleOverride(i)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6 pb-8">
        <Button variant="light" onPress={() => router.push(`/dashboard/exams/${exam.id}`)}>Cancel</Button>
        <Button color="primary" onPress={save} isLoading={saving} startContent={<Save size={16} />} size="lg">{submission.graded ? "Update Grades" : "Save Grades"}</Button>
      </div>
    </div>
  );
}
