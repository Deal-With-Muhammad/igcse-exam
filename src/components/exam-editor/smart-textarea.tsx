"use client";

import { Button, Textarea, Tooltip } from "@heroui/react";
import { useRef, useImperativeHandle, forwardRef } from "react";
import { SymbolPicker } from "./symbol-picker";
import { FormulaPicker } from "./formula-picker";
import { toggleScript } from "@/lib/symbols/super-sub";

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

  // Convert the current selection (or, if nothing is selected, the single
  // character just before the cursor) to super/subscript — toggling back if
  // it's already in that form.
  const applyScript = (kind: "super" | "sub") => {
    const el = taRef.current;
    if (!el) return;
    let start = el.selectionStart;
    const end = el.selectionEnd;
    // No selection: grab the character immediately before the cursor so you
    // can type "x2", then hit the shortcut to turn the 2 into ₂.
    if (start === end) {
      if (start === 0) return;
      start = start - 1;
    }
    const target = value.slice(start, end);
    if (!target) return;
    const replacement = toggleScript(target, kind);
    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + replacement.length);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (e.key === ".") {
      e.preventDefault();
      applyScript("super");
    } else if (e.key === ",") {
      e.preventDefault();
      applyScript("sub");
    }
  };

  return (
    <div className={className}>
      <Textarea
        ref={taRef as React.Ref<HTMLTextAreaElement>}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        minRows={minRows}
        isRequired={isRequired}
      />
      {showTools && (
        <div className="flex flex-wrap items-center gap-1 mt-2">
          <Tooltip content="Superscript — select text (or put the cursor after it) then ⌘/Ctrl + .">
            <Button size="sm" variant="flat" className="font-serif" onPress={() => applyScript("super")}>
              x²
            </Button>
          </Tooltip>
          <Tooltip content="Subscript — select text (or put the cursor after it) then ⌘/Ctrl + ,">
            <Button size="sm" variant="flat" className="font-serif" onPress={() => applyScript("sub")}>
              x₂
            </Button>
          </Tooltip>
          <SymbolPicker onInsert={insertAtCursor} />
          <FormulaPicker onInsert={insertAtCursor} />
        </div>
      )}
    </div>
  );
});
