"use client";

import { Button, Card, CardBody } from "@heroui/react";
import { CheckCircle, Home } from "lucide-react";
import Link from "next/link";

export default function CompletePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
      <Card className="max-w-md w-full shadow-xl">
        <CardBody className="text-center p-8">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Exam Submitted!</h1>
          <p className="text-default-500 mb-6">
            Your answers have been recorded. You will receive your results once they have been graded by your teacher.
          </p>
          <Link href="/">
            <Button color="primary" startContent={<Home size={18} />} className="w-full">Return Home</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
