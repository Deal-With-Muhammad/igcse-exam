"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  RadioGroup,
  Radio,
  Textarea,
} from "@nextui-org/react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function PreviewExam({ params }) {
  const router = useRouter();
  const { id } = params;
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const examDoc = await getDoc(doc(db, "exams", id));
        if (examDoc.exists()) {
          setExam({ id: examDoc.id, ...examDoc.data() });
        } else {
          alert("Exam not found");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id, router]);

  const goToNextQuestion = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading exam preview...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto p-4 text-center">Exam not found</div>
    );
  }

  const question = exam.questions[currentQuestion];
  const isLastQuestion = currentQuestion === exam.questions.length - 1;
  const isFirstQuestion = currentQuestion === 0;

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center mb-6">
        <Link href={`/dashboard/exam/${id}`}>
          <Button isIconOnly variant="light" aria-label="Back">
            <ArrowLeftIcon size={20} />
          </Button>
        </Link>
        <div className="ml-2">
          <h1 className="text-2xl font-bold">{exam.title} - Preview</h1>
          <p className="text-sm text-default-500">
            This is how students will see your exam
          </p>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-1">
          {exam.questions.map((_, index) => (
            <Button
              key={index}
              size="sm"
              variant={index === currentQuestion ? "solid" : "flat"}
              onClick={() => setCurrentQuestion(index)}
              className="min-w-[40px]"
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <h2 className="text-xl font-medium">
              Question {currentQuestion + 1}
            </h2>
            <p className="text-small text-default-500">
              {question.type === "mcq" ? "Multiple Choice" : "Long Answer"} -{" "}
              {question.points} points
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="p-6">
          <div className="mb-4">
            <p className="text-default-700">{question.text}</p>
          </div>

          <Divider className="my-4" />

          {question.type === "mcq" ? (
            <RadioGroup>
              {question.options.map((option, index) => (
                <Radio
                  key={index}
                  value={index.toString()}
                  description={
                    index === question.correctOption ? "Correct Answer" : ""
                  }
                  color={
                    index === question.correctOption ? "success" : "default"
                  }
                >
                  {option}
                </Radio>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              placeholder="Students will type their answer here..."
              isDisabled
              minRows={5}
            />
          )}
        </CardBody>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="flat"
          startContent={<ArrowLeftIcon size={16} />}
          onClick={goToPreviousQuestion}
          isDisabled={isFirstQuestion}
        >
          Previous
        </Button>

        <Button
          color="primary"
          endContent={<ArrowRightIcon size={16} />}
          onClick={goToNextQuestion}
          isDisabled={isLastQuestion}
        >
          Next Question
        </Button>
      </div>
    </div>
  );
}
