import type { Question } from "@/types";
import { makeQuestion } from "./factory";

/**
 * Heuristic parser that turns free-form exam text (e.g. extracted from a PDF)
 * into typed questions — detecting MCQs, true/false, fill-in-the-blank, and
 * short vs long answers — and reports any blocks it could not confidently parse.
 */

export interface SmartParseResult {
  questions: Question[];
  /** Raw blocks that couldn't be classified, surfaced to the user. */
  unparsed: string[];
}

// A new question starts with a number (optionally "Q"/"Question"): "1.", "2)", "Q3:".
const Q_START = /^\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.)\-:]\s+/i;
// An MCQ option line: "A) ...", "(b) ...", "C. ...".
const OPTION = /^\s*\(?([A-Ha-h])[).\]]\s*(\S.*?)\s*$/;
const MARKS = /\[\s*(\d{1,3})\s*\]|\(\s*(\d{1,3})\s*(?:marks?|pts?|points?)\s*\)/i;
const BLANK = /_{2,}|\.{3,}|…|\(\s{2,}\)/;
const LONG_KW = /\b(explain|describe|discuss|evaluate|analy[sz]e|justify|essay|elaborate|in detail|compare|comment on|outline)\b/i;
const ANSWER = /^\s*ans(?:wer)?\s*[:\-.]\s*/i;
// Page footers / separators / boilerplate that shouldn't be folded into a question.
const NOISE = /^(?:page\s+\d+(?:\s+of\s+\d+)?|\d+\s*(?:of|\/)\s*\d+|\d{1,3}|end of (?:the )?(?:paper|exam(?:ination)?|test|section)|©.*|copyright.*|[-—=_*]{3,})\s*$/i;

function extractMarks(s: string): number | null {
  const m = MARKS.exec(s);
  if (!m) return null;
  const n = Number(m[1] || m[2]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function stripMarks(s: string): string {
  return s.replace(MARKS, "").replace(/\s{2,}/g, " ").trim();
}

/** Break the text into per-question blocks using numeric markers, with a
 *  blank-line fallback when no markers are present. */
function segment(text: string): string[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: string[] = [];
  let cur: string[] = [];
  let started = false;
  for (const line of lines) {
    if (Q_START.test(line)) {
      if (cur.length) blocks.push(cur.join("\n").trim());
      cur = [line];
      started = true;
    } else if (started) {
      cur.push(line);
    }
  }
  if (cur.length) blocks.push(cur.join("\n").trim());

  if (blocks.length === 0) {
    return text.split(/\n\s*\n/).map((b) => b.trim()).filter((b) => b.replace(/\s/g, "").length > 2);
  }
  return blocks.filter((b) => b.replace(/\s/g, "").length > 2);
}

function classify(block: string): Question | null {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const firstLine = lines[0].replace(Q_START, "").trim();
  const rest = lines.slice(1);

  const optionLines: string[] = [];
  const nonOption: string[] = [];
  for (const l of rest) {
    if (NOISE.test(l)) continue; // drop page numbers / footers / separators
    const m = OPTION.exec(l);
    if (m) optionLines.push(m[2].trim());
    else nonOption.push(l);
  }

  const marks = extractMarks(block);
  const answerLine = rest.find((l) => ANSWER.test(l));
  const answer = answerLine ? answerLine.replace(ANSWER, "").trim() : "";

  const stem = stripMarks(
    [firstLine, ...nonOption.filter((l) => !ANSWER.test(l))].join(" ").replace(/\s{2,}/g, " ").trim(),
  );
  const text = (stem || firstLine).trim();
  if (text.length < 3) return null;

  // Multiple choice
  if (optionLines.length >= 2) {
    const q = makeQuestion("mcq");
    q.text = text;
    if (q.type === "mcq") {
      q.options = optionLines.slice(0, 8);
      while (q.options.length < 2) q.options.push("");
      if (answer) {
        const idx = "ABCDEFGH".indexOf(answer.trim().charAt(0).toUpperCase());
        if (idx >= 0 && idx < q.options.length) q.correctOption = idx;
      }
    }
    if (marks) q.points = marks;
    return q;
  }

  // True / False
  if (/\btrue\s*\/\s*false\b|\(\s*t\s*\/\s*f\s*\)|\btrue or false\b/i.test(block)) {
    const q = makeQuestion("truefalse");
    q.text = text;
    if (q.type === "truefalse") {
      if (/\b(true|t)\b/i.test(answer)) q.correctAnswer = true;
      else if (/\b(false|f)\b/i.test(answer)) q.correctAnswer = false;
    }
    if (marks) q.points = marks;
    return q;
  }

  // Fill in the blank
  if (BLANK.test(block) || /\bfill in the blank\b/i.test(block)) {
    const q = makeQuestion("fillblank");
    q.text = text;
    if (q.type === "fillblank" && answer) q.correctAnswer = answer;
    if (marks) q.points = marks;
    return q;
  }

  // Short vs long answer
  const isLong = (marks != null && marks >= 4) || LONG_KW.test(block);
  const q = makeQuestion(isLong ? "long" : "short");
  q.text = text;
  if (marks) q.points = marks;
  return q;
}

export function smartParse(text: string): SmartParseResult {
  const questions: Question[] = [];
  const unparsed: string[] = [];
  for (const block of segment(text)) {
    const q = classify(block);
    if (q) questions.push(q);
    else unparsed.push(block);
  }
  return { questions, unparsed };
}

/**
 * Split a pasted/free-form list of options into clean option strings, stripping
 * any "A)", "1.", "(b)" style leading markers. Used by the smart MCQ paste so
 * teachers can paste a whole block of options at once.
 */
export function splitOptionLines(text: string): string[] {
  const raw = text.replace(/\r/g, "").trim();
  if (!raw) return [];
  let parts = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  // Single line containing inline markers: "A) x  B) y  C) z".
  if (parts.length <= 1) {
    const split = raw.split(/(?=(?:^|\s)\(?[A-Ha-h][).\]]\s)/).map((s) => s.trim()).filter(Boolean);
    if (split.length >= 2) parts = split;
  }
  return parts
    .map((s) => s.replace(/^\(?\s*[A-Ha-h0-9]\s*[).\]:\-]\s*/, "").trim())
    .filter(Boolean);
}
