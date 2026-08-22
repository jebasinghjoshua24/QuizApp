# HOW_IT_WORKS.md — The Anti-Blackbox Doc

Every feature in this app gets traced end-to-end here:

```
Browser (page) → API route (request) → SQL (query) → response → page (render)
```

Reading this file, you can explain ANY feature of the app in 5 sentences. That is
the goal. It feeds directly into the final README.

## Current flow map (updated per feature)

| Feature | Page | API route(s) | Table(s) touched |
|---|---|---|---|
| Auth (login) | `app/login/page.tsx` (client) | `POST /api/auth/login` | users (read), sessions (write) |
| Auth (who am I) | — | `GET /api/auth/me` | sessions + users (read, via JOIN) |
| Auth (logout) | — | `POST /api/auth/logout` | sessions (delete) |
| Admin: create question | `app/admin/page.tsx` (client) | `POST /api/questions`, `GET /api/questions` | questions (write + read) |
| Admin: create assessment | `app/admin/assessments/page.tsx` (client) | `POST /api/assessments`, `GET /api/assessments`, `GET /api/questions` (pool) | assessments (write), assessment_questions (write), questions (read) |

---

## Feature: Auth

### Flow
1. **Page:** user submits email + password on `/login` (client component). `fetch` POSTs JSON to the API; on error shows the server's message; on success redirects by role: admin → `/admin`, student → `/dashboard`
2. **API route (`/api/auth/login`):** reads `request.json()`, looks up the user by email via a `$1` placeholder query; compares the password with `bcrypt.compare` against the stored hash; on success generates `crypto.randomUUID()` token and INSERTs it into `sessions` with `expires_at = NOW() + INTERVAL '7 days'`; sets the `session_token` cookie (httpOnly, sameSite lax, 7-day maxAge)
3. **SQL:** reads `users` (email match), writes `sessions` (one row per login)
4. **Response:** `{ user: {id, name, email, role} }` — never the hash; 401 with one generic error otherwise
5. **Page:** stores nothing but the cookie (the browser does); every later request carries it automatically

### Who-am-I / logout
- `GET /api/auth/me` → `getCurrentUser()` (in `lib/auth.ts`): reads the cookie, JOINs `sessions` → `users` on `user_id`, requires `expires_at > NOW()`, returns the user or `null` → 200 or 401
- `POST /api/auth/logout` → DELETE the session row by token + delete the cookie

### Gotchas learned while building
- Cookie NAME is a contract: login sets `session_token`; every reader must ask for the same string
- The cookie is a pointer (token) — identity is always re-derived server-side, never trusted from the client

---

## Feature: Admin — create question

### Flow
1. **Page (`/admin`, client):** admin types question text, 4 option inputs (radio picks `correctOption`), `marks` as string → `Number(marks)` at submit. Picker is 4 inputs rendered from an array; option i updates via `map` with a new array. On submit, POSTs `{ text, options, correctOption, marks: Number(marks) }`.
2. **API POST (`/api/questions`):** validates presence, `Array.isArray(options) && length === 4`, `Number.isInteger(correctOption) && 0–3`; inserts with `JSON.stringify(options)` + `::jsonb` cast, `RETURNING id, ...`, returns 201 or 400/500 with specific message.
3. **API GET (`/api/questions`):** `SELECT id, text, options, correct_option, marks FROM questions ORDER BY id DESC` → `{ questions: rows }` (pg parses JSONB → JS arrays).
4. **Page (read):** `useEffect(..., [])` calls `loadQuestions()` on mount; after POST success, calls it again (read-after-write) and resets the form; `questions.map` renders the pool with green pill for the correct option.

---

## Feature: Admin — create assessment

### Flow
1. **Page (`/admin/assessments`, client):** admin fills title, description, duration (string → `Number` at submit), window via two `datetime-local` inputs (strings like `"2026-08-23T14:00"`), `show_result` checkbox, and checks questions. Checked IDs live in `selectedQuestionIds: number[]` (toggle via `includes` / `filter` / spread). On submit, POSTs `{ title, description, duration_minutes: Number(...), starts_at, ends_at, show_result, question_ids }`.
2. **API POST (`/api/assessments`):** validates each field with a specific 400 (future start, ends after start, at least one question), checks `getCurrentUser()` → 401/403, then `BEGIN`, `INSERT INTO assessments ... RETURNING id`, loop `INSERT INTO assessment_questions` with `order_index = i`, `COMMIT` (or `ROLLBACK` on catch), returns 201.
3. **SQL writes:** one row in `assessments`, N rows in `assessment_questions` atomically. `pool.connect()` is required so BEGIN/COMMIT stay on one connection.
4. **API GET (`/api/assessments`):** one query: `FROM assessments a LEFT JOIN assessment_questions aq LEFT JOIN questions q`, `json_build_object` per question, `jsonb_agg(... ORDER BY order_index) FILTER (WHERE q.id IS NOT NULL)` to collect, `COALESCE(..., '[]'::jsonb)` for empty, `GROUP BY a.id`. Returns `{ assessments: [...] }` where each assessment has a nested `questions` array.
5. **Page (read):** `useEffect(..., [])` calls `loadAssessments()` and `loadQuestions()` on mount; after POST success, `loadAssessments()` refetches the roster (read-after-write), resets the form, shows success. Error branches check `res.ok` before `res.json()`, and parse `err.error` for the specific server message.

### Gotchas learned while building (assessments)
- `json_agg` vs `jsonb_agg` type mismatch with `'[]'::jsonb` → 500. Both sides of `COALESCE` must be same JSON type.
- Without `FILTER (WHERE q.id IS NOT NULL)`, an empty assessment becomes `[{"id":null,…}]` instead of `[]`.
- Copy-paste of `loadAssessments` → `loadQuestions` needs URL, setter, and error message all renamed — miss one and the picker stays empty.
- `datetime-local` AM/PM: `02:00` vs `14:00` is a 12-hour gap; future-start validation correctly rejected the AM time, but a generic "Bad Request" hid it until specific messages were added.

---

## Schema cheat-sheet

_Once migrations are written, each table gets a 3-line summary here (what it stores,
what keys it has, what flows read/write it)._

### users
Stores every person in the app, both roles in one table. Keys: `id` (PK), `email` (UNIQUE).
Written by: seed script, (future) auth login reads it. `role` CHECK limits to 'student'/'admin'.

### questions
The MCQ pool — text, the 4 options (JSONB), which option is correct (0–3), per-question marks.
Keys: `id` (PK). Written by: admin "create question" flow. Read by: exam page, admin lists.

### assessments
One exam: title, description, time limit, the schedule window (`starts_at`/`ends_at`), and the
visibility switch `show_result`. Keys: `id` (PK), `created_by` (FK→users). Read by: both
dashboards to build "upcoming / available / closed" lists.

### assessment_questions
The link table: which questions belong to which assessment, in what order, with what marks.
Keys: `id` (PK), `assessment_id` (FK), `question_id` (FK), UNIQUE pair. This is the join path
the exam page walks: assessment → links → questions.

### attempts
One row per student per sitting: who sat which assessment, when, score, and status
('in_progress' | 'submitted'). Keys: `id` (PK), `student_id` (FK→users), `assessment_id` (FK).
Written by: exam start (in_progress) and submit/auto-submit (submitted + score). Read by:
student dashboard (finished list), admin results view.

### answers
Per-question selections inside an attempt. Keys: `id` (PK), `attempt_id` (FK), `question_id` (FK).
Written by: exam page as student clicks options. Read by: scoring (compare `selected_option`
vs `questions.correct_option`), admin per-question review.