# ELS Online Exam System

Next.js 16 + React 19 + HeroUI v3 + Supabase exam platform built for **Empower Learning System**.

## Features

- **Auth & roles** — admins manage teachers, teachers manage their own exams
- **Exam editor** — MCQ, True/False, Fill-in-the-blank, Short & Long answer
- **Math/science toolbox** — searchable symbols (Greek, sets, operators, units…) and ready-made formulas (algebra, physics, chemistry, calculus, statistics)
- **Image upload** — per-question images plus exam-wide reference images, all served from Supabase Storage
- **Templates** — admins design exam-paper templates (logo, school header, instructions, info block); used at PDF-export time
- **Curriculum & subject** — IGCSE / GED / Other × ICT, English, Maths, Physics, Chemistry, Biology, Science, etc. (free-form values supported)
- **Exam runner with autosave** — every keystroke is written to `localStorage` synchronously; tabs can be refreshed mid-exam without losing work
- **Proctoring** — focus-loss detection with 60s grace, full event log shown to teacher when grading
- **Grading** — correct/incorrect detection fixed for all answer types, with manual override
- **PDF export** — uses the assigned template, replicates the on-paper layout (header, marks-in-brackets, line spaces for written answers)

## Setup

### 1. Install
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` → `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # for scripts only
```

### 3. Apply database schema
Run `supabase/migrations/001_initial.sql` in the Supabase SQL editor. It creates:
- `profiles`, `exams`, `submissions`, `templates`
- RLS policies for admin / teacher / public access
- Storage buckets: `question-images`, `template-assets`
- Seeds the default ELS template (logo can be uploaded later via admin UI)

### 4. Create the first admin
```bash
npm run create-admin -- --email admin@els.edu --password "ChangeMe!" --name "Admin"
```
or run it interactively:
```bash
npm run create-admin
```

### 5. Start dev server
```bash
npm run dev
```
Then open http://localhost:3000.

## Migrating from the old Firebase app

The old project stored exams + submissions in Firestore. To bring them across:

1. Keep the old `NEXT_PUBLIC_FIREBASE_*` vars in `.env.local` alongside the new Supabase ones.
2. Make sure the migration owner exists in Supabase (e.g. the new admin).
3. Run:
   ```bash
   npm run migrate-firebase -- --owner admin@els.edu
   ```

The script reads every doc from `exams` + `submissions` and inserts them into Supabase. Each migrated exam gets a new share code; the old short-code is not preserved.

## Folder structure

```
src/
  app/               # Next.js routes (App Router)
  components/        # split per feature, each file < 300 lines
  lib/
    supabase/        # client, server, middleware, admin
    exam/            # grading, factory, bulk-parse
    symbols/         # math/science symbol + formula library
    pdf/             # jsPDF generator
  hooks/             # useExamStorage, useProctor
  types/             # shared TS types
scripts/
  create-admin.ts    # bootstrap
  migrate-firebase.ts
supabase/migrations/ # SQL schema
```

## Authoring guidelines

- **Files are kept under 300 lines.** When something grows, split it into a sibling.
- Pages stay thin (data fetching only); UI delegates to a client component.
- Database access from the client uses the anon key + RLS. Privileged operations (creating users, deleting accounts) go through `/api/admin/*` which uses the service role.
