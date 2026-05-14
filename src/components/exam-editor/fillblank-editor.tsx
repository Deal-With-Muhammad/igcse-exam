"use client";

import { Input, Button, Chip } from "@heroui/react";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { FillBlankQuestion, Question } from "@/types";

interface Props {
  question: FillBlankQuestion;
  onUpdate: (q: Question) => void;
}

export function FillBlankEditor({ question, onUpdate }: Props) {
  const [extra, setExtra] = useState("");

  const addAccepted = () => {
    if (!extra.trim()) return;
    const accepted = [...(question.acceptedAnswers || []), extra.trim()];
    onUpdate({ ...question, acceptedAnswers: accepted });
    setExtra("");
  };

  const removeAccepted = (i: number) => {
    const accepted = [...(question.acceptedAnswers || [])];
    accepted.splice(i, 1);
    onUpdate({ ...question, acceptedAnswers: accepted });
  };

  return (
    <div className="space-y-3">
      <Input
        label="Correct answer"
        placeholder="e.g. Paris"
        value={question.correctAnswer}
        onChange={(e) => onUpdate({ ...question, correctAnswer: e.target.value })}
        isRequired
        description="Use __ (double underscore) in your question text to show where the blank goes"
      />
      <div>
        <p className="text-xs font-medium text-default-600 mb-1">Also accept (alternate correct answers)</p>
        <div className="flex gap-2">
          <Input
            size="sm"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="e.g. Paris, France"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAccepted(); } }}
          />
          <Button size="sm" variant="flat" startContent={<Plus size={14} />} onPress={addAccepted}>Add</Button>
        </div>
        {(question.acceptedAnswers?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {question.acceptedAnswers!.map((a, i) => (
              <Chip key={i} onClose={() => removeAccepted(i)} variant="flat" size="sm" endContent={<X size={12} />}>{a}</Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
