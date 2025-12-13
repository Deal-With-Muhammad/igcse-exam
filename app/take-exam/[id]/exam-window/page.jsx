"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Textarea,
  RadioGroup,
  Radio,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Input,
} from "@nextui-org/react";
import {
  ArrowLeftIcon,
  SendIcon,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ExamWindow({ params }) {
  const router = useRouter();
  const { id } = params;
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds grace period
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [examTerminated, setExamTerminated] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [switchLog, setSwitchLog] = useState([]);
  const {
    isOpen: isTerminateOpen,
    onOpen: onTerminateOpen,
    onOpenChange: onTerminateOpenChange,
  } = useDisclosure();
  const {
    isOpen: isWarningOpen,
    onOpen: onWarningOpen,
    onClose: onWarningClose,
  } = useDisclosure();

  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);

  useEffect(() => {
    // Get exam data from sessionStorage
    const storedData = sessionStorage.getItem("examData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setExamData(data);
      setAnswers(
        data.exam.questions.map((q) => {
          if (q.type === "mcq" || q.type === "truefalse") return "";
          if (q.type === "fillblank") return "";
          return ""; // long-answer
        })
      );
    } else {
      // Redirect if no exam data
      window.close();
    }

    // Prevent right-click context menu
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    // Prevent certain keyboard shortcuts
    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "r") ||
        e.key === "F5"
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    const handleFocus = () => {
      const focusTime = new Date().toISOString();
      console.log("[v0] Window focused at:", focusTime);

      // Log the focus event
      setSwitchLog((prev) => [
        ...prev,
        {
          event: "focus",
          timestamp: focusTime,
          timeAway: timeLeft < 60 ? 60 - timeLeft : 0,
        },
      ]);

      setIsWindowFocused(true);
      setTimeLeft(60); // Reset timer when window regains focus
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Close warning modal when they return
      onWarningClose();
    };

    const handleBlur = () => {
      const blurTime = new Date().toISOString();
      console.log("[v0] Window lost focus at:", blurTime);

      setIsWindowFocused(false);
      const newWarningCount = warnings + 1;
      setWarnings(newWarningCount);

      // Log the blur/switch event
      setSwitchLog((prev) => [
        ...prev,
        {
          event: "blur",
          timestamp: blurTime,
          warningNumber: newWarningCount,
        },
      ]);

      // Show warning modal immediately
      onWarningOpen();

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            terminateExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("[v0] Tab/window hidden");
        handleBlur();
      } else {
        console.log("[v0] Tab/window visible");
        handleFocus();
      }
    };

    // Prevent window closing without confirmation
    const handleBeforeUnload = (e) => {
      if (!examTerminated) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (warningTimerRef.current) {
        clearInterval(warningTimerRef.current);
      }
    };
  }, [warnings, examTerminated]);

  const terminateExam = () => {
    console.log("[v0] Exam terminated due to exceeding time away");
    setExamTerminated(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Log termination event
    setSwitchLog((prev) => [
      ...prev,
      {
        event: "terminated",
        timestamp: new Date().toISOString(),
        reason: "Exceeded 60 seconds away from exam window",
      },
    ]);

    onWarningClose();
    onTerminateOpen();
  };

  const handleAnswerChange = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestion < examData.exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // In your exam window component, update the submission saving part:
  const submitExam = async () => {
    try {
      setIsSubmitting(true);

      const submissionData = {
        examId: exam.id,
        examTitle: exam.title,
        studentName,
        studentClass,
        branch, // Add branch here
        branchName: branches.find((b) => b.key === branch)?.label || branch, // Add branch name
        answers,
        submittedAt: serverTimestamp(),
        warnings: warnings.length,
        switchLog: switchLogs,
        totalSwitches: totalSwitches,
        terminated: isTerminated,
        graded: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "submissions"), submissionData);

      // Clear session storage
      sessionStorage.removeItem("examData");

      // Show success message briefly then close window
      setTimeout(() => {
        window.close();
      }, 1500);

      // Redirect to completion page (will show briefly before window closes)
      window.location.href = "/take-exam/complete";
    } catch (error) {
      console.error("Error submitting exam:", error);
      setSubmitting(false);
      setExamTerminated(false);
    }
  };

  if (!examData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardBody className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading exam...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { exam } = examData;
  const question = exam.questions[currentQuestion];
  const isLastQuestion = currentQuestion === exam.questions.length - 1;
  const isFirstQuestion = currentQuestion === 0;
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">{exam.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Student: {examData.studentName}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {isWindowFocused ? (
                    <Eye className="h-4 w-4 text-success" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-danger" />
                  )}
                  <span className="text-sm">
                    {isWindowFocused ? "Focused" : `Focus lost: ${timeLeft}s`}
                  </span>
                </div>
                {warnings > 0 && (
                  <Chip color="warning" size="sm">
                    Warnings: {warnings}
                  </Chip>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 px-4 py-2">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Question {currentQuestion + 1} of {exam.questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} color="primary" className="w-full" />
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b">
          <div className="container mx-auto">
            <div className="flex gap-1 overflow-x-auto pb-2">
              {exam.questions.map((_, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={index === currentQuestion ? "solid" : "flat"}
                  color={answers[index] !== "" ? "success" : "default"}
                  onClick={() => setCurrentQuestion(index)}
                  className="min-w-[40px] flex-shrink-0"
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto p-4 max-w-4xl">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start w-full">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Question {currentQuestion + 1}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {question.text}
                  </p>
                </div>
                <Chip
                  color={
                    question.type === "mcq"
                      ? "primary"
                      : question.type === "truefalse"
                      ? "secondary"
                      : question.type === "fillblank"
                      ? "success"
                      : "default"
                  }
                  variant="flat"
                  size="sm"
                >
                  {question.type === "mcq"
                    ? "Multiple Choice"
                    : question.type === "truefalse"
                    ? "True/False"
                    : question.type === "fillblank"
                    ? "Fill in the Blank"
                    : "Long Answer"}
                </Chip>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-6">
              {question.type === "mcq" ? (
                <RadioGroup
                  value={answers[currentQuestion]?.toString()}
                  onValueChange={(value) =>
                    handleAnswerChange(Number.parseInt(value))
                  }
                  classNames={{
                    wrapper: "gap-3",
                  }}
                >
                  {question.options.map((option, index) => (
                    <Radio
                      key={index}
                      value={index.toString()}
                      classNames={{
                        base: "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-primary",
                        label: "text-sm",
                      }}
                    >
                      {option}
                    </Radio>
                  ))}
                </RadioGroup>
              ) : question.type === "truefalse" ? (
                <RadioGroup
                  value={answers[currentQuestion]?.toString()}
                  onValueChange={handleAnswerChange}
                  classNames={{
                    wrapper: "gap-3",
                  }}
                >
                  <Radio
                    value="true"
                    classNames={{
                      base: "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-success",
                      label: "text-sm",
                    }}
                  >
                    True
                  </Radio>
                  <Radio
                    value="false"
                    classNames={{
                      base: "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-danger",
                      label: "text-sm",
                    }}
                  >
                    False
                  </Radio>
                </RadioGroup>
              ) : question.type === "fillblank" ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fill in the blank with your answer:
                  </p>
                  <Input
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion] || ""}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    variant="bordered"
                    size="lg"
                    classNames={{
                      input: "text-base",
                    }}
                  />
                </div>
              ) : (
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  minRows={6}
                  variant="bordered"
                  classNames={{
                    input: "text-sm",
                  }}
                />
              )}
            </CardBody>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="flat"
              startContent={<ArrowLeftIcon size={16} />}
              onClick={goToPreviousQuestion}
              isDisabled={isFirstQuestion}
            >
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                color="success"
                endContent={<SendIcon size={16} />}
                onClick={submitExam}
                isLoading={submitting}
                size="lg"
              >
                Submit Exam
              </Button>
            ) : (
              <Button color="primary" onClick={goToNextQuestion} size="lg">
                Next Question
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isWarningOpen}
        isDismissable={false}
        hideCloseButton
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Warning: Focus Lost
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-base font-medium">
                You have switched away from the exam window!
              </p>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <p className="text-warning-800 text-sm mb-2">
                  <strong>Time remaining before auto-termination:</strong>
                </p>
                <p className="text-3xl font-bold text-warning-800 text-center">
                  {timeLeft}s
                </p>
              </div>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">•</span>
                  <span>Return to the exam window immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">•</span>
                  <span>
                    If you stay away for more than 60 seconds, your exam will be
                    terminated
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">•</span>
                  <span>Warning #{warnings} recorded</span>
                </li>
              </ul>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Termination Modal */}
      <Modal
        isOpen={isTerminateOpen}
        isDismissable={false}
        hideCloseButton
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
              Exam Terminated
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="text-center space-y-3">
              <p className="text-lg font-medium">
                Your exam has been automatically terminated.
              </p>
              <p className="text-sm text-gray-600">
                You left the exam window for more than 1 minute, which violates
                the exam security policy.
              </p>
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-danger-800 text-sm">
                  Total warnings received: <strong>{warnings}</strong>
                </p>
                <p className="text-danger-800 text-sm mt-1">
                  Total switches:{" "}
                  <strong>
                    {switchLog.filter((log) => log.event === "blur").length}
                  </strong>
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="justify-center">
            <Button color="primary" onPress={() => window.close()}>
              Close Window
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
