"use client";

import { Button, Card, CardBody, Chip, Input, Select, SelectItem, Switch, Tooltip } from "@heroui/react";
import { ChevronDown, ChevronUp, Trash2, ArrowUp, ArrowDown, Clock, AlignJustify, GripVertical } from "lucide-react";
import { useState } from "react";
import type { Question, QuestionType } from "@/types";
import { QUESTION_TYPE_LABELS, QUESTION_TYPE_COLORS } from "@/lib/constants";
import { changeQuestionType } from "@/lib/exam/factory";
import { questionImages } from "@/lib/exam/images";
import { RichTextEditor } from "./rich-text-editor";
import { MultiImageUploader } from "./image-uploader";
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
  /** Arms native drag-and-drop on the parent wrapper when the grip is grabbed. */
  onDragHandleDown?: () => void;
}

const DEFAULT_LINES: Record<QuestionType, number> = { mcq: 0, truefalse: 0, fillblank: 0, short: 3, long: 8 };
const ALLOWS_LINES: QuestionType[] = ["short", "long", "fillblank"];

export function QuestionCard({ question, index, total, onUpdate, onRemove, onMoveUp, onMoveDown, onDragHandleDown }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showTimer, setShowTimer] = useState(question.time_limit_seconds != null);

  const setField = <K extends keyof Question>(k: K, v: Question[K]) => onUpdate({ ...question, [k]: v });
  const setType = (t: QuestionType) => onUpdate(changeQuestionType(question, t));
  const color = QUESTION_TYPE_COLORS[question.type] as "primary" | "success" | "warning" | "secondary" | "default";

  const lines = question.lines_for_pdf ?? DEFAULT_LINES[question.type];
  const allowsLines = ALLOWS_LINES.includes(question.type);

  return (
    <Card>
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 bg-default-50 dark:bg-default-100/30 rounded-t-large">
        <div className="flex items-center gap-2 min-w-0">
          <Tooltip content="Drag to reorder" closeDelay={0}>
            <button
              type="button"
              aria-label="Drag to reorder"
              onMouseDown={onDragHandleDown}
              onTouchStart={onDragHandleDown}
              className="cursor-grab active:cursor-grabbing text-default-400 hover:text-default-600 touch-none"
            >
              <GripVertical size={16} />
            </button>
          </Tooltip>
          <span className="font-semibold text-sm">Q{index + 1}</span>
          <Chip size="sm" color={color} variant="flat">{QUESTION_TYPE_LABELS[question.type]}</Chip>
          <span className="text-xs text-default-500 hidden sm:inline">{question.points} pt{question.points !== 1 ? "s" : ""}</span>
          {question.time_limit_seconds != null && (
            <Tooltip content={`${question.time_limit_seconds}s timer`}><Chip size="sm" variant="flat" startContent={<Clock size={10} />}>{question.time_limit_seconds}s</Chip></Tooltip>
          )}
          {allowsLines && lines > 0 && (
            <Tooltip content={`${lines} answer lines on PDF`}><Chip size="sm" variant="flat" startContent={<AlignJustify size={10} />}>{lines}</Chip></Tooltip>
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Select label="Type" selectedKeys={[question.type]} onChange={(e) => e.target.value && setType(e.target.value as QuestionType)} className="sm:col-span-2">
              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                <SelectItem key={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>
              ))}
            </Select>
            <Input type="number" label="Marks" min={1} max={999} value={String(question.points)} onChange={(e) => setField("points", Math.max(1, Number.parseInt(e.target.value) || 1) as never)} />
            {allowsLines && (
              <Input
                type="number"
                label="PDF lines"
                min={0}
                max={30}
                value={String(lines)}
                onChange={(e) => setField("lines_for_pdf", Math.max(0, Number.parseInt(e.target.value) || 0) as never)}
                description="Blank lines for handwritten answer"
              />
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-default-50 dark:bg-default-100/30 rounded">
            <Switch
              size="sm"
              isSelected={showTimer}
              onValueChange={(v) => {
                setShowTimer(v);
                setField("time_limit_seconds", (v ? (question.time_limit_seconds ?? 60) : null) as never);
              }}
            >
              <span className="text-sm">Per-question timer</span>
            </Switch>
            {showTimer && (
              <Input
                type="number"
                size="sm"
                min={5}
                max={3600}
                value={String(question.time_limit_seconds ?? 60)}
                onChange={(e) => setField("time_limit_seconds", Math.max(5, Number.parseInt(e.target.value) || 60) as never)}
                endContent={<span className="text-xs text-default-500">sec</span>}
                className="w-32"
              />
            )}
          </div>

          <RichTextEditor
            label="Question text"
            placeholder="Type your question. Use the toolbar for bold, lists, tables, symbols & formulas."
            value={question.text}
            onChange={(v) => setField("text", v as never)}
            isRequired
          />

          <div>
            <p className="text-xs font-medium text-default-600 mb-1">Question images (optional)</p>
            <MultiImageUploader
              value={questionImages(question)}
              onChange={(urls) => onUpdate({ ...question, image_urls: urls, image_url: null })}
              pathPrefix="q"
              caption="Add one or more images — shown with the question online and on the PDF"
            />
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
