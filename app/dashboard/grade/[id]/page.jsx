"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  ArrowLeftIcon,
  CheckIcon,
  SaveIcon,
  AlertTriangleIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircle,
  EditIcon,
} from "lucide-react";
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
  const [manualOverride, setManualOverride] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  // Refs for scrolling to questions
  const questionRefs = useRef([]);

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

        // Calculate grades (whether saved or not)
        let calculatedGrades;
        let calculatedComments;
        let calculatedManualOverride;

        if (submissionData.graded && submissionData.grades) {
          // Use saved grades if already graded
          calculatedGrades = submissionData.grades;
          calculatedComments = submissionData.comments || [];

          // Initialize manual override based on saved grades vs auto-calculated
          calculatedManualOverride = examData.questions.map(
            (question, index) => {
              // If it's an auto-graded question type, check if saved grade differs from auto-calculated
              if (["mcq", "truefalse", "fillblank"].includes(question.type)) {
                const studentAnswer = submissionData.answers[index];
                let autoCalculatedGrade = 0;

                if (question.type === "mcq") {
                  autoCalculatedGrade =
                    studentAnswer === question.correctOption
                      ? Number(question.points)
                      : 0;
                } else if (question.type === "truefalse") {
                  const studentBool =
                    studentAnswer === true || studentAnswer === "true";
                  const correctBool =
                    question.correctAnswer === true ||
                    question.correctAnswer === "true";
                  autoCalculatedGrade =
                    studentBool === correctBool ? Number(question.points) : 0;
                } else if (question.type === "fillblank") {
                  const correct = question.correctAnswer?.toLowerCase().trim();
                  const answer = studentAnswer?.toLowerCase().trim();
                  autoCalculatedGrade =
                    correct === answer ? Number(question.points) : 0;
                }

                // If saved grade differs from auto-calculated, mark as manually overridden
                return calculatedGrades[index] !== autoCalculatedGrade;
              }
              return false; // Long answers are always manual
            }
          );
        } else {
          // Auto-calculate grades for objective questions
          calculatedGrades = examData.questions.map((question, index) => {
            const studentAnswer = submissionData.answers[index];

            if (question.type === "mcq") {
              return studentAnswer === question.correctOption
                ? Number(question.points)
                : 0;
            } else if (question.type === "truefalse") {
              // Convert both to boolean for comparison to handle type mismatches
              const studentBool =
                studentAnswer === true || studentAnswer === "true";
              const correctBool =
                question.correctAnswer === true ||
                question.correctAnswer === "true";
              return studentBool === correctBool ? Number(question.points) : 0;
            } else if (question.type === "fillblank") {
              const correct = question.correctAnswer?.toLowerCase().trim();
              const answer = studentAnswer?.toLowerCase().trim();
              return correct === answer ? Number(question.points) : 0;
            } else {
              // Long answer questions need manual grading
              return 0;
            }
          });

          calculatedComments = examData.questions.map(() => "");
          calculatedManualOverride = examData.questions.map(() => false);
        }

        setGrades(calculatedGrades);
        setComments(calculatedComments);
        setManualOverride(
          calculatedManualOverride || examData.questions.map(() => false)
        );

        // Calculate total score
        const total = calculatedGrades.reduce(
          (sum, grade) => sum + (Number(grade) || 0),
          0
        );
        setTotalScore(total);

        // Calculate max possible score
        const maxPossibleScore = examData.questions.reduce(
          (total, q) => total + Number(q.points),
          0
        );
        setMaxScore(maxPossibleScore);

        // Initialize refs array
        questionRefs.current = examData.questions.map(() => null);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionData();
  }, [id, router]);

  const handleGradeChange = (index, value) => {
    const newGrades = [...grades];
    const maxPoints = exam.questions[index].points;

    const numericValue = Math.min(Number(value) || 0, maxPoints);
    newGrades[index] = numericValue;

    setGrades(newGrades);

    // Recalculate total
    const newTotal = newGrades.reduce(
      (sum, grade) => sum + (Number(grade) || 0),
      0
    );
    setTotalScore(newTotal);
  };

  const handleCommentChange = (index, value) => {
    const newComments = [...comments];
    newComments[index] = value;
    setComments(newComments);
  };

  const toggleManualOverride = (index) => {
    const newManualOverride = [...manualOverride];
    newManualOverride[index] = !newManualOverride[index];
    setManualOverride(newManualOverride);

    // If turning off manual override and it's an auto-graded question, recalculate
    if (!newManualOverride[index]) {
      const question = exam.questions[index];
      const studentAnswer = submission.answers[index];

      if (question.type === "mcq") {
        const autoGrade =
          studentAnswer === question.correctOption
            ? Number(question.points)
            : 0;
        handleGradeChange(index, autoGrade);
      } else if (question.type === "truefalse") {
        const studentBool = studentAnswer === true || studentAnswer === "true";
        const correctBool =
          question.correctAnswer === true || question.correctAnswer === "true";
        const autoGrade =
          studentBool === correctBool ? Number(question.points) : 0;
        handleGradeChange(index, autoGrade);
      } else if (question.type === "fillblank") {
        const correct = question.correctAnswer?.toLowerCase().trim();
        const answer = studentAnswer?.toLowerCase().trim();
        const autoGrade = correct === answer ? Number(question.points) : 0;
        handleGradeChange(index, autoGrade);
      }
    }
  };

  const scrollToQuestion = (index) => {
    if (questionRefs.current[index]) {
      questionRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // Add a highlight effect
      questionRefs.current[index].classList.add("ring-4", "ring-warning");
      setTimeout(() => {
        questionRefs.current[index].classList.remove("ring-4", "ring-warning");
      }, 2000);
    }
  };

  const saveGrades = async () => {
    try {
      setSaving(true);

      // Calculate totalScore directly when saving
      const calculatedTotal = grades.reduce((sum, grade) => {
        return sum + (Number(grade) || 0);
      }, 0);

      await updateDoc(doc(db, "submissions", id), {
        grades,
        comments,
        totalScore: calculatedTotal,
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

  const totalWarnings = submission.warnings || 0;
  const totalSwitches = submission.totalSwitches || 0;
  const blurEvents =
    submission.switchLog?.filter((log) => log.event === "blur") || [];

  // Find questions that got 0 marks
  const zeroMarkQuestions = grades
    .map((grade, index) => (grade === 0 ? index : -1))
    .filter((index) => index !== -1);

  const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

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
                value={percentageScore}
                color={percentageScore >= 50 ? "success" : "danger"}
                className="flex-grow"
                showValueLabel={true}
              />
              <span className="font-bold text-lg">
                {totalScore}/{maxScore}
              </span>
            </div>
            <p className="text-sm text-default-500 mt-1">
              {percentageScore.toFixed(1)}%
            </p>
          </div>

          {/* Show questions with 0 marks */}
          {zeroMarkQuestions.length > 0 && (
            <div className="mt-4 p-4 bg-warning-50 rounded-lg border border-warning-200">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle size={20} className="text-warning mt-0.5" />
                <div className="flex-grow">
                  <p className="text-sm font-medium text-warning-800">
                    {zeroMarkQuestions.length} question(s) with 0 marks
                  </p>
                  <p className="text-xs text-warning-700 mt-1">
                    Click to review questions that need attention
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {zeroMarkQuestions.map((qIndex) => (
                  <Button
                    key={qIndex}
                    size="sm"
                    color="warning"
                    variant="flat"
                    onClick={() => scrollToQuestion(qIndex)}
                  >
                    Question {qIndex + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Override Info Banner */}
          <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-start gap-2">
              <EditIcon size={20} className="text-primary mt-0.5" />
              <div className="flex-grow">
                <p className="text-sm font-medium text-primary-800 mb-1">
                  Manual Grading Mode Available
                </p>
                <p className="text-xs text-primary-700">
                  For auto-graded questions (MCQ, True/False,
                  Fill-in-the-blank), click the "Override" button to manually
                  adjust scores.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card
        className={`mb-6 ${
          totalSwitches > 0 ? "border-warning" : "border-success"
        }`}
      >
        <CardHeader
          className={totalSwitches > 0 ? "bg-warning-50" : "bg-success-50"}
        >
          <div className="flex items-center gap-2">
            {totalSwitches > 0 ? (
              <>
                <AlertTriangleIcon size={20} className="text-warning" />
                <h3 className="font-semibold text-warning-700">
                  Window Switch Activity Detected
                </h3>
              </>
            ) : (
              <>
                <CheckCircleIcon size={20} className="text-success" />
                <h3 className="font-semibold text-success-700">
                  No Window Switches Detected
                </h3>
              </>
            )}
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          {totalSwitches > 0 ? (
            <>
              <p className="text-sm text-default-600 mb-3">
                The student switched windows/tabs {totalSwitches} time(s) during
                the exam:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {blurEvents.map((switchEvent, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg border border-warning-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-warning-200 flex items-center justify-center">
                        <span className="text-xs font-bold text-warning-700">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          Warning #{switchEvent.warningNumber}
                        </span>
                        {switchEvent.terminated && (
                          <Chip color="danger" size="sm" variant="flat">
                            Auto-Terminated
                          </Chip>
                        )}
                      </div>
                      <p className="text-xs text-default-500">
                        {new Date(
                          switchEvent.timestamp?.toDate
                            ? switchEvent.timestamp.toDate()
                            : switchEvent.timestamp
                        ).toLocaleString()}
                      </p>
                      {switchEvent.timeAway && (
                        <p className="text-xs text-warning-700 mt-1">
                          Time away: {switchEvent.timeAway}s
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {submission.terminated && (
                <div className="mt-4 p-3 bg-danger-50 rounded-lg border border-danger-200">
                  <div className="flex items-center gap-2">
                    <XIcon size={16} className="text-danger" />
                    <p className="text-sm font-medium text-danger-700">
                      Exam was automatically terminated due to excessive window
                      switching
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-default-600">
                  Total warnings issued: <strong>{totalWarnings}</strong>
                </p>
                <p className="text-sm text-default-600 mt-1">
                  Total window switches: <strong>{totalSwitches}</strong>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <CheckCircleIcon
                size={48}
                className="text-success mx-auto mb-3"
              />
              <p className="text-sm font-medium text-success-700 mb-2">
                Excellent! The student maintained focus throughout the exam.
              </p>
              <div className="mt-4 p-3 bg-success-50 rounded-lg border border-success-200 inline-block">
                <p className="text-sm text-success-800">
                  Total warnings: <strong>{totalWarnings}</strong>
                </p>
                <p className="text-sm text-success-800 mt-1">
                  Total window switches: <strong>{totalSwitches}</strong>
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="space-y-6">
        {exam.questions.map((question, qIndex) => {
          const isAutoGraded = ["mcq", "truefalse", "fillblank"].includes(
            question.type
          );
          const autoCalculatedCorrect =
            isAutoGraded && grades[qIndex] === question.points;
          const gotZero = grades[qIndex] === 0;

          return (
            <Card
              key={qIndex}
              className={`mb-4 transition-all duration-300 ${
                gotZero ? "border-l-4 border-l-warning" : ""
              } ${manualOverride[qIndex] ? "border-r-4 border-r-primary" : ""}`}
              ref={(el) => (questionRefs.current[qIndex] = el)}
            >
              <CardHeader>
                <div className="flex justify-between w-full">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Question {qIndex + 1}</h3>
                      {isAutoGraded && !manualOverride[qIndex] && (
                        <Chip size="sm" color="secondary" variant="flat">
                          Auto-Graded
                        </Chip>
                      )}
                      {manualOverride[qIndex] && (
                        <Chip size="sm" color="primary" variant="flat">
                          <div className="flex items-center gap-1">
                            <EditIcon size={12} />
                            Manual Override
                          </div>
                        </Chip>
                      )}
                      {!isAutoGraded && !manualOverride[qIndex] && (
                        <Chip size="sm" color="warning" variant="flat">
                          Manual Grading
                        </Chip>
                      )}
                      {gotZero && (
                        <Chip size="sm" color="warning" variant="flat">
                          0 Marks
                        </Chip>
                      )}
                    </div>
                    <p className="text-small text-default-500">
                      {question.type === "mcq"
                        ? "Multiple Choice"
                        : question.type === "truefalse"
                        ? "True/False"
                        : question.type === "fillblank"
                        ? "Fill in the Blank"
                        : "Long Answer"}{" "}
                      - {question.points} points
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAutoGraded && (
                      <Button
                        size="sm"
                        variant="flat"
                        color={manualOverride[qIndex] ? "primary" : "default"}
                        onClick={() => toggleManualOverride(qIndex)}
                        className="text-xs h-8"
                        startContent={
                          manualOverride[qIndex] && <EditIcon size={12} />
                        }
                      >
                        {manualOverride[qIndex] ? "Manual" : "Override"}
                      </Button>
                    )}
                    <Input
                      type="number"
                      min={0}
                      max={question.points}
                      value={grades[qIndex]?.toString() || "0"}
                      onChange={(e) =>
                        handleGradeChange(qIndex, e.target.value)
                      }
                      className="w-20"
                      isReadOnly={isAutoGraded && !manualOverride[qIndex]}
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
                              ? !manualOverride[qIndex] && autoCalculatedCorrect
                                ? "bg-success-50 border border-success"
                                : !manualOverride[qIndex] &&
                                  !autoCalculatedCorrect
                                ? "bg-danger-50 border border-danger"
                                : "bg-default-50 border"
                              : "bg-default-50"
                          } ${
                            question.correctOption === oIndex &&
                            !manualOverride[qIndex]
                              ? "border-l-4 border-l-success"
                              : ""
                          }`}
                        >
                          {question.correctOption === oIndex &&
                            !manualOverride[qIndex] && (
                              <CheckIcon size={16} className="text-success" />
                            )}
                          {submission.answers[qIndex] === oIndex &&
                            question.correctOption !== oIndex &&
                            !manualOverride[qIndex] && (
                              <XIcon size={16} className="text-danger" />
                            )}
                          <span>{option}</span>
                        </div>
                      ))}
                      {!manualOverride[qIndex] && (
                        <Chip
                          color={autoCalculatedCorrect ? "success" : "danger"}
                          variant="flat"
                          size="sm"
                        >
                          {autoCalculatedCorrect
                            ? "Correct Answer"
                            : "Incorrect Answer"}
                        </Chip>
                      )}
                    </div>
                  ) : question.type === "truefalse" ? (
                    <div>
                      <div
                        className={`p-3 rounded mb-2 ${
                          !manualOverride[qIndex] && autoCalculatedCorrect
                            ? "bg-success-50 border border-success"
                            : !manualOverride[qIndex] && !autoCalculatedCorrect
                            ? "bg-danger-50 border border-danger"
                            : "bg-default-50 border"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {!manualOverride[qIndex] &&
                            (autoCalculatedCorrect ? (
                              <CheckIcon size={16} className="text-success" />
                            ) : (
                              <XIcon size={16} className="text-danger" />
                            ))}
                          <span className="font-medium">
                            Student answered:{" "}
                            {submission.answers[qIndex] ? "True" : "False"}
                          </span>
                        </div>
                        {!manualOverride[qIndex] && (
                          <p className="text-sm text-default-500 mt-1">
                            Correct answer:{" "}
                            {question.correctAnswer ? "True" : "False"}
                          </p>
                        )}
                      </div>
                      {!manualOverride[qIndex] && (
                        <Chip
                          color={autoCalculatedCorrect ? "success" : "danger"}
                          variant="flat"
                          size="sm"
                        >
                          {autoCalculatedCorrect
                            ? "Correct Answer"
                            : "Incorrect Answer"}
                        </Chip>
                      )}
                    </div>
                  ) : question.type === "fillblank" ? (
                    <div>
                      <div
                        className={`p-3 rounded mb-2 ${
                          !manualOverride[qIndex] && autoCalculatedCorrect
                            ? "bg-success-50 border border-success"
                            : !manualOverride[qIndex] && !autoCalculatedCorrect
                            ? "bg-danger-50 border border-danger"
                            : "bg-default-50 border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {!manualOverride[qIndex] &&
                            (autoCalculatedCorrect ? (
                              <CheckIcon size={16} className="text-success" />
                            ) : (
                              <XIcon size={16} className="text-danger" />
                            ))}
                          <span className="font-medium">Student's answer:</span>
                        </div>
                        <p className="ml-6">
                          {submission.answers[qIndex] || "No answer provided"}
                        </p>
                        {!manualOverride[qIndex] && (
                          <p className="text-sm text-default-500 mt-2 ml-6">
                            Expected: {question.correctAnswer}
                          </p>
                        )}
                      </div>
                      {!manualOverride[qIndex] && (
                        <Chip
                          color={autoCalculatedCorrect ? "success" : "danger"}
                          variant="flat"
                          size="sm"
                        >
                          {autoCalculatedCorrect
                            ? "Correct Answer"
                            : "Incorrect Answer"}
                        </Chip>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p>
                          {submission.answers[qIndex] || "No answer provided"}
                        </p>
                      </div>
                      <Chip
                        color="warning"
                        variant="flat"
                        size="sm"
                        className="mt-2"
                      >
                        Requires Manual Grading
                      </Chip>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-medium mb-2">Feedback:</p>
                  <Textarea
                    placeholder="Add feedback or comments for the student"
                    value={comments[qIndex] || ""}
                    onChange={(e) =>
                      handleCommentChange(qIndex, e.target.value)
                    }
                    minRows={2}
                  />
                </div>
              </CardBody>
            </Card>
          );
        })}
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
          {submission.graded ? "Update Grades" : "Save Grades"}
        </Button>
      </div>
    </div>
  );
}
