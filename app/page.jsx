import { Button, Card, CardBody, CardHeader, Divider } from "@nextui-org/react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <Card className="max-w-md w-full p-8">
        <CardHeader className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold">ELS IGCSE ICT TEST</h1>
            <p className="text-default-500 text-center mt-1">
              Created by Muhammad Ahmad for ELS IGCSE ICT students
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col gap-6 items-center py-8">
          {/* <div className="flex flex-col gap-2 w-full">
            <Link href="/dashboard" className="w-full">
              <Button color="primary" className="w-full">
                Teacher Dashboard
              </Button>
            </Link>
            <p className="text-xs text-default-500 text-center mt-1">
              Create exams and grade student submissions
            </p>
          </div> */}

          <div className="flex flex-col gap-2 w-full">
            <Link href="/take-exam" className="w-full">
              <Button color="secondary" className="w-full">
                Take an Exam
              </Button>
            </Link>
            <p className="text-xs text-default-500 text-center mt-1">
              Enter an exam code to start your test
            </p>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
