/**
 * Migrate exams + submissions from the legacy Firebase Firestore to Supabase.
 *
 * Requirements (in .env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_FIREBASE_* (the old project config)
 *
 * Usage:
 *   npm run migrate-firebase
 *
 * The script:
 *   1. Connects to both Firestore and Supabase.
 *   2. Fetches every doc from `exams` and `submissions`.
 *   3. Maps Firestore fields to the Supabase schema (incl. share_code, curriculum, subject defaults).
 *   4. Inserts into Supabase. Existing rows are skipped by Firestore id.
 *
 * Notes:
 *   - All exams are assigned to one designated owner (--owner email) so RLS works.
 *   - Old `studentClass` becomes `student_class`, `branchName` -> `branch_name`, etc.
 *   - Old MCQ `correctOption` is preserved; True/False / fillblank / long stay compatible.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, Timestamp } from "firebase/firestore";
import { generateShareCode } from "../src/lib/share-code";

function arg(key: string): string | undefined {
  const idx = process.argv.indexOf(`--${key}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function toISO(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "object" && v && "seconds" in v) {
    return new Date((v as { seconds: number }).seconds * 1000).toISOString();
  }
  if (typeof v === "string") return new Date(v).toISOString();
  return new Date().toISOString();
}

interface OldQuestion {
  id?: string;
  type: string;
  text?: string;
  options?: string[];
  correctOption?: number;
  correctAnswer?: string | boolean;
  points?: number;
}

function mapQuestion(q: OldQuestion, idx: number) {
  const base = { id: q.id || `q_${idx}`, type: q.type, text: q.text || "", points: Number(q.points || 1), image_url: null, reference_images: [] };
  if (q.type === "mcq") {
    return { ...base, options: q.options ?? ["", "", "", ""], correctOption: Number(q.correctOption || 0) };
  }
  if (q.type === "truefalse") {
    return { ...base, correctAnswer: q.correctAnswer === true || q.correctAnswer === "true" };
  }
  if (q.type === "fillblank") {
    return { ...base, correctAnswer: String(q.correctAnswer ?? ""), acceptedAnswers: [] };
  }
  return base; // long / short
}

async function main() {
  const ownerEmail = arg("owner");
  if (!ownerEmail) {
    console.error("--owner <email> is required (existing Supabase profile that will own migrated exams)");
    process.exit(1);
  }

  if (!firebaseConfig.projectId) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_* in .env");
    process.exit(1);
  }
  if (!SB_URL || !SB_KEY) {
    console.error("Missing Supabase env vars");
    process.exit(1);
  }

  const fbApp = initializeApp(firebaseConfig);
  const db = getFirestore(fbApp);
  const sb = createClient(SB_URL, SB_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: owner, error: oErr } = await sb.from("profiles").select("id").eq("email", ownerEmail).single();
  if (oErr || !owner) {
    console.error(`Owner "${ownerEmail}" not found in profiles. Create the user first via create-admin.`);
    process.exit(1);
  }
  const ownerId = owner.id;

  console.log("→ Reading Firestore exams...");
  const examSnap = await getDocs(collection(db, "exams"));
  console.log(`  Found ${examSnap.size} exams`);

  const idMap = new Map<string, string>(); // firebase id -> supabase id

  for (const docSnap of examSnap.docs) {
    const fid = docSnap.id;
    const data = docSnap.data() as Record<string, unknown>;
    const questionsArr = (data.questions as OldQuestion[] | undefined) ?? [];
    const questions = questionsArr.map(mapQuestion);
    const total = questions.reduce((s, q) => s + Number(q.points || 0), 0);

    const payload = {
      share_code: generateShareCode(),
      title: String(data.title || "Untitled"),
      description: String(data.description || ""),
      curriculum: "igcse",
      subject: String(data.subject || "Other"),
      level: String(data.level || ""),
      part: String(data.part || ""),
      time_limit_minutes: Number(data.time_limit_minutes || data.timeLimit || 60),
      total_marks: total,
      reference_images: [],
      questions,
      created_by: ownerId,
      created_at: toISO(data.createdAt),
      updated_at: toISO(data.updatedAt ?? data.createdAt),
    };

    const { data: inserted, error: iErr } = await sb.from("exams").insert(payload).select("id").single();
    if (iErr || !inserted) {
      console.error(`  ✗ Exam "${payload.title}" (${fid}):`, iErr?.message);
      continue;
    }
    idMap.set(fid, inserted.id);
    console.log(`  ✓ Exam "${payload.title}" → ${inserted.id}`);
  }

  console.log("→ Reading Firestore submissions...");
  const subSnap = await getDocs(collection(db, "submissions"));
  console.log(`  Found ${subSnap.size} submissions`);

  for (const docSnap of subSnap.docs) {
    const d = docSnap.data() as Record<string, unknown>;
    const oldExamId = String(d.examId || "");
    const newExamId = idMap.get(oldExamId);
    if (!newExamId) {
      console.warn(`  ⏭  Skip submission ${docSnap.id} (exam ${oldExamId} not migrated)`);
      continue;
    }

    const payload = {
      exam_id: newExamId,
      exam_title: String(d.examTitle || ""),
      student_name: String(d.studentName || ""),
      student_class: String(d.studentClass || ""),
      branch: String(d.branch || "other"),
      branch_name: String(d.branchName || d.branch || "Other"),
      answers: (d.answers ?? []) as unknown[],
      switch_log: (d.switchLog ?? []) as unknown[],
      warnings: Number(d.warnings || 0),
      total_switches: Number(d.totalSwitches || 0),
      terminated: Boolean(d.terminated),
      submitted_at: toISO(d.submittedAt),
      graded: Boolean(d.graded),
      grades: (d.grades ?? []) as unknown[],
      comments: (d.comments ?? []) as unknown[],
      total_score: Number(d.totalScore || 0),
      max_score: Number(d.maxScore || 0),
      graded_at: d.gradedAt ? toISO(d.gradedAt) : null,
    };

    const { error: sErr } = await sb.from("submissions").insert(payload);
    if (sErr) { console.error(`  ✗ Submission ${docSnap.id}:`, sErr.message); continue; }
    console.log(`  ✓ Submission ${payload.student_name} / ${payload.exam_title}`);
  }

  console.log("\n✓ Migration complete");
}

main().catch((err) => { console.error(err); process.exit(1); });
