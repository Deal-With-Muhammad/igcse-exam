"use client";

import { useEffect } from "react";
import { Card, CardBody, Button } from "@nextui-org/react";
import { CheckCircle, Home } from "lucide-react";
import Link from "next/link";

export default function ExamComplete() {
  useEffect(() => {
    // Clear exam data
    sessionStorage.removeItem("examData");

    // Check if we should close the window (if it's a popup)
    const examSubmitted = sessionStorage.getItem("examSubmitted");

    if (examSubmitted === "true") {
      // Clear the flag
      sessionStorage.removeItem("examSubmitted");

      // Close the window after 2 seconds if it was opened as a popup
      setTimeout(() => {
        if (window.opener && !window.opener.closed) {
          window.close();
        }
      }, 2000);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-md w-full shadow-xl">
        <CardBody className="text-center p-8">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Exam Completed!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your exam has been successfully submitted. You will receive your
            results once they have been graded.
          </p>
          <Link href="/take-exam">
            <Button
              color="primary"
              startContent={<Home size={18} />}
              className="w-full"
            >
              Return to Exam List
            </Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
