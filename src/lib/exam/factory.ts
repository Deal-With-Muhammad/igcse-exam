import type { Question, QuestionType } from "@/types";

let counter = 0;
const newId = () =>
  `q_${Date.now().toString(36)}_${(counter++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const DEFAULT_PDF_LINES: Record<QuestionType, number> = {
  mcq: 0,
  truefalse: 0,
  fillblank: 1,
  short: 3,
  long: 8,
};

export function makeQuestion(type: QuestionType): Question {
  const base = {
    id: newId(),
    text: "",
    points: 1,
    image_url: null,
    image_urls: [],
    reference_images: [],
    lines_for_pdf: DEFAULT_PDF_LINES[type],
    time_limit_seconds: null,
  };
  switch (type) {
    case "mcq":
      return { ...base, type, options: ["", "", "", ""], correctOption: 0 };
    case "truefalse":
      return { ...base, type, correctAnswer: true };
    case "fillblank":
      return { ...base, type, correctAnswer: "", acceptedAnswers: [] };
    case "short":
      return { ...base, type, correctAnswer: "" };
    case "long":
      return { ...base, type };
  }
}

export function changeQuestionType(q: Question, newType: QuestionType): Question {
  const base = {
    id: q.id,
    text: q.text,
    points: q.points,
    image_url: q.image_url,
    image_urls: q.image_urls ?? [],
    reference_images: q.reference_images,
    lines_for_pdf: q.lines_for_pdf ?? DEFAULT_PDF_LINES[newType],
    time_limit_seconds: q.time_limit_seconds ?? null,
  };
  switch (newType) {
    case "mcq":
      return { ...base, type: "mcq", options: (q as { options?: string[] }).options ?? ["", "", "", ""], correctOption: 0 };
    case "truefalse":
      return { ...base, type: "truefalse", correctAnswer: true };
    case "fillblank":
      return { ...base, type: "fillblank", correctAnswer: "", acceptedAnswers: [] };
    case "short":
      return { ...base, type: "short", correctAnswer: "" };
    case "long":
      return { ...base, type: "long" };
  }
}
