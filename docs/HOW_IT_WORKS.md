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