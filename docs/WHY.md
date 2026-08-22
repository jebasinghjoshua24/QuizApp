# WHY.md — The Design-Decision Log

**The "why" of every feature.** While HOW_IT_WORKS.md traces *what happens*,
this file records *why we chose to do it that way* — every decision, its reason,
and what we avoided by choosing it.

Format rule: ONE entry per merged feature. Written after merge+push.
The viva question this file answers: *"Why did you build it this way?"*

---

## feature/schema — merged 2026-08-18

### Why two roles live in ONE `users` table (with a `role` column)
A student and an admin are the same shape of thing: an id, a name, an email, a
password. Two tables would duplicate login, sessions, and every query. One table
+ `CHECK (role IN ('student','admin'))` = one auth flow, role decides what pages
you may see. This is the same idea as a company directory listing everyone
regardless of position.

### Why `questions.options` is a JSONB array instead of 4 columns
The question owns its options — splitting them into `option_a..option_d`
columns would force every query to touch 4 columns even when it only needs one,
and make "which option belongs where" an app-level problem. JSONB keeps the
bundle together, and `CHECK (jsonb_array_length(options) = 4)` enforces the
"exactly 4 choices" rule at the data layer. JS equivalent: an array property
instead of four parallel variables.

### Why `correct_option` is an index (0–3), not the answer text
Scoring is then a pure comparison: `answers.selected_option = questions.correct_option`.
The answer text may be edited someday without breaking the scoring; the index is
stable. Indexes also match JS array indexing (`options[2]` is the 3rd option).

### Why the `assessment_questions` link table exists
This is the classic **many-to-many** resolution: one assessment has many
questions, one question appears in many assessments. A link table carries the
relationship AND the relationship-specific data (order, per-question marks).
The `UNIQUE (assessment_id, question_id)` pair stops the same question from
being added twice to one assessment — enforced by the DB, not the UI.

### Why `starts_at` / `ends_at` on assessments
"Upcoming / available / closed" are then *derived states*, computed by one
comparison against `NOW()`. No scheduled jobs, no app-level timers — the DB is
the single clock. `CHECK (ends_at > starts_at)` makes a nonsense window
unrepresentable.

### Why `show_result` sits on the assessment
The visibility control is a property of the *exam*, not of each student —
one switch governs everyone. It also lives next to the data it controls, so
"hide/show results" is one UPDATE, not app logic.

### Why attempts and answers are two tables
One `attempts` row = one sitting (who, which exam, when, final score, status).
`answers` rows = the per-question record inside that sitting. Splitting them
means the dashboard can list finished exams by reading `attempts` alone (fast),
while per-question review stays possible via `answers`. The `score` on
`attempts` is a deliberate denormalization — cheap display, detail preserved.

### Why FOREIGN KEY constraints everywhere
The DB refuses impossible data: no attempt by a missing student, no link to a
missing question. In SQLite-era apps these bugs surface as runtime surprises;
here the insert itself fails loudly at the point of entry.

### Why pgcrypto + `crypt('pw', gen_salt('bf'))` in the seed
Passwords must be stored hashed, and seeding needs hashes before any app code
exists. pgcrypto does bcrypt (`bf`) inside SQL. `gen_salt` adds a random salt,
so identical passwords produce different hashes — the same reason bcryptjs
salts at login. The `$2a$` output format is compatible with bcryptjs, so
`bcrypt.compare()` in Node verifies SQL-made hashes.

### Why seed dates use `NOW() - INTERVAL '1 day'`
The seed data must always be sensible *whenever it's run* — relative dates
guarantee one assessment is available and one is upcoming on every fresh
database. Absolute dates would rot the demo.

---

## feature/auth — merged 2026-08-18

### Why DB sessions instead of JWT
A JWT is a self-contained token the server must *verify*; a DB session row is
state the server *owns*. Consequences: logout = DELETE the row (instant, on any
device); expired sessions can be pruned; no signing secret to leak; a stolen
cookie dies with the row. For a college demo the viva line is also cleaner:
"the server is the source of truth for who is logged in." JWT's advantage
(no DB lookup per request) is irrelevant at our scale.

### Why the session token is `crypto.randomUUID()`
128 random bits — unguessable by enumeration. The `UNIQUE` constraint on
`sessions.token` makes a collision an error rather than a takeover.

### Why cookie expiry (maxAge 7d) mirrors `expires_at` (INTERVAL '7 days')
Two clocks must say the same thing: the cookie tells the browser when to stop
sending the token, the row tells the server when to stop accepting it. The
server-side query (`expires_at > NOW()`) is the authority; the cookie is just
politeness to the browser.

### Why `httpOnly: true` and `sameSite: 'lax'`
httpOnly = the page's JavaScript cannot read the cookie, so an XSS payload
cannot exfiltrate the session. sameSite: 'lax' = the browser won't send the
cookie on cross-site requests, blunting CSRF. Two lines, two attack classes,
no app code.

