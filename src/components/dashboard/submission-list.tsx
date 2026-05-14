"use client";

import { Card, CardBody, CardHeader, Divider, Button, Chip } from "@heroui/react";
import Link from "next/link";
import { CheckSquare, Eye } from "lucide-react";

interface Submission {
  id: string;
  exam_id: string;
  exam_title: string;
  student_name: string;
  student_class: string;
  branch_name: string;
  submitted_at: string;
  graded: boolean;
  total_score: number;
  max_score: number;
}

export function SubmissionList({ submissions, mode }: { submissions: Submission[]; mode: "pending" | "graded" }) {
  if (submissions.length === 0) {
    return (
      <Card className="text-center p-6 mt-4">
        <CardBody>
          <p className="text-default-500">
            {mode === "pending" ? "No pending submissions." : "No graded submissions yet."}
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {submissions.map((s) => (
        <Card key={s.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{s.student_name}</h3>
              <p className="text-xs text-default-500 truncate">{s.exam_title}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                <Chip size="sm" variant="flat">{s.student_class}</Chip>
                <Chip size="sm" variant="flat" color="secondary">{s.branch_name}</Chip>
              </div>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="text-sm">
            <div className="flex justify-between items-center">
              <div className="text-xs">
                <p className="text-default-500">{new Date(s.submitted_at).toLocaleString()}</p>
                {mode === "graded" && (
                  <p className="font-bold mt-1">
                    Score: {s.total_score}/{s.max_score}{" "}
                    <span className="text-default-500 font-normal">
                      ({s.max_score > 0 ? ((s.total_score / s.max_score) * 100).toFixed(1) : 0}%)
                    </span>
                  </p>
                )}
              </div>
              <Link href={`/dashboard/exams/${s.exam_id}/grade/${s.id}`}>
                <Button size="sm" color={mode === "pending" ? "primary" : "secondary"} variant="flat" startContent={mode === "pending" ? <CheckSquare size={14} /> : <Eye size={14} />}>
                  {mode === "pending" ? "Grade" : "Review"}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
