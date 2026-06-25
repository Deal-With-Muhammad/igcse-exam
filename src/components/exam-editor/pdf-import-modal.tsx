"use client";

import {
  Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Select, SelectItem, Checkbox, Chip, Accordion, AccordionItem, Spinner,
} from "@heroui/react";
import { FileUp, FileText, AlertTriangle, Plus } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import { changeQuestionType, makeQuestion } from "@/lib/exam/factory";
import { questionImages } from "@/lib/exam/images";
import { extractPdfText } from "@/lib/exam/pdf-extract";
import { smartParse } from "@/lib/exam/smart-parse";
import { htmlToPlainText } from "@/lib/rich-text/html";
import type { Question, QuestionType } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Question[]) => void;
}

interface Item {
  q: Question;
  include: boolean;
}

const TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];

export function PdfImportModal({ isOpen, onClose, onImport }: Props) {
  const [stage, setStage] = useState<"upload" | "review">("upload");
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [unparsed, setUnparsed] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setStage("upload");
    setBusy(false);
    setFileName("");
    setItems([]);
    setUnparsed([]);
  };

  const close = () => { reset(); onClose(); };

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please choose a PDF file");
      return;
    }
    setFileName(file.name);
    setBusy(true);
    try {
      const { text } = await extractPdfText(file);
      if (!text.trim()) {
        toast.error("No text found — this looks like a scanned PDF (no embedded text).");
        setBusy(false);
        return;
      }
      const result = smartParse(text);
      setItems(result.questions.map((q) => ({ q, include: true })));
      setUnparsed(result.unparsed);
      setStage("review");
      if (result.questions.length === 0) {
        toast("No questions auto-detected — review the unparsed text below.", { icon: "⚠️" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't read this PDF. It may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  };

  const setType = (i: number, type: QuestionType) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, q: changeQuestionType(it.q, type) } : it)));
  };
  const toggle = (i: number, include: boolean) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, include } : it)));
  };
  const addUnparsed = (blockIndex: number, type: QuestionType) => {
    const q = makeQuestion(type);
    q.text = unparsed[blockIndex].replace(/^\s*(?:Q(?:uestion)?\.?\s*)?\d{1,3}\s*[.)\-:]\s*/i, "").trim();
    setItems((arr) => [...arr, { q, include: true }]);
    setUnparsed((arr) => arr.filter((_, idx) => idx !== blockIndex));
  };

  const selectedCount = items.filter((it) => it.include).length;

  const doImport = () => {
    const chosen = items.filter((it) => it.include).map((it) => it.q);
    if (chosen.length === 0) { toast.error("Select at least one question"); return; }
    onImport(chosen);
    toast.success(`Imported ${chosen.length} question${chosen.length === 1 ? "" : "s"}`);
    close();
  };

  const counts = items.reduce<Record<string, number>>((acc, it) => {
    if (it.include) acc[it.q.type] = (acc[it.q.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Modal isOpen={isOpen} onClose={close} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-0">
          <span>Import from PDF</span>
          <span className="text-xs font-normal text-default-500">Auto-detects MCQ, true/false, fill-in-the-blank, short & long answers</span>
        </ModalHeader>

        {stage === "upload" && (
          <ModalBody className="py-6">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              className={`w-full flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed rounded-xl transition-colors disabled:opacity-60 ${dragOver ? "border-primary bg-primary-50/40" : "border-default-300 hover:border-primary hover:bg-default-50"}`}
            >
              {busy ? (
                <>
                  <Spinner size="lg" />
                  <p className="text-sm text-default-500">Reading {fileName || "PDF"}…</p>
                </>
              ) : (
                <>
                  <FileUp size={36} className="text-default-400" />
                  <p className="text-sm font-medium">Click to choose a PDF, or drop one here</p>
                  <p className="text-xs text-default-500">Questions are detected automatically — you review before importing</p>
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <p className="text-xs text-default-400 text-center">Works on text-based PDFs. Scanned/photo PDFs have no selectable text and can&apos;t be read.</p>
          </ModalBody>
        )}

        {stage === "review" && (
          <ModalBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <FileText size={16} className="text-default-500" />
              <span className="font-medium truncate max-w-[200px]">{fileName}</span>
              <Chip size="sm" color="success" variant="flat">{selectedCount} selected</Chip>
              {TYPES.filter((t) => counts[t]).map((t) => (
                <Chip key={t} size="sm" variant="flat">{counts[t]} {QUESTION_TYPE_LABELS[t]}</Chip>
              ))}
            </div>

            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((it, i) => {
                  const plain = htmlToPlainText(it.q.text);
                  const imgs = questionImages(it.q).length;
                  const opts = it.q.type === "mcq" ? it.q.options.filter((o) => o.trim()).length : 0;
                  return (
                    <div key={it.q.id} className={`flex items-start gap-3 p-3 rounded-lg border ${it.include ? "border-default-200" : "border-default-100 opacity-60"}`}>
                      <Checkbox isSelected={it.include} onValueChange={(v) => toggle(i, v)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{plain || <span className="italic text-default-400">No text</span>}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-default-500">
                          {it.q.type === "mcq" && <span>{opts} options</span>}
                          {imgs > 0 && <span>· {imgs} image{imgs === 1 ? "" : "s"}</span>}
                          <span>· {it.q.points} mark{it.q.points === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                      <Select
                        aria-label="Question type"
                        size="sm"
                        selectedKeys={[it.q.type]}
                        onChange={(e) => e.target.value && setType(i, e.target.value as QuestionType)}
                        className="w-40 flex-shrink-0"
                      >
                        {TYPES.map((t) => <SelectItem key={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>)}
                      </Select>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-default-500">No questions were auto-detected. You can still add the unparsed text below manually.</div>
            )}

            {unparsed.length > 0 && (
              <Accordion variant="bordered" isCompact>
                <AccordionItem
                  key="unparsed"
                  aria-label="Could not parse"
                  title={
                    <span className="flex items-center gap-2 text-sm">
                      <AlertTriangle size={15} className="text-warning" />
                      Could not parse ({unparsed.length})
                    </span>
                  }
                >
                  <div className="space-y-2">
                    <p className="text-xs text-default-500">These blocks didn&apos;t match a known question shape. Add them manually as a type, or skip and add them later.</p>
                    {unparsed.map((block, i) => (
                      <div key={i} className="p-2 rounded border border-warning-200 bg-warning-50/40 dark:bg-warning-100/10">
                        <p className="text-xs whitespace-pre-wrap line-clamp-4 text-default-600">{block}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {TYPES.map((t) => (
                            <Button key={t} size="sm" variant="flat" startContent={<Plus size={12} />} onPress={() => addUnparsed(i, t)}>
                              {QUESTION_TYPE_LABELS[t]}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionItem>
              </Accordion>
            )}
          </ModalBody>
        )}

        <ModalFooter>
          {stage === "review" && <Button variant="light" onPress={reset}>Choose another PDF</Button>}
          <Button variant="light" onPress={close}>Cancel</Button>
          {stage === "review" && (
            <Button color="primary" onPress={doImport} isDisabled={selectedCount === 0}>
              Import {selectedCount} question{selectedCount === 1 ? "" : "s"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
