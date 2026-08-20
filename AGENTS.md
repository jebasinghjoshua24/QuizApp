# AGENTS.md — QuizApp Project Context (MANDATORY READ)

This file is the source of truth for this project. Every new session **must** read
this file first. It captures the goal, stack, rules, architecture plan, and
workflow so context is never lost.

---

## 1. The Project

A **Quiz App** for a college unit project. It will be used to demonstrate
learning of a new stack: **TypeScript, Next.js, PostgreSQL, and a backend** on
top of the existing React knowledge.

**Timeline: 2 weeks requested (deadline increase approved by student to ask for).**
MVP delivered in 7–9 days, remaining time = buffer, polish, tests, README.
The MVP itself is what we demo.

## 2. The Stack (what we learn while building) — DECISIONS LOCKED

| Piece | Status | Decision |
|---|---|---|
| React | Already know — foundation | — |
| TypeScript | Learning (new) | — |
| Next.js | Learning (new) | App Router |
| PostgreSQL | Learning (new) | **Local install** (EDB installer, no Docker) |
| Backend (API layer) | Learning (new) | **Next.js API routes** (one codebase, one server) |
| Auth | Learning (new) | **Seed users + sessions** (no registration page) |

**Build order = vertical slices:** each feature touches DB + API + page together and
is tested end-to-end before moving on. Never "all API first" (untested code) or
"all frontend first" (throwaway mock data).

> **IMPORTANT — Next.js 16:** This version has breaking changes vs. older versions
> (APIs, conventions, file structure). Before writing Next.js code, read the local
> docs in `node_modules/next/dist/docs/` and heed deprecation notices. The `next dev`
> command re-writes this note into AGENTS.md — keep it committed with our work.

## 3. Features (MVP scope)

### Auth
- Login page with two roles:
  - **Student login**
  - **Admin login**

### Student Dashboard
- **Upcoming assessments** (list of not-yet-attempted assessments)
- **Finished assessments** with their **results**

### Exam Page
- Student attends an assessment containing **MCQ questions**
- **Timer** that counts down and **auto-submits** when time runs out

### Admin Dashboard
- **Create questions** (MCQ)
- **Create/manage assessments** (group questions, assign time limit)
- **See marks/results** of students who attended an assessment
- **Controls** over visibility, e.g. whether a student can see their result or not

## 4. THE RULES (non-negotiable)

1. **The user writes ALL the code.** The AI (me) never writes application code.
   My job:
   - Split the project into manageable tasks
   - Review user-written code and find errors
   - Explain errors: what the user's code does vs. what the feature should do
   - Teach new syntax/concepts with real-world examples AND JavaScript
     equivalents for understanding
   - Keep the task plan updated
   - Maintain the project docs (section 6): log every bug found in review into
     `docs/ERRORS.md`, keep `docs/HOW_IT_WORKS.md` current per feature, and write
     the `docs/WHY.md` design-decision entry **after every feature merge**

2. **Architecture must be clear, scalable, and bug-friendly.**
   - Clear separation of concerns (components / pages / API / db / types / utils)
   - **Hard rule: no file may exceed 1000 lines.** If it would, split it.
   - The project structure itself should make finding bugs easy.

3. **Code-example mode until switched:** Until the user explicitly says
   *"don't give me example code, give me the algorithm in English"*, the AI
   teaches with **full code examples + explanations** (the user needs to see
   syntax before they can implement an algorithm). After the switch: English
   algorithm descriptions only, code only if the user says they're stuck.

4. **The algorithm-workout mode (ACTIVE since 2026-08-18):** The user asked for
   reference-sheet learning. The AI maintains 5 lookup files in `docs/`:
   - `REFERENCE_TYPESCRIPT.md` — language built-ins (syntax / input / output)
   - `REFERENCE_NEXTJS.md` — framework built-ins (routing, cookies, handlers)
   - `REFERENCE_POSTGRESQL.md` — SQL statements, types, constraints, functions
   - `REFERENCE_REACT.md` — UI built-ins (components, state, events, JSX)
   - `REFERENCE_TAILWIND.md` — styling utility classes (Tailwind 4, CSS-first)
   Workflow per task:
   1. AI gives the **algorithm in English** (what to do, in steps)
   2. User writes the code, hunting the needed keywords/functions in the
      reference files
   3. AI reviews; every error gets explained with a **real-world example**
      (what the code did vs what the feature needs) and logged in `docs/ERRORS.md`
   - **Cheat-sheet map (in every reference file):** framework problem →
     REFERENCE_NEXTJS.md; language problem → REFERENCE_TYPESCRIPT.md; data
     problem → REFERENCE_POSTGRESQL.md; UI logic → REFERENCE_REACT.md;
     styling → REFERENCE_TAILWIND.md
   - **2-minute rule:** user searches the sheet for ~2 minutes; if still stuck,
     they ask the AI, who gives the algorithm (not the code)
   - **Sheets stay complete:** whenever the user's code introduces a built-in
     not yet in the sheets (e.g. RETURNING, `::jsonb`, `try/catch`), the AI adds
     it to the right sheet during that review — the sheets are a living index

