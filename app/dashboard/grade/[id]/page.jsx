"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Textarea,
  Progress,
  Chip,
} from "@nextui-org/react";
import { ArrowLeftIcon, CheckIcon, SaveIcon } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function GradeSubmission({ params }) {
  const router = useRouter();
  const { id } = params;
  const [submission, setSubmission] = useState(null);
  const [exam, setExam] = useState(null);
  const [grades, setGrades] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        // Fetch submission details
        const submissionDoc = await getDoc(doc(db, "submissions", id));
        if (!submissionDoc.exists()) {
          alert("Submission not found");
          router.push("/dashboard");
          return;
        }

        const submissionData = {
          id: submissionDoc.id,
          ...submissionDoc.data(),
        };
        setSubmission(submissionData);

        // Fetch exam details
        const examDoc = await getDoc(doc(db, "exams", submissionData.examId));
        if (!examDoc.exists()) {
          alert("Exam not found");
          router.push("/dashboard");
          return;
        }

        const examData = { id: examDoc.id, ...examDoc.data() };
        setExam(examData);

        // Initialize grades and comments
        if (submissionData.graded) {
          setGrades(submissionData.grades || []);
          setComments(submissionData.comments || []);
          setTotalScore(submissionData.totalScore || 0);
        } else {
          // Initialize with zeros
          const initialGrades = examData.questions.map(() => 0);
          const initialComments = examData.questions.map(() => "");
          setGrades(initialGrades);
          setComments(initialComments);
        }

        // Calculate max possible score
        const maxPossibleScore = examData.questions.reduce(
          (total, q) => total + q.points,
          0
        );
        setMaxScore(maxPossibleScore);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionData();
  }, [id, router]);

  useEffect(() => {
    // Calculate total score whenever grades change
    if (grades.length > 0 && exam) {
      const total = grades.reduce((sum, grade, index) => {
        return sum + (Number(grade) || 0);
      }, 0);
      setTotalScore(total);
    }
  }, [grades, exam]);

  const handleGradeChange = (index, value) => {
    const newGrades = [...grades];
    const maxPoints = exam.questions[index].points;
    // Ensure grade is not more than max points
    newGrades[index] = Math.min(Number(value) || 0, maxPoints);
    setGrades(newGrades);
  };

  const handleCommentChange = (index, value) => {
    const newComments = [...comments];
    newComments[index] = value;
    setComments(newComments);
  };

  const saveGrades = async () => {
    try {
      setSaving(true);

      await updateDoc(doc(db, "submissions", id), {
        grades,
        comments,
        totalScore,
        maxScore,
        graded: true,
        gradedAt: new Date(),
      });

      alert("Grades saved successfully!");
      router.push(`/dashboard/exam/${submission.examId}`);
    } catch (error) {
      console.error("Error saving grades:", error);
      alert("Failed to save grades. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading submission...
      </div>
    );
  }

  if (!submission || !exam) {
    return (
      <div className="container mx-auto p-4 text-center">
        Submission or exam not found
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href={`/dashboard/exam/${submission.examId}`}>
          <Button isIconOnly variant="light" aria-label="Back">
            <ArrowLeftIcon size={20} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-2">Grade Submission</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <h2 className="text-xl font-semibold">{exam.title}</h2>
            <div className="flex gap-2 mt-1">
              <p className="text-small text-default-500">
                Student: {submission.studentName}
              </p>
              <p className="text-small text-default-500">
                Class: {submission.studentClass}
              </p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm">
                Submitted:{" "}
                {new Date(submission.submittedAt?.toDate()).toLocaleString()}
              </p>
            </div>
            <Chip
              color={submission.graded ? "success" : "warning"}
              variant="flat"
            >
              {submission.graded ? "Graded" : "Pending"}
            </Chip>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Current Score</p>
            <div className="flex items-center gap-2">
              <Progress
                value={(totalScore / maxScore) * 100}
                color="primary"
                className="flex-grow"
                showValueLabel={true}
              />
              <span className="font-medium">
                {totalScore}/{maxScore}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-6">
        {exam.questions.map((question, qIndex) => (
          <Card key={qIndex} className="mb-4">
            <CardHeader>
              <div className="flex justify-between w-full">
                <div>
                  <h3 className="font-medium">Question {qIndex + 1}</h3>
                  <p className="text-small text-default-500">
                    {question.type === "mcq"
                      ? "Multiple Choice"
                      : "Long Answer"}{" "}
                    - {question.points} points
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={question.points}
                    value={grades[qIndex]?.toString() || "0"}
                    onChange={(e) => handleGradeChange(qIndex, e.target.value)}
                    className="w-20"
                    endContent={
                      <span className="text-small text-default-500">
                        /{question.points}
                      </span>
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div>
                <p className="font-medium mb-2">Question:</p>
                <p className="text-default-700">{question.text}</p>
              </div>

              <div>
                <p className="font-medium mb-2">Student's Answer:</p>
                {question.type === "mcq" ? (
                  <div>
                    {question.options.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`p-2 rounded mb-2 flex items-center gap-2 ${
                          submission.answers[qIndex] === oIndex
                            ? "bg-primary-50 border border-primary"
                            : "bg-gray-50"
                        } ${
                          question.correctOption === oIndex
                            ? "border-l-4 border-l-success"
                            : ""
                        }`}
                      >
                        {question.correctOption === oIndex && (
                          <CheckIcon size={16} className="text-success" />
                        )}
                        <span>{option}</span>
                      </div>
                    ))}
                    {submission.answers[qIndex] === question.correctOption ? (
                      <Chip color="success" variant="flat" size="sm">
                        Correct Answer
                      </Chip>
                    ) : (
                      <Chip color="danger" variant="flat" size="sm">
                        Incorrect Answer
                      </Chip>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded">
                    <p>{submission.answers[qIndex] || "No answer provided"}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="font-medium mb-2">Feedback:</p>
                <Textarea
                  placeholder="Add feedback or comments for the student"
                  value={comments[qIndex] || ""}
                  onChange={(e) => handleCommentChange(qIndex, e.target.value)}
                  minRows={2}
                />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Button
          color="default"
          variant="flat"
          onClick={() => router.push(`/dashboard/exam/${submission.examId}`)}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          startContent={<SaveIcon size={16} />}
          onClick={saveGrades}
          isLoading={saving}
        >
          Save Grades
        </Button>
      </div>
    </div>
  );
}
