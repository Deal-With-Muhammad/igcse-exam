"use client";

import { Tabs, Tab, Button } from "@heroui/react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { ExamGrid, type ExamRow } from "./exam-grid";
import { SubmissionList } from "./submission-list";
import type { Profile } from "@/types";

type ExamSummary = ExamRow;

interface SubmissionSummary {
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

interface Props {
  profile: Profile;
  exams: ExamSummary[];
  submissions: SubmissionSummary[];
}

export function DashboardClient({ profile, exams, submissions }: Props) {
  const [examList, setExamList] = useState(exams);
  const pending = submissions.filter((s) => !s.graded);
  const graded = submissions.filter((s) => s.graded);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome, {profile.full_name || "Teacher"}</h1>
          <p className="text-default-500 text-sm">Manage your exams, submissions and grading</p>
        </div>
        <Link href="/dashboard/exams/new">
          <Button color="primary" startContent={<PlusIcon size={16} />} size="lg" className="font-semibold w-full sm:w-auto">
            Create New Exam
          </Button>
        </Link>
      </div>

      <Tabs aria-label="Dashboard" variant="underlined" color="primary">
        <Tab key="exams" title={`My Exams (${examList.length})`}>
          <ExamGrid exams={examList} onChange={setExamList} />
        </Tab>
        <Tab key="pending" title={`Pending Grading (${pending.length})`}>
          <SubmissionList submissions={pending} mode="pending" />
        </Tab>
        <Tab key="graded" title={`Graded (${graded.length})`}>
          <SubmissionList submissions={graded} mode="graded" />
        </Tab>
      </Tabs>
    </div>
  );
}
