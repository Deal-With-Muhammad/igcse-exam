import type { Question, QuestionType } from "@/types";

let counter = 0;
const newId = () =>
  `q_${Date.now().toString(36)}_${(counter++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export function makeQuestion(type: QuestionType): Question {
  const base = { id: newId(), text: "", points: 1, image_url: null, reference_images: [] };
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
  const base = { id: q.id, text: q.text, points: q.points, image_url: q.image_url, reference_images: q.reference_images };
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
