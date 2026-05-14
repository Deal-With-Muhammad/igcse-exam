"use client";

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Textarea } from "@heroui/react";
import { useState } from "react";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import { parseBulk } from "@/lib/exam/bulk-parse";
import type { Question, QuestionType } from "@/types";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Question[]) => void;
}

const EXAMPLE: Record<QuestionType, string> = {
  mcq: `* What is 2 + 2?\nA) 3\nB) 4\nC) 5\nD) 6\n* Capital of France?\nA) Paris\nB) Madrid`,
  truefalse: `* The Earth is flat\n* Water boils at 100 °C`,
  fillblank: `* The capital of France is __.\nAnswer: Paris\n* H2O is __.\nAnswer: water`,
  short: `* Define osmosis.\n* State Newton's first law.`,
  long: `* Explain photosynthesis in detail.\n* Discuss causes of WW1.`,
};

export function BulkImportModal({ isOpen, onClose, onImport }: Props) {
  const [type, setType] = useState<QuestionType>("mcq");
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) { toast.error("Paste questions first"); return; }
    const parsed = parseBulk(text, type);
    if (parsed.length === 0) { toast.error("Couldn't parse. Make sure each question starts with * or a number"); return; }
    onImport(parsed);
    toast.success(`Imported ${parsed.length} questions`);
    setText("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>Bulk Import Questions</ModalHeader>
        <ModalBody className="space-y-3">
          <Select label="Question type" selectedKeys={[type]} onChange={(e) => setType((e.target.value || "mcq") as QuestionType)}>
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
              <SelectItem key={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>
            ))}
          </Select>
          <div className="bg-default-50 dark:bg-default-100/30 p-3 rounded text-xs">
            <p className="font-semibold mb-1">Format</p>
            <p>Start each question with <code>*</code> or a number followed by <code>.</code> or <code>)</code></p>
            <pre className="mt-2 bg-default-100 dark:bg-default-200/30 p-2 rounded overflow-x-auto whitespace-pre-wrap">{EXAMPLE[type]}</pre>
          </div>
          <Textarea
            label="Paste questions"
            placeholder="Paste your questions here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            minRows={10}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={submit}>Import</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
