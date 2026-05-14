"use client";

import { Button, Card, CardBody, Chip, Progress } from "@heroui/react";
import { ArrowLeft, ArrowRight, Send, Eye, EyeOff, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Exam, Answer } from "@/types";
import { useExamStorage, loadExamState, clearExamState, type ExamState } from "@/hooks/use-exam-storage";
import { useProctor } from "@/hooks/use-proctor";
import { QuestionRunner } from "./question-runner";
import { TerminationModal, WarningModal } from "./exam-modals";
import { ExamTimer } from "./exam-timer";

const GRACE_SECONDS = 60;

export function ExamRunner({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [initialState] = useState<ExamState>(() => {
    if (typeof window === "undefined") return makeFreshState(exam);
    const persisted = loadExamState(exam.id);
    if (persisted) return persisted;
    const raw = sessionStorage.getItem("exam:registration");
    if (!raw) return makeFreshState(exam);
    const reg = JSON.parse(raw);
    return {
      examId: exam.id,
      studentName: reg.studentName,
      studentClass: reg.studentClass,
      branch: reg.branch,
      branchName: reg.branchName,
      startedAt: reg.startedAt ?? Date.now(),
      answers: exam.questions.map(() => "" as Answer),
      currentQuestion: 0,
      switchLog: [],
      warnings: 0,
      terminated: false,
    };
  });

  const [state, update] = useExamStorage(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [showWarn, setShowWarn] = useState(false);
  const [showTerm, setShowTerm] = useState(state.terminated);
  const submittedRef = useRef(false);

  const { focused, timeLeft } = useProctor({
    graceSeconds: GRACE_SECONDS,
    enabled: !state.terminated && !submitting,
    onSwitch: (ev) => {
      update((p) => ({ ...p, switchLog: [...p.switchLog, ev], warnings: ev.event === "blur" ? p.warnings + 1 : p.warnings }));
      if (ev.event === "blur") setShowWarn(true);
      if (ev.event === "focus") setShowWarn(false);
    },
    onTerminate: () => {
      update((p) => ({ ...p, terminated: true }));
      setShowWarn(false);
      setShowTerm(true);
    },
  });

  // protect against missing registration data
  useEffect(() => {
    if (!state.studentName || !state.studentClass) {
      toast.error("Please register first");
      router.push(`/take-exam/${exam.id}`);
    }
  }, [state.studentName, state.studentClass, router, exam.id]);

  const q = exam.questions[state.currentQuestion];
  const setAnswer = (val: Answer) => update((p) => {
    const a = [...p.answers];
    a[p.currentQuestion] = val;
    return { ...p, answers: a };
  });

  const goTo = (i: number) => update((p) => ({ ...p, currentQuestion: Math.max(0, Math.min(exam.questions.length - 1, i)) }));

  const submit = async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const payload = {
        exam_id: exam.id,
        exam_title: exam.title,
        student_name: state.studentName,
        student_class: state.studentClass,
        branch: state.branch,
        branch_name: state.branchName,
        answers: state.answers,
        switch_log: state.switchLog,
        warnings: state.warnings,
        total_switches: state.switchLog.filter((s) => s.event === "blur").length,
        terminated: state.terminated || auto,
        submitted_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("submissions").insert(payload);
      if (error) {
        submittedRef.current = false;
        toast.error("Submit failed — answers are safe, retrying preserves your work. " + error.message);
        setSubmitting(false);
        return;
      }
      clearExamState(exam.id);
      sessionStorage.removeItem("exam:registration");
      router.push("/take-exam/complete");
    } catch (err) {
      submittedRef.current = false;
      toast.error("Network error — answers are saved locally. Please try again.");
      console.error(err);
      setSubmitting(false);
    }
  };

  const progress = ((state.currentQuestion + 1) / exam.questions.length) * 100;
  const answered = state.answers.filter((a) => a !== "" && a !== null && a !== undefined).length;

  return (
    <>
      <div className="min-h-screen bg-default-50 dark:bg-gray-950">
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b sticky top-0 z-30">
          <div className="container mx-auto px-3 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-base md:text-lg truncate">{exam.title}</h1>
              <p className="text-xs text-default-500">{state.studentName} · {state.branchName}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ExamTimer startedAt={state.startedAt} totalMinutes={exam.time_limit_minutes} onTimeUp={() => submit(true)} />
              <div className="flex items-center gap-1 text-xs">
                {focused ? <Eye size={14} className="text-success" /> : <EyeOff size={14} className="text-danger" />}
                <span className="hidden sm:inline">{focused ? "Focused" : `${timeLeft}s`}</span>
              </div>
              {state.warnings > 0 && <Chip color="warning" size="sm">⚠️ {state.warnings}</Chip>}
              <Chip color="success" size="sm" variant="flat" startContent={<Save size={12} />} className="hidden md:flex">saved</Chip>
            </div>
          </div>
          <div className="px-3 py-2 border-t">
            <Progress value={progress} color="primary" size="sm" />
            <div className="flex justify-between text-xs mt-1 text-default-500">
              <span>Question {state.currentQuestion + 1} of {exam.questions.length}</span>
              <span>{answered}/{exam.questions.length} answered</span>
            </div>
          </div>
          <nav className="px-3 py-2 border-t overflow-x-auto">
            <div className="flex gap-1">
              {exam.questions.map((_, i) => {
                const isAnswered = state.answers[i] !== "" && state.answers[i] !== null && state.answers[i] !== undefined;
                return (
                  <Button
                    key={i}
                    size="sm"
                    variant={i === state.currentQuestion ? "solid" : "flat"}
                    color={isAnswered ? "success" : "default"}
                    onPress={() => goTo(i)}
                    className="min-w-[36px] flex-shrink-0"
                  >
                    {i + 1}
                  </Button>
                );
              })}
            </div>
          </nav>
        </header>

        <main className="container mx-auto p-4 max-w-3xl">
          {exam.reference_images.length > 0 && (
            <Card className="mb-4"><CardBody className="flex flex-wrap gap-2 flex-row">
              <p className="text-xs text-default-500 w-full mb-1">Reference images</p>
              {exam.reference_images.map((url) => (
                <img key={url} src={url} alt="ref" className="max-h-32 rounded border border-default-200" />
              ))}
            </CardBody></Card>
          )}

          <QuestionRunner question={q} answer={state.answers[state.currentQuestion]} onChange={setAnswer} index={state.currentQuestion} total={exam.questions.length} />

          <div className="flex justify-between mt-6 pb-8">
            <Button variant="flat" startContent={<ArrowLeft size={16} />} isDisabled={state.currentQuestion === 0} onPress={() => goTo(state.currentQuestion - 1)}>Previous</Button>
            {state.currentQuestion === exam.questions.length - 1 ? (
              <Button color="success" size="lg" endContent={<Send size={16} />} onPress={() => submit(false)} isLoading={submitting}>Submit Exam</Button>
            ) : (
              <Button color="primary" endContent={<ArrowRight size={16} />} onPress={() => goTo(state.currentQuestion + 1)}>Next</Button>
            )}
          </div>
        </main>
      </div>

      <WarningModal isOpen={showWarn && !state.terminated} timeLeft={timeLeft} warnings={state.warnings} />
      <TerminationModal isOpen={showTerm} warnings={state.warnings} switches={state.switchLog.filter((s) => s.event === "blur").length} onClose={() => submit(true)} />
    </>
  );
}

function makeFreshState(exam: Exam): ExamState {
  return {
    examId: exam.id,
    studentName: "",
    studentClass: "",
    branch: "",
    branchName: "",
    startedAt: Date.now(),
    answers: exam.questions.map(() => "" as Answer),
    currentQuestion: 0,
    switchLog: [],
    warnings: 0,
    terminated: false,
  };
}
