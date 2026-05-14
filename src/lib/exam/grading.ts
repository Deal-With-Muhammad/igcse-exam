import type { Answer, Question } from "@/types";

const normalize = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function isAnswerCorrect(question: Question, studentAnswer: Answer): boolean {
  if (studentAnswer === null || studentAnswer === undefined || studentAnswer === "") {
    return false;
  }

  switch (question.type) {
    case "mcq": {
      const submitted = typeof studentAnswer === "number"
        ? studentAnswer
        : Number.parseInt(String(studentAnswer), 10);
      if (Number.isNaN(submitted)) return false;
      return submitted === question.correctOption;
    }

    case "truefalse": {
      const correct = question.correctAnswer === true;
      let submitted: boolean;
      if (typeof studentAnswer === "boolean") {
        submitted = studentAnswer;
      } else {
        const s = String(studentAnswer).toLowerCase().trim();
        if (s === "true") submitted = true;
        else if (s === "false") submitted = false;
        else return false;
      }
      return submitted === correct;
    }

    case "fillblank": {
      const submitted = normalize(studentAnswer);
      const primary = normalize(question.correctAnswer);
      if (submitted === primary) return true;
      const accepted = question.acceptedAnswers?.map(normalize) ?? [];
      return accepted.includes(submitted);
    }

    case "short":
    case "long":
      return false;
  }
}

export function autoGrade(question: Question, studentAnswer: Answer): number {
  if (question.type === "short" || question.type === "long") return 0;
  return isAnswerCorrect(question, studentAnswer) ? Number(question.points) : 0;
}

export function isAutoGradedType(type: Question["type"]): boolean {
  return type === "mcq" || type === "truefalse" || type === "fillblank";
}

export function calcMaxScore(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + Number(q.points || 0), 0);
}
