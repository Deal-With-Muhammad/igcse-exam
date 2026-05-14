"use client";

import { Button, Card, CardBody, Chip, Input, Select, SelectItem } from "@heroui/react";
import { ChevronDown, ChevronUp, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import type { Question, QuestionType } from "@/types";
import { QUESTION_TYPE_LABELS, QUESTION_TYPE_COLORS } from "@/lib/constants";
import { changeQuestionType } from "@/lib/exam/factory";
import { SmartTextarea } from "./smart-textarea";
import { SingleImageUploader } from "./image-uploader";
import { MCQEditor } from "./mcq-editor";
import { TrueFalseEditor } from "./truefalse-editor";
import { FillBlankEditor } from "./fillblank-editor";
import { ShortAnswerEditor } from "./short-answer-editor";

interface Props {
  question: Question;
  index: number;
  total: number;
  onUpdate: (q: Question) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function QuestionCard({ question, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const setField = <K extends keyof Question>(k: K, v: Question[K]) => {
    onUpdate({ ...question, [k]: v });
  };

  const setType = (t: QuestionType) => onUpdate(changeQuestionType(question, t));

  const color = QUESTION_TYPE_COLORS[question.type] as "primary" | "success" | "warning" | "secondary" | "default";

  return (
    <Card className="border-l-4" style={{ borderLeftColor: undefined }}>
      <div className="flex items-center justify-between px-4 py-2 bg-default-50 dark:bg-default-100/30 rounded-t-large">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm">Q{index + 1}</span>
          <Chip size="sm" color={color} variant="flat">{QUESTION_TYPE_LABELS[question.type]}</Chip>
          <span className="text-xs text-default-500 hidden sm:inline">{question.points} pt{question.points !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex gap-1">
          <Button isIconOnly size="sm" variant="light" isDisabled={index === 0} onPress={onMoveUp} aria-label="Move up"><ArrowUp size={14} /></Button>
          <Button isIconOnly size="sm" variant="light" isDisabled={index === total - 1} onPress={onMoveDown} aria-label="Move down"><ArrowDown size={14} /></Button>
          <Button isIconOnly size="sm" variant="light" onPress={() => setCollapsed((c) => !c)} aria-label="Collapse">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </Button>
          <Button isIconOnly size="sm" variant="light" color="danger" onPress={onRemove} aria-label="Remove"><Trash2 size={14} /></Button>
        </div>
      </div>

      {!collapsed && (
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Type" selectedKeys={[question.type]} onChange={(e) => e.target.value && setType(e.target.value as QuestionType)} className="sm:col-span-2">
              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                <SelectItem key={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>
              ))}
            </Select>
            <Input
              type="number"
              label="Marks"
              min={1}
              max={999}
              value={String(question.points)}
              onChange={(e) => setField("points", Math.max(1, Number.parseInt(e.target.value) || 1) as never)}
            />
          </div>

          <SmartTextarea
            label="Question text"
            placeholder="Type your question. Use the Symbols / Formulas buttons to insert special characters."
            value={question.text}
            onChange={(v) => setField("text", v as never)}
            minRows={3}
            isRequired
          />

          <div>
            <p className="text-xs font-medium text-default-600 mb-1">Question image (optional)</p>
            <SingleImageUploader value={question.image_url ?? null} onChange={(url) => setField("image_url", url as never)} />
          </div>

          {question.type === "mcq" && <MCQEditor question={question} onUpdate={onUpdate} />}
          {question.type === "truefalse" && <TrueFalseEditor question={question} onUpdate={onUpdate} />}
          {question.type === "fillblank" && <FillBlankEditor question={question} onUpdate={onUpdate} />}
          {question.type === "short" && <ShortAnswerEditor question={question} onUpdate={onUpdate} />}
        </CardBody>
      )}
    </Card>
  );
}
