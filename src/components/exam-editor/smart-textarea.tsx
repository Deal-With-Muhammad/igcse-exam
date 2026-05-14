"use client";

import { Textarea } from "@heroui/react";
import { useRef, useImperativeHandle, forwardRef } from "react";
import { SymbolPicker } from "./symbol-picker";
import { FormulaPicker } from "./formula-picker";

export interface SmartTextareaHandle {
  focus: () => void;
}

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
  isRequired?: boolean;
  className?: string;
  showTools?: boolean;
}

export const SmartTextarea = forwardRef<SmartTextareaHandle, Props>(function SmartTextarea(
  { label, placeholder, value, onChange, minRows = 3, isRequired, className, showTools = true },
  ref,
) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  useImperativeHandle(ref, () => ({ focus: () => taRef.current?.focus() }));

  const insertAtCursor = (text: string) => {
    const el = taRef.current;
    if (!el) {
      onChange(value + text);
      return;
    }
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
    <div className={className}>
      <Textarea
        ref={taRef as React.Ref<HTMLTextAreaElement>}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minRows={minRows}
        isRequired={isRequired}
      />
      {showTools && (
        <div className="flex flex-wrap gap-1 mt-2">
          <SymbolPicker onInsert={insertAtCursor} />
          <FormulaPicker onInsert={insertAtCursor} />
        </div>
      )}
    </div>
  );
});
