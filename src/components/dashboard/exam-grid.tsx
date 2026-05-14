"use client";

import { Card, CardBody, CardHeader, Divider, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import Link from "next/link";
import { Edit, Trash2, MoreVertical, FileText, Eye, Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export interface ExamRow {
  id: string;
  share_code: string;
  title: string;
  subject: string;
  level: string;
  curriculum: string;
  total_marks: number;
  created_at: string;
  created_by: string;
  questions: unknown[];
}

export function ExamGrid({ exams, onChange }: { exams: ExamRow[]; onChange: (e: ExamRow[]) => void }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [toDelete, setToDelete] = useState<ExamRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const onDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("exams").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) {
      toast.error("Delete failed: " + error.message);
      return;
    }
    onChange(exams.filter((e) => e.id !== toDelete.id));
    toast.success(`Deleted "${toDelete.title}"`);
    setToDelete(null);
    onClose();
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (exams.length === 0) {
    return (
      <Card className="text-center p-8 mt-4">
        <CardBody className="items-center">
          <FileText className="h-12 w-12 text-default-300 mb-3" />
          <h3 className="text-lg font-medium">No exams yet</h3>
          <p className="text-sm text-default-500 mb-4">Create your first exam to get started</p>
          <Link href="/dashboard/exams/new">
            <Button color="primary">Create Exam</Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">{exam.title}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Chip size="sm" variant="flat" color="primary">{exam.curriculum.toUpperCase()}</Chip>
                  {exam.subject && <Chip size="sm" variant="flat" color="secondary">{exam.subject}</Chip>}
                  {exam.level && <Chip size="sm" variant="flat">{exam.level}</Chip>}
                </div>
              </div>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" size="sm"><MoreVertical size={16} /></Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Exam actions">
                  <DropdownItem key="view" href={`/dashboard/exams/${exam.id}`} startContent={<Eye size={16} />}>View</DropdownItem>
                  <DropdownItem key="edit" href={`/dashboard/exams/${exam.id}/edit`} startContent={<Edit size={16} />}>Edit</DropdownItem>
                  <DropdownItem key="pdf" href={`/dashboard/exams/${exam.id}/pdf`} startContent={<Download size={16} />}>Export PDF</DropdownItem>
                  <DropdownItem key="delete" color="danger" className="text-danger" startContent={<Trash2 size={16} />} onPress={() => { setToDelete(exam); onOpen(); }}>Delete</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </CardHeader>
            <Divider />
            <CardBody className="text-sm">
              <div className="flex justify-between items-center gap-2">
                <div className="text-xs text-default-500">
                  <p>{exam.questions?.length || 0} questions · {exam.total_marks || 0} marks</p>
                  <p className="mt-1">Created {new Date(exam.created_at).toLocaleDateString()}</p>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  color={copiedId === exam.share_code ? "success" : "primary"}
                  startContent={copiedId === exam.share_code ? <Check size={14} /> : <Copy size={14} />}
                  onPress={() => copyCode(exam.share_code)}
                  className="font-mono"
                >
                  {exam.share_code}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Delete exam?</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete <strong>{toDelete?.title}</strong>?</p>
            <p className="text-sm text-danger">All student submissions will also be deleted.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button color="danger" onPress={onDelete} isLoading={deleting} startContent={<Trash2 size={16} />}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
