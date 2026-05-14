"use client";

import { Button, Card, CardBody, CardHeader, Chip, Divider, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from "@heroui/react";
import { ArrowLeft, Copy, Check, FileDown, Edit, Eye, Users, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Exam, Submission } from "@/types";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";

interface Props {
  exam: Exam;
  submissions: Submission[];
}

export function ExamDetail({ exam, submissions }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(exam.share_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard">
          <Button isIconOnly variant="light"><ArrowLeft size={20} /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{exam.title}</h1>
          <p className="text-xs text-default-500">Created {new Date(exam.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Preview">
            <Button isIconOnly variant="light" onPress={() => router.push(`/dashboard/exams/${exam.id}/preview`)}><Eye size={18} /></Button>
          </Tooltip>
          <Tooltip content="Export PDF">
            <Button isIconOnly variant="light" onPress={() => router.push(`/dashboard/exams/${exam.id}/pdf`)}><FileDown size={18} /></Button>
          </Tooltip>
          <Tooltip content="Edit">
            <Button isIconOnly variant="flat" color="primary" onPress={() => router.push(`/dashboard/exams/${exam.id}/edit`)}><Edit size={18} /></Button>
          </Tooltip>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader><h2 className="font-semibold">Overview</h2></CardHeader>
        <Divider />
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Share with students</h3>
            <div className="flex items-center gap-2">
              <div className="font-mono bg-default-100 dark:bg-default-200/30 px-3 py-2 rounded text-lg">{exam.share_code}</div>
              <Button isIconOnly variant="flat" color={copied ? "success" : "default"} onPress={copy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <p className="text-xs text-default-500 mt-1">Students enter this code at /take-exam</p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Stats</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1"><Users size={16} className="text-default-500" /><span>{submissions.length} submissions</span></div>
              <div className="flex items-center gap-1"><BarChart3 size={16} className="text-default-500" /><span>{submissions.filter((s) => s.graded).length} graded</span></div>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-2 pt-2 border-t border-default-100">
            <Chip variant="flat" color="primary">{exam.curriculum.toUpperCase()}</Chip>
            <Chip variant="flat" color="secondary">{exam.subject}</Chip>
            {exam.level && <Chip variant="flat">{exam.level}</Chip>}
            {exam.part && <Chip variant="flat">{exam.part}</Chip>}
            <Chip variant="flat" color="warning">{exam.time_limit_minutes} min</Chip>
            <Chip variant="flat" color="success">{exam.total_marks} marks</Chip>
            <Chip variant="flat">{exam.questions.length} Qs</Chip>
          </div>

          {exam.description && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium mb-1">Description</h3>
              <p className="text-sm text-default-600 whitespace-pre-wrap">{exam.description}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Student Submissions ({submissions.length})</h2></CardHeader>
        <Divider />
        <CardBody>
          {submissions.length === 0 ? (
            <p className="text-center text-default-500 py-6">No submissions yet. Share the code with students.</p>
          ) : (
            <Table aria-label="Submissions" removeWrapper>
              <TableHeader>
                <TableColumn>STUDENT</TableColumn>
                <TableColumn>BRANCH</TableColumn>
                <TableColumn>SUBMITTED</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>SCORE</TableColumn>
                <TableColumn>ACTION</TableColumn>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.student_name}</p>
                        <p className="text-xs text-default-500">{s.student_class}</p>
                      </div>
                    </TableCell>
                    <TableCell>{s.branch_name}</TableCell>
                    <TableCell className="text-xs">{new Date(s.submitted_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip size="sm" color={s.graded ? "success" : s.terminated ? "danger" : "warning"} variant="flat">
                        {s.terminated ? "Terminated" : s.graded ? "Graded" : "Pending"}
                      </Chip>
                    </TableCell>
                    <TableCell className="font-medium">{s.graded ? `${s.total_score}/${s.max_score}` : "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" color={s.graded ? "secondary" : "primary"} variant="flat" onPress={() => router.push(`/dashboard/exams/${exam.id}/grade/${s.id}`)}>
                        {s.graded ? "Review" : "Grade"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader><h2 className="font-semibold">Questions</h2></CardHeader>
        <Divider />
        <CardBody className="flex flex-wrap gap-2">
          {exam.questions.map((q, i) => (
            <Chip key={q.id} variant="flat">Q{i + 1}: {QUESTION_TYPE_LABELS[q.type]} ({q.points} pt)</Chip>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
