"use client";

import { Divider, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip } from "@heroui/react";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Table as TableIcon, Rows, Columns, Eraser, Superscript, Subscript, Trash2, ChevronDown,
} from "lucide-react";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { isHtml, sanitizeHtml } from "@/lib/rich-text/html";
import { SymbolPicker } from "./symbol-picker";
import { FormulaPicker } from "./formula-picker";

/** Convert a stored value to editor HTML — legacy plain text keeps its line breaks. */
function toEditorHtml(v: string): string {
  if (!v) return "";
  if (isHtml(v)) return v;
  const esc = v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.split(/\r?\n/).map((l) => l || "<br>").join("<br>");
}

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (html: string) => void;
  isRequired?: boolean;
  minHeight?: number;
}

/**
 * A lightweight rich-text editor built on contentEditable. Emits clean,
 * sanitised HTML (bold/italic/underline/strike, bullet & numbered lists,
 * tables, super/subscript) plus the existing Symbols/Formulas pickers.
 */
export function RichTextEditor({ label, placeholder, value, onChange, isRequired, minHeight = 120 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  // The value we last pushed to / read from the DOM. The editor is uncontrolled:
  // we set innerHTML imperatively (never via a render-time prop) so React never
  // recreates the contentEditable subtree mid-edit and resets the caret. `null`
  // forces the first sync to populate the DOM.
  const lastHtml = useRef<string | null>(null);
  // Remember the caret/selection inside the editor so the Symbols/Formulas
  // popovers and table menu (which steal focus) can act at the right place.
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only overwrite the DOM on external value changes — our own typing already
    // updated the DOM and set lastHtml, so this is a no-op for keystrokes.
    if (value !== lastHtml.current) {
      el.innerHTML = toEditorHtml(value);
      lastHtml.current = value;
    }
  }, [value]);

  useEffect(() => {
    const save = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && ref.current && ref.current.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", save);
    return () => document.removeEventListener("selectionchange", save);
  }, []);

  const restoreSelection = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel && el.contains(savedRange.current.commonAncestorContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const html = sanitizeHtml(el.innerHTML).trim();
    lastHtml.current = html;
    onChange(html);
  };

  // Run a document command, restoring the editor selection first.
  const exec = (command: string, arg?: string) => {
    restoreSelection();
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch { /* not supported — tags are still emitted */ }
    document.execCommand(command, false, arg);
    emit();
  };

  const insertHtml = (html: string) => {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    emit();
  };

  const insertText = (text: string) => {
    restoreSelection();
    document.execCommand("insertText", false, text);
    emit();
  };

  const insertTable = () => {
    const cell = "<td><br></td>";
    const headCell = "<th>Header</th>";
    const html =
      "<table><thead><tr>" + headCell + headCell + "</tr></thead>" +
      "<tbody><tr>" + cell + cell + "</tr><tr>" + cell + cell + "</tr></tbody></table><p><br></p>";
    insertHtml(html);
  };

  const tableFromSelection = (): HTMLTableElement | null => {
    const sel = window.getSelection();
    let node = sel?.anchorNode as Node | null;
    while (node && node !== ref.current) {
      if (node instanceof HTMLTableElement) return node;
      node = node.parentNode;
    }
    return null;
  };

  const NEED_TABLE = "Click inside a table first";

  const addRow = () => {
    restoreSelection();
    const table = tableFromSelection();
    const body = table?.tBodies[0];
    if (!body) { toast.error(NEED_TABLE); return; }
    const cols = Math.max(1, body.rows[0]?.cells.length ?? table.rows[0]?.cells.length ?? 1);
    const tr = body.insertRow(-1);
    for (let i = 0; i < cols; i++) tr.insertCell(-1).innerHTML = "<br>";
    emit();
  };

  const addColumn = () => {
    restoreSelection();
    const table = tableFromSelection();
    if (!table) { toast.error(NEED_TABLE); return; }
    Array.from(table.rows).forEach((row) => {
      const isHead = row.parentElement?.tagName === "THEAD";
      const cell = document.createElement(isHead ? "th" : "td");
      cell.innerHTML = isHead ? "Header" : "<br>";
      row.appendChild(cell);
    });
    emit();
  };

  // Locate the table cell containing the current selection (and its row/column).
  const cellFromSelection = () => {
    const sel = window.getSelection();
    let node = sel?.anchorNode as Node | null;
    while (node && node !== ref.current) {
      if (node instanceof HTMLTableCellElement) {
        const row = node.parentElement as HTMLTableRowElement;
        const table = node.closest("table");
        return { cell: node, row, table, colIndex: Array.from(row.cells).indexOf(node) };
      }
      node = node.parentNode;
    }
    return null;
  };

  const deleteRow = () => {
    restoreSelection();
    const info = cellFromSelection();
    if (!info?.table) { toast.error(NEED_TABLE); return; }
    info.row.remove();
    if (info.table.querySelectorAll("tr").length === 0) info.table.remove();
    emit();
  };

  const deleteColumn = () => {
    restoreSelection();
    const info = cellFromSelection();
    if (!info?.table) { toast.error(NEED_TABLE); return; }
    Array.from(info.table.rows).forEach((r) => { if (r.cells[info.colIndex]) r.deleteCell(info.colIndex); });
    if ((info.table.rows[0]?.cells.length ?? 0) === 0) info.table.remove();
    emit();
  };

  const deleteTable = () => {
    restoreSelection();
    const table = tableFromSelection();
    if (!table) { toast.error(NEED_TABLE); return; }
    table.remove();
    emit();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (e.key === ".") { e.preventDefault(); exec("superscript"); }
    else if (e.key === ",") { e.preventDefault(); exec("subscript"); }
  };

  // Native buttons: onMouseDown preventDefault keeps focus (and the selection)
  // in the contentEditable so execCommand acts on the current text.
  const tbBtn = (icon: React.ReactNode, title: string, onClick: () => void, danger = false) => (
    <Tooltip content={title} closeDelay={0}>
      <button
        type="button"
        aria-label={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
          danger ? "text-danger hover:bg-danger-100" : "text-default-600 hover:bg-default-200 active:bg-default-300"
        }`}
      >
        {icon}
      </button>
    </Tooltip>
  );

  return (
    <div>
      {label && (
        <label className="block text-sm text-default-600 mb-1.5">
          {label}{isRequired && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="rounded-medium border-2 border-default-200 focus-within:border-default-400 transition-colors bg-default-100/50">
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-default-200">
          {tbBtn(<Bold size={15} />, "Bold (⌘B)", () => exec("bold"))}
          {tbBtn(<Italic size={15} />, "Italic (⌘I)", () => exec("italic"))}
          {tbBtn(<Underline size={15} />, "Underline (⌘U)", () => exec("underline"))}
          {tbBtn(<Strikethrough size={15} />, "Strikethrough", () => exec("strikeThrough"))}
          <Divider orientation="vertical" className="h-5 mx-0.5" />
          {tbBtn(<Superscript size={15} />, "Superscript (⌘.)", () => exec("superscript"))}
          {tbBtn(<Subscript size={15} />, "Subscript (⌘,)", () => exec("subscript"))}
          <Divider orientation="vertical" className="h-5 mx-0.5" />
          {tbBtn(<List size={15} />, "Bullet list", () => exec("insertUnorderedList"))}
          {tbBtn(<ListOrdered size={15} />, "Numbered list", () => exec("insertOrderedList"))}
          <Divider orientation="vertical" className="h-5 mx-0.5" />
          <Dropdown placement="bottom-start">
            <DropdownTrigger>
              <button
                type="button"
                aria-label="Table"
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-default-600 hover:bg-default-200 active:bg-default-300 transition-colors text-xs font-medium"
              >
                <TableIcon size={15} /> Table <ChevronDown size={13} />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Table actions"
              onAction={(key) => {
                if (key === "insert") insertTable();
                else if (key === "add-row") addRow();
                else if (key === "add-col") addColumn();
                else if (key === "del-row") deleteRow();
                else if (key === "del-col") deleteColumn();
                else if (key === "del-table") deleteTable();
              }}
            >
              <DropdownItem key="insert" startContent={<TableIcon size={15} />}>Insert table</DropdownItem>
              <DropdownItem key="add-row" startContent={<Rows size={15} />}>Add row</DropdownItem>
              <DropdownItem key="add-col" startContent={<Columns size={15} />}>Add column</DropdownItem>
              <DropdownItem key="del-row" className="text-danger" color="danger" startContent={<Rows size={15} />}>Delete row</DropdownItem>
              <DropdownItem key="del-col" className="text-danger" color="danger" startContent={<Columns size={15} />}>Delete column</DropdownItem>
              <DropdownItem key="del-table" className="text-danger" color="danger" startContent={<Trash2 size={15} />}>Delete table</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Divider orientation="vertical" className="h-5 mx-0.5" />
          {tbBtn(<Eraser size={15} />, "Clear formatting", () => exec("removeFormat"))}
          <div className="ml-auto flex items-center gap-1">
            <SymbolPicker onInsert={insertText} />
            <FormulaPicker onInsert={insertText} />
          </div>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          data-placeholder={placeholder}
          onInput={emit}
          onBlur={emit}
          onKeyDown={onKeyDown}
          className="rich-content rich-editor px-3 py-2 outline-none text-sm leading-relaxed"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
