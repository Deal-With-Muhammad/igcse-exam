"use client";

import { Card, CardBody, CardHeader, Chip, Divider, Input, Radio, RadioGroup, Textarea } from "@heroui/react";
import type { Answer, Question } from "@/types";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";

interface Props {
  question: Question;
  answer: Answer;
  onChange: (v: Answer) => void;
  index: number;
  total: number;
}

export function QuestionRunner({ question, answer, onChange, index, total }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start w-full gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Question {index + 1} <span className="text-sm font-normal text-default-500">of {total}</span></h2>
            <div className="prose-exam whitespace-pre-wrap text-default-800 dark:text-default-200">{question.text}</div>
            {question.image_url && (
              <img src={question.image_url} alt="question" className="mt-3 rounded border border-default-200 max-h-80" />
            )}
          </div>
          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            <Chip size="sm" variant="flat">{QUESTION_TYPE_LABELS[question.type]}</Chip>
            <Chip size="sm" variant="flat" color="primary">{question.points} pt{question.points !== 1 ? "s" : ""}</Chip>
          </div>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="pt-6">
        {question.type === "mcq" && (
          <RadioGroup
            value={answer === null || answer === undefined ? "" : String(answer)}
            onValueChange={(v) => onChange(v === "" ? "" : Number.parseInt(v))}
            classNames={{ wrapper: "gap-2" }}
          >
            {question.options.map((opt, i) => (
              <Radio
                key={i}
                value={String(i)}
                classNames={{
                  base: "max-w-full m-0 inline-flex bg-content1 hover:bg-content2 cursor-pointer rounded-lg gap-3 p-3 border-2 border-transparent data-[selected=true]:border-primary",
                  label: "text-sm",
                }}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
              </Radio>
            ))}
          </RadioGroup>
        )}

        {question.type === "truefalse" && (
          <RadioGroup
            value={answer === true || answer === "true" ? "true" : answer === false || answer === "false" ? "false" : ""}
            onValueChange={(v) => onChange(v === "true")}
            classNames={{ wrapper: "gap-2" }}
          >
            <Radio value="true" classNames={{ base: "max-w-full m-0 inline-flex bg-content1 hover:bg-content2 cursor-pointer rounded-lg gap-3 p-3 border-2 border-transparent data-[selected=true]:border-success" }}>True</Radio>
            <Radio value="false" classNames={{ base: "max-w-full m-0 inline-flex bg-content1 hover:bg-content2 cursor-pointer rounded-lg gap-3 p-3 border-2 border-transparent data-[selected=true]:border-danger" }}>False</Radio>
          </RadioGroup>
        )}

        {question.type === "fillblank" && (
          <Input
            placeholder="Type your answer..."
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onChange(e.target.value)}
            variant="bordered"
            size="lg"
          />
        )}

        {(question.type === "short" || question.type === "long") && (
          <Textarea
            placeholder="Type your answer..."
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onChange(e.target.value)}
            minRows={question.type === "short" ? 3 : 8}
            variant="bordered"
          />
        )}
      </CardBody>
    </Card>
  );
}
