"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Chip,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
} from "@nextui-org/react";
import {
  ArrowLeftIcon,
  CopyIcon,
  EyeIcon,
  BarChart3Icon,
  UsersIcon,
} from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function ExamDetails({ params }) {
  const router = useRouter();
  const { id } = params;
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        // Fetch exam details
        const examDoc = await getDoc(doc(db, "exams", id));
        if (examDoc.exists()) {
          setExam({ id: examDoc.id, ...examDoc.data() });
        } else {
          alert("Exam not found");
          router.push("/dashboard");
          return;
        }

        // Fetch submissions for this exam
        const submissionsQuery = query(
          collection(db, "submissions"),
          where("examId", "==", id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsList = submissionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubmissions(submissionsList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [id, router]);

  const copyShareCode = () => {
    const shareCode = id.substring(0, 6);
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading exam details...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto p-4 text-center">Exam not found</div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button isIconOnly variant="light" aria-label="Back">
            <ArrowLeftIcon size={20} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-2">{exam.title}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex justify-between">
          <div>
            <h2 className="text-xl font-semibold">Exam Overview</h2>
            <p className="text-small text-default-500">
              Created on{" "}
              {new Date(exam.createdAt?.toDate()).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip content="Preview Exam">
              <Button
                isIconOnly
                color="secondary"
                variant="light"
                onClick={() => router.push(`/preview-exam/${id}`)}
              >
                <EyeIcon size={20} />
              </Button>
            </Tooltip>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-md font-medium mb-2">Share with Students</h3>
              <div className="flex items-center gap-2">
                <div className="font-mono bg-gray-100 px-3 py-2 rounded">
                  {id.substring(0, 6)}
                </div>
                <Button
                  isIconOnly
                  variant="flat"
                  color={copied ? "success" : "default"}
                  onClick={copyShareCode}
                >
                  <CopyIcon size={16} />
                </Button>
              </div>
              <p className="text-xs text-default-500 mt-1">
                Students can use this code to access the exam
              </p>
            </div>
            <div>
              <h3 className="text-md font-medium mb-2">Exam Statistics</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <UsersIcon size={16} className="text-default-500" />
                  <span>{submissions.length} Submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3Icon size={16} className="text-default-500" />
                  <span>
                    {submissions.filter((s) => s.graded).length} Graded
                  </span>
                </div>
              </div>
            </div>
          </div>

          {exam.description && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-1">Description</h3>
              <p className="text-default-600">{exam.description}</p>
            </div>
          )}

          <div className="mt-4">
            <h3 className="text-md font-medium mb-1">Questions</h3>
            <div className="flex flex-wrap gap-2">
              {exam.questions.map((q, index) => (
                <Chip
                  key={index}
                  color={q.type === "mcq" ? "primary" : "secondary"}
                  variant="flat"
                >
                  Q{index + 1}:{" "}
                  {q.type === "mcq" ? "Multiple Choice" : "Long Answer"} (
                  {q.points} pts)
                </Chip>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <Tabs aria-label="Submissions tabs">
        <Tab key="submissions" title="Student Submissions">
          {submissions.length > 0 ? (
            <Table aria-label="Student submissions">
              <TableHeader>
                <TableColumn>STUDENT</TableColumn>
                <TableColumn>SUBMITTED</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>SCORE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission.studentName}</p>
                        <p className="text-small text-default-500">
                          {submission.studentClass}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(
                        submission.submittedAt?.toDate()
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={submission.graded ? "success" : "warning"}
                        variant="flat"
                      >
                        {submission.graded ? "Graded" : "Pending"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {submission.graded
                        ? `${submission.totalScore}/${submission.maxScore}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        color={submission.graded ? "secondary" : "primary"}
                        onClick={() =>
                          router.push(`/dashboard/grade/${submission.id}`)
                        }
                      >
                        {submission.graded ? "Review" : "Grade"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No submissions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Share the exam code with your students to get started.
              </p>
            </div>
          )}
        </Tab>
      </Tabs>
    </div>
  );
}
