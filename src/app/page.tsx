import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { GraduationCap, KeyRound } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SCHOOL_FULL_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-2">
          <Image src="/logo.png" alt="logo" width={80} height={80} className="rounded-full" priority />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">{SCHOOL_FULL_NAME}</h1>
            <p className="text-sm text-default-500 mt-1">Online Examination Portal</p>
          </div>
        </CardHeader>
        <Divider className="mx-6" />
        <CardBody className="flex flex-col gap-3 items-center py-8 px-6">
          <Link href="/take-exam" className="w-full">
            <Button color="primary" size="lg" className="w-full font-semibold" startContent={<KeyRound size={18} />}>
              Take an Exam
            </Button>
          </Link>
          <p className="text-xs text-default-500 text-center -mt-1">
            Enter the exam code from your teacher
          </p>

          <Divider className="my-2" />

          <Link href="/sign-in" className="w-full">
            <Button color="secondary" variant="flat" size="lg" className="w-full font-medium" startContent={<GraduationCap size={18} />}>
              Teacher / Admin Sign In
            </Button>
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
