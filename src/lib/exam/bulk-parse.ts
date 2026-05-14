import type { Question, QuestionType } from "@/types";
import { makeQuestion } from "./factory";

export function parseBulk(text: string, type: QuestionType): Question[] {
  const blocks = text
    .split(/\n\s*(?:\*|\d+[.)])\s*/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
  const out: Question[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    if (type === "mcq") {
      const q = makeQuestion("mcq");
      q.text = lines[0];
      const opts: string[] = [];
      for (let i = 1; i < lines.length && opts.length < 4; i++) {
        const cleaned = lines[i].replace(/^[A-Da-d][.)\]:]?\s*/, "").trim();
        if (cleaned) opts.push(cleaned);
      }
      while (opts.length < 4) opts.push("");
      if (q.type === "mcq") q.options = opts.slice(0, 4);
      out.push(q);
    } else if (type === "truefalse") {
      const q = makeQuestion("truefalse");
      q.text = block;
      out.push(q);
    } else if (type === "fillblank") {
      const q = makeQuestion("fillblank");
      q.text = lines[0];
      const ans = lines.find((l) => l.toLowerCase().startsWith("answer:"));
      if (ans && q.type === "fillblank") q.correctAnswer = ans.replace(/^answer:\s*/i, "").trim();
      out.push(q);
    } else if (type === "short" || type === "long") {
      const q = makeQuestion(type);
      q.text = block;
      out.push(q);
    }
  }

  return out;
}
