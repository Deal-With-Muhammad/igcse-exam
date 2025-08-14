"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
} from "@nextui-org/react";
import { ArrowRightIcon } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function TakeExam() {
  const router = useRouter();
  const [examCode, setExamCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const findExam = async () => {
    if (!examCode.trim()) {
      setError("Please enter an exam code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Search for exams with the given code (first 6 characters of the ID)
      const examsRef = collection(db, "exams");
      const examsSnapshot = await getDocs(examsRef);

      const matchingExam = examsSnapshot.docs.find(
        (doc) => doc.id.substring(0, 6) === examCode.trim()
      );

      if (matchingExam) {
        router.push(`/take-exam/${matchingExam.id}`);
      } else {
        setError("Exam not found. Please check the code and try again.");
      }
    } catch (error) {
      console.error("Error finding exam:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold">Take an Exam</h1>
            <p className="text-default-500">
              Enter the exam code provided by your teacher
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="pt-6 pb-8 px-4">
          <div className="space-y-6">
            <Input
              label="Exam Code"
              placeholder="Enter 6-digit code"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  findExam();
                }
              }}
              isInvalid={!!error}
              errorMessage={error}
              maxLength={6}
            />

            <Button
              color="primary"
              className="w-full"
              endContent={<ArrowRightIcon size={16} />}
              onClick={findExam}
              isLoading={loading}
            >
              Continue
            </Button>

            <div className="text-center">
              <Link href="/" className="text-sm text-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
