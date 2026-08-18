# ERRORS.md — Learning Journal

Every bug found in code review gets logged here. This is YOUR study material for
the viva/demo — it proves how much you learned.

## How to use this file
- The AI (me) fills in an entry automatically whenever a bug is found in review.
- You can add your own entries too — anything you got stuck on counts.
- Before the viva: read this whole file once. These are your "before/after" stories.

## Entry format

```
### [YYYY-MM-DD] — <feature name>
- **What I wrote:** <the code/idea, in plain words>
- **What it did:** <the actual behavior/bug>
- **What it should do:** <correct behavior>
- **Lesson:** <one sentence that summarizes the fix>
```

---

## Entries

### [2026-08-18] — Schema migration (feature/schema)
- **What I wrote:** `assessment_questions` table — `question_id ... REFERENCES questions(id)` followed by `order_index` on the next line, with no comma between them
- **What it did:** psql threw a syntax error at `order_index`; the migration stopped mid-file, leaving `users`, `questions`, `assessments` created but the rest missing
- **What it should do:** every column definition in `CREATE TABLE` must be separated by a comma (last column has none)
- **Lesson:** SQL = "items in a comma-separated list". A missing comma kills the whole statement — and psql runs statements one-by-one, so a mid-file failure leaves the DB half-migrated.

### [2026-08-18] — Seed script (feature/schema)
- **What I wrote:** `crypt('admin123,', gen_salt('bf'))` — a stray comma *inside* the password string when inserting the admin user
- **What it did:** not a syntax error — the DB happily stored it. The admin's real password silently became `admin123,` (with comma). Login would fail with `admin123` and nothing would tell us why
- **What it should do:** `crypt('admin123', gen_salt('bf'))` — the comma belongs *between* arguments, not inside the string
- **Lesson:** strings are opaque to the DB — a typo inside quotes is valid data, not an error. Wrong data is worse than a crash: crashes show up, wrong data doesn't. Always re-read string literals character by character.