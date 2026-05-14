import type { Curriculum } from "@/types";

export const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "ELS";
export const SCHOOL_FULL_NAME =
  process.env.NEXT_PUBLIC_SCHOOL_FULL_NAME || "Empower Learning System";

export const CURRICULA: { value: Curriculum; label: string }[] = [
  { value: "igcse", label: "IGCSE" },
  { value: "ged", label: "GED" },
  { value: "other", label: "Other" },
];

export const SUBJECTS = [
  "ICT",
  "English",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Science",
  "Business",
  "Economics",
  "Accounting",
  "History",
  "Geography",
  "Computer Science",
  "Religious Studies",
  "Urdu",
  "Arabic",
  "French",
  "Art & Design",
] as const;

export const LEVELS = [
  "Level-1",
  "Level-2",
  "Level-3",
  "Level-4",
  "Level-5",
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "AS",
  "A2",
] as const;

export const BRANCHES = [
  { key: "klang", label: "Klang" },
  { key: "cheras", label: "Cheras" },
  { key: "batu-caves", label: "Batu Caves" },
  { key: "rawang", label: "Rawang" },
  { key: "other", label: "Other" },
];

export const QUESTION_TYPE_LABELS = {
  mcq: "Multiple Choice",
  truefalse: "True / False",
  fillblank: "Fill in the Blank",
  short: "Short Answer",
  long: "Long Answer",
} as const;

export const QUESTION_TYPE_COLORS = {
  mcq: "primary",
  truefalse: "success",
  fillblank: "warning",
  short: "secondary",
  long: "default",
} as const;
