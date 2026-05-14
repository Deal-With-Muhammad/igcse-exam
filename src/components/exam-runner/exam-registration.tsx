"use client";

import { Button, Card, CardBody, CardHeader, Chip, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from "@heroui/react";
import { AlertTriangle, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Exam } from "@/types";
import { BRANCHES } from "@/lib/constants";
import toast from "react-hot-toast";

export function ExamRegistration({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [branch, setBranch] = useState("");
  const dlg = useDisclosure();

  const branchObj = BRANCHES.find((b) => b.key === branch);

  const begin = () => {
    if (!name.trim()) { toast.error("Enter your name"); return; }
    if (!cls.trim()) { toast.error("Enter your class"); return; }
    if (!branch) { toast.error("Select your branch"); return; }
    dlg.onOpen();
  };

  const openExam = () => {
    sessionStorage.setItem(
      "exam:registration",
      JSON.stringify({
        examId: exam.id,
        studentName: name.trim(),
        studentClass: cls.trim(),
        branch,
        branchName: branchObj?.label ?? branch,
        startedAt: Date.now(),
      }),
    );
    router.push(`/take-exam/${exam.id}/run`);
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <Card className="max-w-lg w-full shadow-2xl">
          <CardHeader className="flex-col gap-2 pt-6">
            <h1 className="text-xl text-center font-bold">{exam.title}</h1>
            <div className="flex flex-wrap gap-1 justify-center">
              <Chip size="sm" color="primary" variant="flat">{exam.curriculum.toUpperCase()}</Chip>
              <Chip size="sm" color="secondary" variant="flat">{exam.subject}</Chip>
              {exam.level && <Chip size="sm" variant="flat">{exam.level}</Chip>}
              <Chip size="sm" color="warning" variant="flat" startContent={<Clock size={12} />}>{exam.time_limit_minutes} min</Chip>
              <Chip size="sm" color="success" variant="flat">{exam.total_marks} marks</Chip>
            </div>
          </CardHeader>
          <Divider className="mx-6" />
          <CardBody className="pt-6 pb-8 px-6 space-y-4">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} isRequired variant="bordered" />
            <Input label="Class / Level" value={cls} onChange={(e) => setCls(e.target.value)} isRequired variant="bordered" />
            <Select label="Branch" selectedKeys={branch ? [branch] : []} onChange={(e) => setBranch(e.target.value)} isRequired variant="bordered">
              {BRANCHES.map((b) => <SelectItem key={b.key}>{b.label}</SelectItem>)}
            </Select>
            <Button color="primary" size="lg" className="w-full font-semibold" endContent={<ExternalLink size={16} />} onPress={begin}>
              Start Exam
            </Button>
            <div className="text-center text-sm">
              <Link href="/take-exam" className="text-default-500 hover:text-default-700">← Use a different code</Link>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={dlg.isOpen} onClose={dlg.onClose} isDismissable={false} placement="center">
        <ModalContent>
          <ModalHeader className="flex gap-2 items-center"><AlertTriangle size={20} className="text-warning" /> Before you begin</ModalHeader>
          <ModalBody>
            <ul className="text-sm space-y-2 list-disc ml-4">
              <li>Do not switch tabs or minimise the window — repeated switching will terminate your exam</li>
              <li>Your answers are auto-saved to this device every few seconds</li>
              <li>If you accidentally close the window, you can resume by re-entering the code</li>
              <li>Make sure you have a stable internet connection</li>
            </ul>
            <div className="mt-3 p-3 bg-default-50 dark:bg-default-100/30 rounded text-sm">
              <p className="font-medium mb-1">Your info</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div><span className="text-default-500">Name:</span> {name}</div>
                <div><span className="text-default-500">Class:</span> {cls}</div>
                <div className="col-span-2"><span className="text-default-500">Branch:</span> {branchObj?.label}</div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={dlg.onClose}>Cancel</Button>
            <Button color="primary" onPress={openExam}>I&apos;m ready — Start</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