5. **Styling carve-out (decided 2026-08-19):** Tailwind/CSS is NOT in the
   learning stack (that's TS, Next.js, PostgreSQL, backend). The user is weak
   at CSS and styling eats project time. DECISION: **the AI writes ALL styling**
   (className strings, layout, the final polish pass); **the user writes ALL
   logic** (state, handlers, data flow, SQL, routes, types). The AI explains
   styling choices in plain English so the user can read/debug them. The user
   learns to READ Tailwind, not to author it. ERRORS.md stops logging styling
   mistakes (they're the AI's domain now).

## 5. Git Workflow (mandatory for every feature)

Every feature follows this exact flow:
1. `git checkout main` (start clean)
2. Create a **feature branch**: `git checkout -b feature/<name>`
3. Implement the feature
4. **Test it** before committing
5. Commit with a clear message
6. `git checkout main`
7. **Merge** the feature branch into main
8. **Push** to remote

Result: a clean commit history where each feature is one branch/merge.

## 6. Documentation Deliverable

A **professional README.md** at the end covering:
- What stack we use (and why)
- What the code does
- What problem it solves
- How someone else can set it up and use it for themselves

Plus **two living docs** maintained throughout the project (the AI maintains them,
the user may add own notes):

- **`docs/ERRORS.md`** — the learning journal. One entry per bug found in code
  review: date, feature, what the user's code did, what it should do, the lesson.
  This is the user's study material for the viva/demo.
- **`docs/HOW_IT_WORKS.md`** — the anti-blackbox doc. Traces each feature's data
  flow: request → API route → SQL → response → page. Feeds directly into the
  final README (no double work).
- **`docs/WHY.md`** — the design-decision log. One entry per merged feature:
  every decision, its reason, and what it avoids. This is the viva study
  material: *"why did you build it this way?"*
- **`docs/REFERENCE_*.md`** — five lookup sheets (TypeScript, Next.js,
  PostgreSQL, React, Tailwind): built-in functions/keywords with syntax,
  purpose, input, output. Used by the algorithm-workout mode (rule 4)

## 7. Task Plan (updated as we go)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Write AGENTS.md | DONE | This file |
| 2 | Scaffold Next.js + TypeScript project | DONE | Next.js 16.3.1, React 19, TS, Tailwind 4, no src/ dir |
| 3 | git init + GitHub repo + initial commit | DONE | https://github.com/jebasinghjoshua24/QuizApp; no gh CLI, repo made via browser |
| 4 | Install PostgreSQL locally | DONE | PostgreSQL 18.6, bin added to PATH, port 5432 |
| 5 | Schema: migration SQL + seed script | DONE | feature/schema; 001_schema.sql + 002_seed.sql applied; sessions table to be added in auth feature |
| 6 | Auth: login page + API + sessions | DONE | feature/auth; sessions table added in 003_sessions.sql; 5 reference sheets created in docs/ |
| 7 | Admin: create questions | DONE | feature/questions merged; POST + GET /api/questions, admin page (form + live pool), lib/types.ts, login page restyled |
| 8 | Admin: create assessments (time limit, link questions) | pending | feature/assessments |
| 9 | Student dashboard (upcoming/finished) | pending | feature/student-dashboard |
| 10 | Exam page + timer auto-submit | pending | feature/exam |
| 11 | Results + visibility control | pending | feature/results |
| 12 | Test, polish, README.md | pending | feature/polish |

## 8. Planned Architecture (initial draft, refined during planning)

```
QuizApp/
├── src/
│   ├── app/            # Next.js App Router pages (login, student, admin, exam)
│   ├── components/     # Reusable UI components (split by domain)
│   ├── api/            # Backend routes / server logic
│   ├── lib/            # DB connection, helpers, auth utils
│   ├── types/          # TypeScript types/shared interfaces
│   └── utils/          # Pure helpers (validation, formatting)
├── migrations/         # SQL schema / migrations
├── docs/               # ERRORS.md (learning journal), HOW_IT_WORKS.md (flows),
│                       # WHY.md (design-decision log, one entry per merge)
└── README.md
```

---

## Session Checklist (for the AI at the start of every session)

- [ ] Read this AGENTS.md
- [ ] Check current git state and branch
- [ ] Read the task plan (section 7) and continue from where we stopped
- [ ] Respect rule 1: never write application code myself
- [ ] Respect rule 3: switch to algorithm-only mode when user requests it
- [ ] Keep docs/ERRORS.md, docs/HOW_IT_WORKS.md, docs/WHY.md current as we go
