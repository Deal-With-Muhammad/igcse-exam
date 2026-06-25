"use client";

import { Button, Card, CardBody, CardHeader, Divider, Input } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export function ExamCodeEntry() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c.trim().toUpperCase());
  }, [params]);

  const findExam = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { toast.error("Enter a code"); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("exams")
        .select("id, is_draft")
        .eq("share_code", trimmed)
        .maybeSingle();
      if (error) { toast.error(error.message); return; }
      if (!data || data.is_draft) { toast.error("Exam not found — check the code"); return; }
      router.push(`/take-exam/${data.id}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="flex-col items-center gap-1 pt-8">
          <h1 className="text-2xl font-bold">Take an Exam</h1>
          <p className="text-sm text-default-500">Enter the code from your teacher</p>
        </CardHeader>
        <Divider className="mx-6" />
        <CardBody className="pt-6 pb-8 px-6 space-y-4">
          <Input
            label="Exam code"
            placeholder="e.g. ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && findExam()}
            size="lg"
            variant="bordered"
            classNames={{ input: "uppercase tracking-widest text-center text-lg font-mono" }}
            maxLength={8}
            autoFocus
          />
          <Button color="primary" size="lg" className="w-full font-semibold" endContent={<ArrowRight size={18} />} onPress={findExam} isLoading={loading}>
            Continue
          </Button>
          <div className="text-center text-sm">
            <Link href="/" className="text-default-500 hover:text-default-700">← Back to home</Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
