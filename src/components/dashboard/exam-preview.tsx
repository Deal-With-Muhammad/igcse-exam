"use client";

import { Button, Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { ArrowLeft, FileDown } from "lucide-react";
import Link from "next/link";
import type { Exam, Template } from "@/types";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";

interface Props {
  exam: Exam;
  template: Template | null;
}

export function ExamPreview({ exam, template }: Props) {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/exams/${exam.id}`}>
            <Button isIconOnly variant="light"><ArrowLeft size={20} /></Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold">Preview — {exam.title}</h1>
        </div>
        <Link href={`/dashboard/exams/${exam.id}/pdf`}>
          <Button color="primary" variant="flat" startContent={<FileDown size={16} />}>Export PDF</Button>
        </Link>
      </div>

      {template && (
        <Card className="mb-4">
          <CardHeader className="flex-col items-center gap-1 pt-6">
            {template.logo_url && <img src={template.logo_url} alt="logo" className="h-20 w-20 object-contain" />}
            <h2 className="text-lg font-bold tracking-wide uppercase text-center">{template.school_full_name}</h2>
            <p className="text-sm text-default-500">{template.header_title} ({template.header_year})</p>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Subject:</strong> {exam.subject}</div>
              <div><strong>Total Marks:</strong> {exam.total_marks}</div>
              <div><strong>Level:</strong> {exam.level}</div>
              <div><strong>Time:</strong> {exam.time_limit_minutes} min</div>
              <div><strong>Curriculum:</strong> {exam.curriculum.toUpperCase()}</div>
              {exam.part && <div><strong>Part:</strong> {exam.part}</div>}
            </div>
            {template.instructions.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold uppercase text-xs tracking-wider">Instructions</p>
                <ul className="list-disc ml-5 mt-1 text-xs space-y-0.5">
                  {template.instructions.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>
            )}
            {template.information.length > 0 && (
              <div>
                <p className="font-semibold uppercase text-xs tracking-wider">Information</p>
                <ul className="list-disc ml-5 mt-1 text-xs space-y-0.5">
                  {template.information.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>
            )}
            {template.final_reminder && (
              <p className="italic text-xs text-default-600 mt-2 pt-2 border-t border-default-100">{template.final_reminder}</p>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><h3 className="font-semibold">Questions</h3></CardHeader>
        <Divider />
        <CardBody className="space-y-6">
          {exam.questions.map((q, i) => (
            <div key={q.id} className="prose-exam">
              <div className="flex items-start gap-2 mb-1">
                <span className="font-bold">{i + 1}.</span>
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{q.text}</p>
                  {q.image_url && <img src={q.image_url} alt="" className="mt-2 max-h-48 rounded border" />}
                </div>
                <Chip size="sm" variant="flat" className="ml-auto flex-shrink-0">[{q.points}]</Chip>
              </div>
              {q.type === "mcq" && (
                <ul className="ml-6 mt-1 space-y-0.5">
                  {q.options.map((o, j) => (
                    <li key={j} className="text-sm"><span className="font-semibold mr-1">{String.fromCharCode(65 + j)})</span>{o}</li>
                  ))}
                </ul>
              )}
              {q.type === "truefalse" && <p className="ml-6 text-xs text-default-500">[True / False]</p>}
              {q.type === "fillblank" && <p className="ml-6 text-xs text-default-500">[Fill in the blank]</p>}
              {(q.type === "short" || q.type === "long") && (
                <div className="ml-6 mt-1 border-b border-dashed border-default-300 h-12" />
              )}
              <p className="text-xs text-default-400 ml-6 mt-1">{QUESTION_TYPE_LABELS[q.type]}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
