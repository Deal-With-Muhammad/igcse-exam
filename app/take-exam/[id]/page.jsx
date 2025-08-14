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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function ExamRegistration({ params }) {
  const router = useRouter();
  const { id } = params;
  const [exam, setExam] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const examDoc = await getDoc(doc(db, "exams", id));
        if (examDoc.exists()) {
          const examData = { id: examDoc.id, ...examDoc.data() };
          setExam(examData);
        } else {
          setError("Exam not found");
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
        setError("Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id]);

  const startExam = () => {
    if (!studentName.trim()) {
      setError("Please enter your name");
      return;
    }

    setError("");
    onOpen();
  };

  const openExamWindow = () => {
    const examData = {
      exam,
      studentName,
      studentClass,
      studentId,
    };

    // Store exam data in sessionStorage for the new window
    sessionStorage.setItem("examData", JSON.stringify(examData));

    // Open exam in new window
    const examWindow = window.open(
      `/take-exam/${id}/exam-window`,
      "examWindow",
      "width=1200,height=800,scrollbars=yes,resizable=yes,status=no,toolbar=no,menubar=no,location=no"
    );

    if (examWindow) {
      examWindow.focus();
      onOpenChange();

      // Close current window/tab after opening exam window
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      setError("Please allow popups for this site to take the exam");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-96">
          <CardBody className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading exam...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-96">
          <CardBody className="text-center p-8">
            <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-4" />
            <p className="text-danger mb-4">{error}</p>
            <Link href="/take-exam">
              <Button color="primary">Go Back</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <h1 className="text-2xl text-center font-bold">{exam?.title}</h1>
              <p className="text-blue-100">
                Please enter your information to begin
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="pt-6 pb-8 px-6">
            <div className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                isRequired
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium",
                }}
              />

              <Input
                label="Class/Level"
                placeholder="Enter your class or level"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium",
                }}
              />

              <Input
                label="Student ID (Optional)"
                placeholder="Enter your student ID if applicable"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium",
                }}
              />

              {error && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  color="primary"
                  className="w-full font-semibold"
                  size="lg"
                  onClick={startExam}
                  endContent={<ExternalLink size={18} />}
                >
                  Start Exam
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/take-exam"
                  className="text-sm text-primary hover:underline"
                >
                  ← Back to Exam List
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
        hideCloseButton
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Important Exam Instructions
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  <p className="text-sm">
                    <strong>⚠️ Security Notice:</strong> The exam will open in a
                    new window with the following restrictions:
                  </p>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    <li>
                      You cannot minimize or switch away from the exam window
                    </li>
                    <li>
                      For performing practicals, you can minimize the window but
                      you cannot switch to another tab.
                    </li>
                    <li>Make sure you have a stable internet connection</li>
                    <li>Close all unnecessary applications before starting</li>
                  </ul>
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mt-4">
                    <p className="text-warning-800 text-sm font-medium">
                      Once you click "Open Exam Window", you cannot return to
                      this page. Make sure you're ready!
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={openExamWindow}>
                  Open Exam Window
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
