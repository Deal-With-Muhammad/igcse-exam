"use client";

import { Button } from "@heroui/react";
import type { TrueFalseQuestion, Question } from "@/types";

interface Props {
  question: TrueFalseQuestion;
  onUpdate: (q: Question) => void;
}

export function TrueFalseEditor({ question, onUpdate }: Props) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">Correct answer</p>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          color={question.correctAnswer ? "success" : "default"}
          variant={question.correctAnswer ? "solid" : "bordered"}
          onPress={() => onUpdate({ ...question, correctAnswer: true })}
        >
          True
        </Button>
        <Button
          className="flex-1"
          color={!question.correctAnswer ? "danger" : "default"}
          variant={!question.correctAnswer ? "solid" : "bordered"}
          onPress={() => onUpdate({ ...question, correctAnswer: false })}
        >
          False
        </Button>
      </div>
    </div>
  );
}