### Why one generic "Invalid email or password" error
Two distinct errors ("no such user" vs "wrong password") let attackers probe
which emails exist — user enumeration. One message leaks nothing.

### Why the API never returns `password_hash`
The response shape is part of the attack surface; the hash is needed only at
compare time, inside the server. The login route and `getCurrentUser()` both
SELECT only the fields the client may see.

### Why `$1` placeholders, never string interpolation
Parameterized queries are the SQL-injection defense: user input travels as
data, never as SQL text. (`pg` sends them separately from the query.)

### Why `lib/auth.ts` exists as the single auth check
`getCurrentUser()` is needed by /me, the login page, both dashboards, the exam
page, and the results API. One implementation = one place to fix a bug, one
behavior everywhere. The route files stay thin (10 lines), so a route's job is
readable at a glance — the bug-friendly architecture rule paying off.

### Why the login page will read `/api/auth/me` instead of storing state
After login the browser holds a cookie, not knowledge. "Who am I?" is answered
by asking the server — the cookie means nothing to the page itself. Server
redirects (by role) then use the same single source of truth.

### Why logout deletes the row AND the cookie
Both halves of the session die: the logbook page (sessions row) and the card
(wallet cookie). Delete unconditionally, even with no token — a stale card
must not survive in the browser. This is the "sessions over JWT" payoff in
action: logout is a DELETE, not a blacklist.

### Why the login page is a client component with useState
The page needs live state (typing, error message, redirect) — that's browser
territory. `"use client"` + controlled inputs make the form's state the single
source of truth; the role-based `router.push` after success is the whole
frontend auth: no tokens in localStorage, nothing to secure client-side.

### Why basic Tailwind now, full styling later
Pages get functional styling as they're built (so testing isn't painful); the
visual pass (animations, spacing, design system) is deliberately deferred to
`feature/polish` — styling before the features exist would be re-styling. Form
first, then polish — the professional order.

---

## feature/questions — merged 2026-08-19

### Why the API validates what the DB already enforces
The schema's CHECK constraints (4 options, index 0–3) are the *last* line of
defense — they stop invalid rows from existing. But a constraint violation
surfaces as an ugly 500. The API re-checks the same rules *before* the query so
the user gets a clean 400 with a readable message ("Options must be exactly 4").
Same rules, two layers: friendly errors at the door, absolute safety at the vault.

### Why explicit `=== undefined` checks instead of truthiness
`!correctOption` would reject `0` — a valid answer index. Truthiness says "0 is
nothing," which is wrong for an index. The explicit `x === undefined || x === null`
check asks exactly "is the field missing?", the precise question validation
needs. This is the "falsy trap": `0`, `""`, and `false` are all "falsey" but
often perfectly legal values.

### Why `$2::jsonb` instead of a plain parameter
The options array arrives as a JS array; pg needs to know the target type to
serialize it correctly. The `::jsonb` cast tells Postgres "treat this text as
JSONB," which also runs the DB's own JSON validation on the way in. The JS
equivalent: `JSON.stringify` in the values array pairs with the cast in the SQL.

### Why `RETURNING` instead of a second SELECT
INSERT + SELECT back = two round trips and a window where a bug could hide
between them. `RETURNING` hands the inserted row back in the same statement —
one trip, guaranteed-consistent snapshot. The page then shows the new question
without ever re-reading the whole table.

### Why GET wraps rows in `{ questions: [...] }`
A bare array in JSON is fragile — an object envelope leaves room to grow
(pagination, count) without breaking every consumer later. The page reads
`data.questions`; if we later add `{ questions, total }`, existing code keeps
working. Shape changes become additions, not breaking changes.

### Why the pool refetches after a create (read-after-write)
Data that changed on screen must match the data on the server. After POST
succeeds, the page refetches the pool — the list is the server's answer, not a
client-side guess. The alternative (optimistically appending the returned row)
saves one request but can drift out of sync (ordering, ids, server-side edits).
For our scale, correctness beats one HTTP call.

