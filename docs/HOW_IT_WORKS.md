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
| _(not built yet)_ | — | — | — |

---

## Feature: <feature name>

_When this feature is built, its flow gets documented here like this:_

### Flow
1. **Page:** ...
2. **API route:** receives ..., does ...
3. **SQL:** queries/inserts ... into table ...
4. **Response:** returns ... to the page
5. **Page:** renders ... / handles errors by ...

### Gotchas learned while building
- ...

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