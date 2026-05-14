"use client";

import { Button, Card, CardBody, CardHeader, Chip, Divider, Switch } from "@heroui/react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import type { Exam, Template } from "@/types";
import { generateExamPdf } from "@/lib/pdf/exam-pdf";

interface Props {
  exam: Exam;
  template: Template | null;
}

export function PdfExportClient({ exam, template }: Props) {
  const [useTemplate, setUseTemplate] = useState(true);
  const [generating, setGenerating] = useState(false);

  const download = async () => {
    setGenerating(true);
    try {
      const blob = await generateExamPdf(exam, useTemplate ? template : null);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exam.title.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/dashboard/exams/${exam.id}`}>
          <Button isIconOnly variant="light"><ArrowLeft size={20} /></Button>
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">Export to PDF</h1>
      </div>

      <Card className="mb-4">
        <CardHeader><h2 className="font-semibold">{exam.title}</h2></CardHeader>
        <Divider />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip variant="flat" color="primary">{exam.curriculum.toUpperCase()}</Chip>
            <Chip variant="flat" color="secondary">{exam.subject}</Chip>
            {exam.level && <Chip variant="flat">{exam.level}</Chip>}
            <Chip variant="flat" color="warning">{exam.time_limit_minutes} min</Chip>
            <Chip variant="flat" color="success">{exam.total_marks} marks</Chip>
            <Chip variant="flat">{exam.questions.length} questions</Chip>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardHeader><h2 className="font-semibold">PDF options</h2></CardHeader>
        <Divider />
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Use exam paper template</p>
              <p className="text-xs text-default-500">
                {template ? `Template: ${template.name} — logo, school header, instructions, info block` : "No template assigned; will export plain layout"}
              </p>
            </div>
            <Switch isSelected={useTemplate && !!template} onValueChange={setUseTemplate} isDisabled={!template} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="text-center py-8">
          <FileText className="h-12 w-12 text-default-300 mx-auto mb-3" />
          <p className="text-sm text-default-500 mb-4">Ready to download</p>
          <Button color="primary" size="lg" onPress={download} isLoading={generating} startContent={<Download size={18} />} className="font-semibold">
            Download PDF
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
