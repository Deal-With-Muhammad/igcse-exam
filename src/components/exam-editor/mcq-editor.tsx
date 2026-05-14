"use client";

import { Button } from "@heroui/react";
import { Plus, X, Check } from "lucide-react";
import { SmartTextarea } from "./smart-textarea";
import type { MCQQuestion, Question } from "@/types";

interface Props {
  question: MCQQuestion;
  onUpdate: (q: Question) => void;
}

export function MCQEditor({ question, onUpdate }: Props) {
  const setOption = (i: number, v: string) => {
    const opts = [...question.options];
    opts[i] = v;
    onUpdate({ ...question, options: opts });
  };

  const addOption = () => {
    if (question.options.length >= 8) return;
    onUpdate({ ...question, options: [...question.options, ""] });
  };

  const removeOption = (i: number) => {
    if (question.options.length <= 2) return;
    const opts = [...question.options];
    opts.splice(i, 1);
    let correct = question.correctOption;
    if (correct === i) correct = 0;
    else if (correct > i) correct -= 1;
    onUpdate({ ...question, options: opts, correctOption: correct });
  };

  const setCorrect = (i: number) => onUpdate({ ...question, correctOption: i });

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Options <span className="text-default-400 font-normal">— click ✓ to mark the correct one</span></p>
        <Button size="sm" variant="flat" startContent={<Plus size={14} />} onPress={addOption} isDisabled={question.options.length >= 8}>
          Add option
        </Button>
      </div>
      {question.options.map((opt, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex flex-col gap-1 pt-2">
            <Button
              isIconOnly
              size="sm"
              variant={question.correctOption === i ? "solid" : "bordered"}
              color={question.correctOption === i ? "success" : "default"}
              onPress={() => setCorrect(i)}
              aria-label={`Mark option ${String.fromCharCode(65 + i)} correct`}
            >
              <Check size={14} />
            </Button>
          </div>
          <SmartTextarea
            value={opt}
            onChange={(v) => setOption(i, v)}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
            minRows={1}
            className="flex-1"
            showTools={false}
          />
          {question.options.length > 2 && (
            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeOption(i)} className="mt-2" aria-label="Remove option">
              <X size={14} />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
