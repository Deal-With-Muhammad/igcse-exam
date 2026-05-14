import { SignInForm } from "@/components/auth/sign-in-form";
import { SCHOOL_FULL_NAME } from "@/lib/constants";
import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import Image from "next/image";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-3">
          <Image src="/logo.png" alt="logo" width={64} height={64} className="rounded-full" priority />
          <div className="text-center">
            <h1 className="text-xl font-bold">{SCHOOL_FULL_NAME}</h1>
            <p className="text-sm text-default-500">Sign in to your teacher / admin account</p>
          </div>
        </CardHeader>
        <Divider className="mx-6" />
        <CardBody className="py-6 px-6">
          <Suspense fallback={null}>
            <SignInForm />
          </Suspense>
        </CardBody>
      </Card>
    </main>
  );
}
