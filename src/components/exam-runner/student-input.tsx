"use client";

import { Input, Textarea } from "@heroui/react";
import { useRef, useImperativeHandle, forwardRef } from "react";
import { SymbolPicker } from "@/components/exam-editor/symbol-picker";
import { FormulaPicker } from "@/components/exam-editor/formula-picker";

interface BaseProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export interface StudentInputHandle {
  focus: () => void;
}

export const StudentLineInput = forwardRef<StudentInputHandle, BaseProps>(function StudentLineInput(
  { value, onChange, placeholder },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  const insertAtCursor = (text: string) => {
    const el = inputRef.current;
    if (!el) { onChange(value + text); return; }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div>
      <Input
        ref={inputRef as React.Ref<HTMLInputElement>}
        placeholder={placeholder ?? "Type your answer..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        variant="bordered"
        size="lg"
      />
      <div className="flex flex-wrap gap-1 mt-2">
        <SymbolPicker onInsert={insertAtCursor} />
        <FormulaPicker onInsert={insertAtCursor} />
      </div>
    </div>
  );
});

export const StudentTextarea = forwardRef<StudentInputHandle, BaseProps & { minRows?: number }>(function StudentTextarea(
  { value, onChange, placeholder, minRows = 6 },
  ref,
) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  useImperativeHandle(ref, () => ({ focus: () => taRef.current?.focus() }));

  const insertAtCursor = (text: string) => {
    const el = taRef.current;
    if (!el) { onChange(value + text); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div>
      <Textarea
        ref={taRef as React.Ref<HTMLTextAreaElement>}
        placeholder={placeholder ?? "Type your answer..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minRows={minRows}
        variant="bordered"
      />
      <div className="flex flex-wrap gap-1 mt-2">
        <SymbolPicker onInsert={insertAtCursor} />
        <FormulaPicker onInsert={insertAtCursor} />
      </div>
    </div>
  );
});
