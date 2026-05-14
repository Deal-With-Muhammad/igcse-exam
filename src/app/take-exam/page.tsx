import { Suspense } from "react";
import { ExamCodeEntry } from "@/components/exam-runner/exam-code-entry";

export default function TakeExamLanding() {
  return (
    <Suspense fallback={null}>
      <ExamCodeEntry />
    </Suspense>
  );
}
