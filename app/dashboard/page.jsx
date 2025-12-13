"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Tabs,
  Tab,
} from "@nextui-org/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  PlusIcon,
  FileTextIcon,
  CheckSquareIcon,
  EditIcon,
} from "lucide-react";

export default function Dashboard() {
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsCollection = collection(db, "exams");
        const examsSnapshot = await getDocs(examsCollection);
        const examsList = examsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExams(examsList);

        // Fetch submissions that need grading
        const submissionsCollection = collection(db, "submissions");
        const submissionsQuery = query(
          submissionsCollection,
          where("graded", "==", false)
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

    fetchExams();
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <Link href="/dashboard/create-exam">
          <Button color="primary" startContent={<PlusIcon size={16} />}>
            Create New Exam
          </Button>
        </Link>
      </div>

      <Tabs aria-label="Dashboard tabs">
        <Tab key="exams" title="My Exams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {loading ? (
              <p>Loading exams...</p>
            ) : exams.length > 0 ? (
              exams.map((exam) => (
                <Card
                  key={exam.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{exam.title}</h3>
                      <p className="text-small text-default-500">
                        {exam.questions?.length || 0} Questions
                      </p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <p>
                          Share Code:{" "}
                          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {exam.id.substring(0, 6)}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/edit-exam/${exam.id}`}>
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<EditIcon size={16} />}
                          >
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/dashboard/exam/${exam.id}`}>
                          <Button size="sm" color="secondary" variant="flat">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">
                  No exams created yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new exam.
                </p>
                <Link
                  href="/dashboard/create-exam"
                  className="mt-4 inline-block"
                >
                  <Button color="primary" startContent={<PlusIcon size={16} />}>
                    Create New Exam
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Tab>
        <Tab key="submissions" title="Pending Submissions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {loading ? (
              <p>Loading submissions...</p>
            ) : submissions.length > 0 ? (
              submissions.map((submission) => (
                <Card
                  key={submission.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {submission.studentName}
                      </h3>
                      <p className="text-small text-default-500">
                        {submission.examTitle}
                      </p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <p>
                          Submitted:{" "}
                          {new Date(
                            submission.submittedAt?.toDate()
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/dashboard/grade/${submission.id}`}>
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          startContent={<CheckSquareIcon size={16} />}
                        >
                          Grade
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <CheckSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">
                  No pending submissions
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  All submissions have been graded.
                </p>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