### Why one `loadQuestions()` function used twice (DRY)
Mount and post-create both need the same fetch. Two copies of the fetch would
mean two places to fix when the API changes — and drift (one copy still hitting
a typo'd URL, as happened). One definition, two call sites: the function is
the single source of truth for "how the pool loads." The empty `[]` dependency
array is the "run once on mount" switch — an effect with *no* array runs on
every render, which we learned the hard way becomes an infinite fetch loop.

### Why `lib/types.ts` holds the shared `Question` interface
The same shape crosses the API boundary (snake_case DB columns) into the page.
One interface in one file means the compiler guards both ends: if the API or
the page drifts from the shape, TypeScript fails the build instead of the
runtime. This is the `types/` shelf from the architecture plan — the contract
between backend and frontend, written once.

### Why the admin page combines form + pool on one screen
Creating a question is an *edit* operation: you type, you see it land. Splitting
form and pool into two pages would break the feedback loop (did it save?).
The two-column layout shows cause and effect side by side — form left, result
right — so the admin always sees the consequence of their action without
navigating.

### Why the styling carve-out (Rule 5) applied to these pages
Login and admin now share one visual language (gray page, white cards, blue
buttons, red/green alert boxes). The user authors the logic; the AI authors the
Tailwind — so consistency is automatic instead of aspirational. The user can
still *read* every class (they're plain-English utilities), which is enough to
debug. Styling stays out of the learning stack and out of the critical path.

---

## feature/assessments — merged 2026-08-22

### Why BEGIN/COMMIT/ROLLBACK (a transaction) for creating an assessment
Creating an assessment is **two writes**: one row in `assessments`, N rows in
`assessment_questions`. Without a transaction, link 3 could fail and leave an
orphaned assessment with 2 links — committed, visible, incomplete. `BEGIN`
holds both writes invisibly; `COMMIT` makes them permanent together, `ROLLBACK`
erases both on any failure. The DB version of "both git commits land or neither."

### Why `pool.connect()` for the transaction, not `pool.query`
A transaction must run on **one connection** — `BEGIN` on connection A and
`COMMIT` on connection B are unrelated. `pool.query` grabs a random connection
per call, so it can't hold a transaction. `pool.connect()` checks out one
client, `client.query('BEGIN')…client.query('COMMIT')` stays on that client,
and `finally { client.release() }` returns it. Reads like `GET` can stay on
`pool.query` because they are single statements.

### Why the API re-validates before the DB (and with specific messages)
The DB's `CHECK (ends_at > starts_at)` would 500 on a backwards window. The
API checks the same rules *plus* product rules (`starts_at` must be future,
at least one question) and returns a **specific 400 per field** ("Pick at least
one question", "Starts at must be in the future"). The old generic "Bad Request"
hid which field failed — the AM/PM bug proved a generic message costs hours.
Same rules, two layers: friendly at the door, absolute at the vault.

### Why `starts_at` must be future (and why AM/PM bit us)
A past window creates an assessment that is already closed on creation — useful
nowhere, confusing everywhere. `new Date(starts_at) < new Date()` enforces
"future only" in the API. The `datetime-local` input has no AM/PM label beyond
the clock you type — `02:00` vs `14:00` is a 12-hour gap, and the validation
correctly rejected the AM time as past. Lesson: show the exact server message
(`err.error`) instead of a generic one, or the user hunts blind.

### Why `question_ids: number[]` and `order_index = loop index`
The picker is a shopping cart — checked IDs live in `selectedQuestionIds`. The
array order *is* the display order, so `order_index = i` needs no extra UI.
Sending IDs (not full objects) keeps the payload small; the link table adds
`order_index` and per-question `marks` on the server. Alternatives (drag-and-drop
ordering, per-question marks in the form) are polish-phase complexity.

### Why one GET nests questions with `jsonb_agg` + `LEFT JOIN` + `FILTER`
The page needs **one assessment object with a `questions` array inside**. Three
tables form a chain: assessments ← links ← questions. `LEFT JOIN` keeps
assessments with zero questions (plain `JOIN` would drop drafts). `json_build_object`
bundles one question's columns, `jsonb_agg(... ORDER BY order_index)` collects
them, `FILTER (WHERE q.id IS NOT NULL)` stops the empty case from becoming
`[{"id":null,…}]`, and `COALESCE(…, '[]'::jsonb)` turns no-questions into `[]`.
`GROUP BY a.id` collapses the flat join rows (one per link) into one row per
assessment. `jsonb_agg` (not `json_agg`) is required because `'[]'::jsonb` is
`jsonb` — `COALESCE` needs matching types, the 500 we hit. One query, nested
shape, no JS assembly.

### Why `lib/types.ts` mirrors `json_build_object` keys exactly
`AssessmentWithQuestions` is a photograph of the GET response. Every
`'key', value` in `json_build_object` becomes a field in the `questions`
sub-object. If SQL says `'text'`, TypeScript must say `text` — `question_text`
would be `undefined` at runtime while the compiler stays quiet. `starts_at`/
`ends_at` are `string` (JSON turns `TIMESTAMP` → ISO string), `description`
is `string | null` (nullable column), `questions` is the array-of-objects.

### Why form + picker + roster live on one page
Creating an assessment is an *edit-and-verify* loop: pick, set window, see it
land. A separate "create" page and "list" page would break the feedback — did
it save? Two-column layout (form left, roster right) shows cause and effect
without navigation. The picker lives inside the form because `selectedQuestionIds`
is part of the POST body; the roster refreshes via `loadAssessments()`
(read-after-write) so the list is the server's truth, not an optimistic guess.

### Why the admin nav pill between Questions and Assessments
Two admin managers share one segment (`/admin`). A pill nav (`Questions` /
`Assessments`) with active = white makes the second manager discoverable — the
earlier `← Back` button hid the feature. The nav lives in each page's header
(styling domain) so the logic page stays focused, and `router.push` keeps it a
client navigation without a full reload.
