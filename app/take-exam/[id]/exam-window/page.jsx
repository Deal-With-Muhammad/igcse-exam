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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);

  useEffect(() => {
    // Get exam data from sessionStorage
    const storedData = sessionStorage.getItem("examData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setExamData(data);
      setAnswers(data.exam.questions.map(() => ""));
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

    // Window focus/blur detection
    const handleFocus = () => {
      setIsWindowFocused(true);
      setTimeLeft(60); // Reset timer when window regains focus
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleBlur = () => {
      setIsWindowFocused(false);
      setWarnings((prev) => prev + 1);

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

    // Prevent window closing without confirmation
    const handleBeforeUnload = (e) => {
      if (!examTerminated) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("focus", handleFocus);
    // window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("focus", handleFocus);
      // window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (warningTimerRef.current) {
        clearInterval(warningTimerRef.current);
      }
    };
  }, [examTerminated]);

  const terminateExam = () => {
    setExamTerminated(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onOpen();
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

  const submitExam = async () => {
    try {
      setExamTerminated(true); // Add this line to disable beforeunload warning
      setSubmitting(true);

      const submissionData = {
        examId: id,
        examTitle: examData.exam.title,
        studentName: examData.studentName,
        studentClass: examData.studentClass,
        studentId: examData.studentId,
        answers,
        submittedAt: serverTimestamp(),
        graded: false,
        warnings: warnings,
        completed: true,
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
      setExamTerminated(false); // Reset if submission fails
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
                  color={question.type === "mcq" ? "primary" : "secondary"}
                  variant="flat"
                  size="sm"
                >
                  {question.type === "mcq" ? "Multiple Choice" : "Long Answer"}
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

      {/* Termination Modal */}
      <Modal isOpen={isOpen} isDismissable={false} hideCloseButton size="md">
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
