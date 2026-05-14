"use client";

import { Input } from "@heroui/react";
import type { ShortAnswerQuestion, Question } from "@/types";

interface Props {
  question: ShortAnswerQuestion;
  onUpdate: (q: Question) => void;
}

export function ShortAnswerEditor({ question, onUpdate }: Props) {
  return (
    <div>
      <Input
        label="Reference answer (optional)"
        placeholder="A model answer for grading reference"
        value={question.correctAnswer || ""}
        onChange={(e) => onUpdate({ ...question, correctAnswer: e.target.value })}
        description="Short answers are graded manually but a reference helps consistency"
      />
    </div>
  );
}
