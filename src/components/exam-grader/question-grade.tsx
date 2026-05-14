"use client";

import { Button, Card, CardBody, CardHeader, Chip, Divider, Input, Textarea } from "@heroui/react";
import { Check, Edit, X } from "lucide-react";
import type { Answer, Question } from "@/types";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import { isAnswerCorrect, isAutoGradedType } from "@/lib/exam/grading";

interface Props {
  question: Question;
  index: number;
  studentAnswer: Answer;
  grade: number;
  comment: string;
  manualOverride: boolean;
  onGradeChange: (v: number) => void;
  onCommentChange: (v: string) => void;
  onToggleOverride: () => void;
}

export function QuestionGrade({ question, index, studentAnswer, grade, comment, manualOverride, onGradeChange, onCommentChange, onToggleOverride }: Props) {
  const isAuto = isAutoGradedType(question.type);
  const correct = isAuto && !manualOverride ? isAnswerCorrect(question, studentAnswer) : grade === question.points;
  const zero = grade === 0;

  return (
    <Card className={`${zero ? "border-l-4 border-l-warning" : ""} ${manualOverride ? "border-r-4 border-r-primary" : ""}`}>
      <CardHeader className="flex flex-wrap justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold">Question {index + 1}</h3>
          <Chip size="sm" variant="flat">{QUESTION_TYPE_LABELS[question.type]}</Chip>
          <span className="text-xs text-default-500">{question.points} pt{question.points !== 1 ? "s" : ""}</span>
          {isAuto && !manualOverride && <Chip size="sm" color="secondary" variant="flat">Auto-graded</Chip>}
          {manualOverride && <Chip size="sm" color="primary" variant="flat" startContent={<Edit size={12} />}>Override</Chip>}
          {!isAuto && <Chip size="sm" color="warning" variant="flat">Manual</Chip>}
          {zero && <Chip size="sm" color="warning" variant="flat">0 marks</Chip>}
        </div>
        <div className="flex items-center gap-2">
          {isAuto && (
            <Button size="sm" variant="flat" color={manualOverride ? "primary" : "default"} startContent={manualOverride ? <Edit size={12} /> : null} onPress={onToggleOverride}>
              {manualOverride ? "Manual" : "Override"}
            </Button>
          )}
          <Input
            type="number"
            min={0}
            max={question.points}
            value={String(grade)}
            onChange={(e) => onGradeChange(Number.parseFloat(e.target.value) || 0)}
            isReadOnly={isAuto && !manualOverride}
            className="w-24"
            endContent={<span className="text-xs text-default-500">/{question.points}</span>}
            size="sm"
          />
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-4">
        <div>
          <p className="font-medium text-sm mb-1">Question</p>
          <p className="text-default-700 whitespace-pre-wrap text-sm">{question.text}</p>
          {question.image_url && <img src={question.image_url} alt="" className="mt-2 max-h-48 rounded border" />}
        </div>

        <div>
          <p className="font-medium text-sm mb-1">Student&apos;s answer</p>
          <AnswerView question={question} studentAnswer={studentAnswer} isAuto={isAuto} manualOverride={manualOverride} correct={correct} />
        </div>

        <Textarea
          label="Feedback for student"
          placeholder="Optional feedback / comments"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          minRows={2}
        />
      </CardBody>
    </Card>
  );
}

function AnswerView({ question, studentAnswer, isAuto, manualOverride, correct }: { question: Question; studentAnswer: Answer; isAuto: boolean; manualOverride: boolean; correct: boolean }) {
  const showCorrectMark = isAuto && !manualOverride;
  const bgClass = !showCorrectMark ? "bg-default-50 dark:bg-default-100/30" : correct ? "bg-success-50 border border-success dark:bg-success-100/20" : "bg-danger-50 border border-danger dark:bg-danger-100/20";

  if (question.type === "mcq") {
    return (
      <div className="space-y-1">
        {question.options.map((opt, i) => {
          const isStudent = studentAnswer === i || studentAnswer === String(i);
          const isCorrect = question.correctOption === i;
          const cls = [
            "p-2 rounded flex items-center gap-2 text-sm",
            isStudent && !showCorrectMark ? "bg-default-50 dark:bg-default-100/30 border" : "",
            isStudent && showCorrectMark && isCorrect ? "bg-success-50 dark:bg-success-100/20 border border-success" : "",
            isStudent && showCorrectMark && !isCorrect ? "bg-danger-50 dark:bg-danger-100/20 border border-danger" : "",
            !isStudent && isCorrect && showCorrectMark ? "border-l-4 border-l-success bg-default-50 dark:bg-default-100/30" : "",
          ].join(" ");
          return (
            <div key={i} className={cls}>
              {showCorrectMark && isCorrect && <Check size={14} className="text-success" />}
              {showCorrectMark && isStudent && !isCorrect && <X size={14} className="text-danger" />}
              <span className="font-bold mr-1">{String.fromCharCode(65 + i)}.</span>
              <span>{opt}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (question.type === "truefalse") {
    const studentBool = studentAnswer === true || studentAnswer === "true";
    return (
      <div className={`p-3 rounded ${bgClass}`}>
        <p className="text-sm">Student answered: <strong>{studentBool ? "True" : "False"}</strong></p>
        {showCorrectMark && <p className="text-xs text-default-500 mt-1">Correct: {question.correctAnswer ? "True" : "False"}</p>}
      </div>
    );
  }

  if (question.type === "fillblank") {
    return (
      <div className={`p-3 rounded ${bgClass}`}>
        <p className="text-sm">{studentAnswer ? String(studentAnswer) : <em className="text-default-400">No answer</em>}</p>
        {showCorrectMark && <p className="text-xs text-default-500 mt-1">Expected: {question.correctAnswer}{question.acceptedAnswers?.length ? ` (also accepts: ${question.acceptedAnswers.join(", ")})` : ""}</p>}
      </div>
    );
  }

  return (
    <div className="p-3 rounded bg-default-50 dark:bg-default-100/30 border">
      <p className="text-sm whitespace-pre-wrap">{studentAnswer ? String(studentAnswer) : <em className="text-default-400">No answer</em>}</p>
      {question.type === "short" && (question as { correctAnswer?: string }).correctAnswer && <p className="text-xs text-default-500 mt-2"><strong>Reference:</strong> {(question as { correctAnswer?: string }).correctAnswer}</p>}
    </div>
  );
}
