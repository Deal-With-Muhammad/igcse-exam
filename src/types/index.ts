export type UserRole = "admin" | "teacher";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  class_id: string | null;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export type Curriculum = "igcse" | "ged" | "other";

export type QuestionType = "mcq" | "truefalse" | "fillblank" | "long" | "short";

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  image_url?: string | null;
  reference_images?: string[];
  /** Number of writing lines reserved on the PDF (0 = none). */
  lines_for_pdf?: number;
  /** Optional per-question countdown in seconds. null/undefined = no timer. */
  time_limit_seconds?: number | null;
}

export interface MCQQuestion extends BaseQuestion {
  type: "mcq";
  options: string[];
  correctOption: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "truefalse";
  correctAnswer: boolean;
}

export interface FillBlankQuestion extends BaseQuestion {
  type: "fillblank";
  correctAnswer: string;
  acceptedAnswers?: string[];
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: "short";
  correctAnswer?: string;
}

export interface LongAnswerQuestion extends BaseQuestion {
  type: "long";
}

export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | FillBlankQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion;

export interface Template {
  id: string;
  name: string;
  school_name: string;
  school_full_name: string;
  logo_url: string | null;
  motto: string;
  header_title: string;
  header_year: string;
  instructions: string[];
  information: string[];
  final_reminder: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  share_code: string;
  title: string;
  description: string;
  curriculum: Curriculum;
  subject: string;
  level: string;
  part: string;
  /** null = no overall time limit. */
  time_limit_minutes: number | null;
  total_marks: number;
  template_id: string | null;
  class_id: string | null;
  /** If false, switching tabs only logs warnings — never auto-submits. */
  terminate_on_switch: boolean;
  /** Number of focus-loss events allowed before termination (when enabled). */
  max_warnings: number;
  reference_images: string[];
  questions: Question[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type SwitchEventType = "focus" | "blur" | "terminated";

export interface SwitchEvent {
  event: SwitchEventType;
  timestamp: string;
  warningNumber?: number;
  timeAway?: number;
  reason?: string;
}

export type Answer = string | number | boolean | null;

export interface Submission {
  id: string;
  exam_id: string;
  exam_title: string;
  student_name: string;
  student_class: string;
  branch: string;
  branch_name: string;
  answers: Answer[];
  switch_log: SwitchEvent[];
  warnings: number;
  total_switches: number;
  terminated: boolean;
  submitted_at: string;
  graded: boolean;
  grades: number[];
  comments: string[];
  total_score: number;
  max_score: number;
  graded_at: string | null;
}
