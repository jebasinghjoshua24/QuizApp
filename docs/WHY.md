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
