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

### [2026-08-18] — Auth login route (feature/auth)
- **What I wrote:** `return NextResponse.json({ error: "..." }), {status: 401 };` — the closing parenthesis of `.json(...)` was placed after the object, turning the return into a comma expression
- **What it did:** the handler returned `{ status: 401 }` — a plain object, not a `Response`. Next.js rejected it (route handlers must return a `Response`), giving a confusing error at runtime instead of the intended 401 JSON
- **What it should do:** `return NextResponse.json({ error: "..." }, { status: 401 });` — the status belongs INSIDE the call, as the second argument
- **Lesson:** one misplaced `)` changes what the function returns entirely. JS commas inside expressions = "evaluate left, return right". Also: the file was created in `scripts/api/auth/...` instead of `app/api/auth/...` — in Next.js, **the folder path IS the URL**. A route handler outside `app/` is never served; the app silently 404s the route.

### [2026-08-18] — getCurrentUser helper (feature/auth)
- **What I wrote:** `cookieStore.get("session-token")` — but the login route SET the cookie as `"session_token"` (underscore vs hyphen)
- **What it did:** no error at all — the lookup just never matched. Every request came back as "no token" → every protected page would have redirected to login even right after a successful login
- **What it should do:** both files must use the exact same name: `"session_token"`
- **Lesson:** two pieces of code agreeing on a string is a contract. Like two offices agreeing on a room code — the office that wrote "Room A" on the door and the guard looking for "Room B" will never connect. Silent mismatches are worse than crashes: nothing tells you the name is wrong. (A crash is a scream; this is a whisper.)
- **Also in the same file:** `SELECT u,id` — a comma where there should be a dot. SQL reads `u,id` as TWO separate things: a column called `u` (doesn't exist → error) and `id` (exists in BOTH tables → "ambiguous"). The dot joins one thing: `u.id` = "the id column of the users alias". Shopping-list lesson: "milk,bread" is two items; "milk.bread" is one item with a qualifier.

### [2026-08-18] — Login page (feature/auth)
- **What I wrote:** four import bugs on top of working logic:
  1. `import { useRouter } from 'next/router'` — wrong package: in App Router, useRouter lives in `next/navigation` (`next/router` is the old Pages Router API)
  2. `import { json } from 'stream/consumers'` — an unused Node built-in the IDE auto-imported
  3. `import { cat } from '@huggingface/transformers'` — an unused import from a package **not even installed** (this alone breaks the build: module not found)
  4. `import { serialize } from 'v8'` — a Node V8-internals function, auto-imported when typing a common name
- **What it did:** the page cannot build/run at all; and in the email input, `onChange` called `serialize(e.target.value)` instead of the email state setter — so typing in the email box never updated state, and because the input's value comes FROM state, characters didn't even appear
- **What it should do:** delete all four junk imports; `useRouter` from `next/navigation`; email onChange must call its own setter
- **Lesson:** autocomplete betrays — when you type a common word (json, serialize, cat), the IDE offers imports you never meant. Rule: **if you didn't intend the import, delete it**; and before writing `onChange`, check the state setter you're supposed to call. Also: controlled input = value comes FROM state — if the setter never fires, the field looks dead.
- **Also:** a `name` state + input existed but the login API only accepts email+password — a phantom field that does nothing. The page showed a field the backend ignores.

### [2026-08-19] — POST /api/questions (feature/questions)
- **What I wrote:** `if(!text || !options || !correctOption || !marks)` — a presence check built on falsy values
- **What it did:** rejected perfectly valid questions whose correct answer is option A — `correctOption = 0` is legal (schema allows 0–3), but `!0` is `true` in JS, so the route answered 400 "Missing required fields!" for a complete, valid payload
- **What it should do:** check for absence explicitly: `correctOption === undefined || correctOption === null` — `0` is a real value and must pass
- **Lesson:** JS truthiness is blunt — `0`, `""`, `false` are "falsy" but legitimate data. `!x` says "x has no value"; it's only safe when `0`/`""` can't occur. Real-world: a shop's `if (!items)` rejects a customer genuinely buying zero items. Presence ≠ truthiness — use `=== undefined` / `=== null`, or `??`/`?.`
- **Also in the same file:** the range error said "must be between **1 and 3**" while the code accepts **0–3** — a message contradicting its own validation (copy-paste drift; the message lied about the door). Plus two typos: "mush" → "must", "Happned" → "Happened". Error text is part of the product — users read it.

### [2026-08-19] — Admin question form (feature/questions)
- **What I wrote:** `const [questions, setQuestions] = useState([])` then `questions.map((q) => q.id)`
- **What it did:** TypeScript error `Property 'id' does not exist on type 'never'` — an empty array with no type gets inferred as `never[]` ("array of nothing"), so `q` is `never` and using its fields is illegal
- **What it should do:** label the array with its element type — `useState<Question[]>([])` where `Question` is an interface in `lib/types.ts`
- **Lesson:** TypeScript's inference is honest — given no hint, it assumes the safest (most restrictive) thing. Untyped state is an unlabeled box; the generic `useState<T[]>` is the label. This is WHY we have a `types/` shelf: shapes that travel between API and page live in one typed place, so the compiler guards both ends.

### [2026-08-19] — Admin question pool not updating (feature/questions)
- **What I wrote:** `useEffect(() => { fetch("/api/questions")... }, [])` — fetch the pool once on mount, and nothing else
- **What it did:** after creating a question, the form cleared and showed "Question created" — but the pool below showed the OLD list. The pool only updated on a manual browser refresh
- **What it should do:** refetch the pool after a successful POST so the list is always current
- **Fix:** extract the fetch into one function `loadQuestions()`; call it from the `useEffect` (mount) AND from `handleSubmit` right after success. One definition, two call sites — DRY
- **Lesson:** an empty dependency array `[]` is not "fetch whenever I want" — it is "fetch exactly once, when the component mounts." Any place the data can change needs its own call. The symptom "list is stale until I refresh" almost always means "I forgot to refetch after a mutation."

### [2026-08-19] — Runtime SyntaxError "JSON.parse: unexpected character at line 1 column 1" (feature/questions)
- **What I wrote:** `const res = await fetch("/pai/questions");` — typo: **pai** instead of **api**
- **What it did:** the fetch hit a route that doesn't exist → Next returned its **HTML 404 page** → `res.json()` tried to parse HTML → JSON.parse choked on the `<` at line 1 column 1 → unhandled promise rejection surfaced as a Runtime SyntaxError
- **What it should do:** fetch `/api/questions`; and before `res.json()`, check `res.ok` so a bad URL shows a readable message instead of a parse crash
- **Lesson:** `res.json()` ASSUMES the response body is JSON. The error "unexpected character at line 1 column 1" is the fingerprint for "I got HTML/text, not JSON" (usually a 404 page or a redirect). Always verify `res.ok` before parsing, and double-check URLs character by character — one swapped letter turns a working route into a 404.

### [2026-08-19] — POST /api/assessments (feature/assessments)
- **What I wrote:** 3 bugs in the create-assessment route:
  1. `INSERT INTO assessment` — table is **assessments** (plural) → "relation does not exist" → 500 on every POST. *Loud* failure: the DB refused.
  2. `start_at` in body + response vs `starts_at` column — inserting `undefined` into NOT NULL → insert refused; three different spellings of one name.
  3. **SILENT:** link loop bounded by `insertAssessmentResult.rows.length` (= 1, the single RETURNING row) instead of `question_ids.length` — only the FIRST selected question ever got linked, transaction committed happily, no error surfaced.
- **What it should do:** table name `assessments`; one name `starts_at` end-to-end; loop over the array you're describing — `question_ids.length`.
- **Lesson:** the loud bugs (wrong table, wrong column) are the DB doing its job — refusing impossible data. The silent bug is the enemy: it succeeded with WRONG data. Whenever you loop or `.map`, ask "which array am I describing?" — the loop's bound must be the data it consumes, not a sibling query's row count. Also: `undefined < 0` is false (falsy trap again), string-vs-Date comparisons are always false (NaN coercion), and `question_ids.length` on undefined crashes BEFORE the try block — guard inputs before touching their properties.
- **Follow-up fixes in the same route:** (a) the response object still said `start_at` after the rename to `starts_at` — every mention of a name must survive a rename, TS flags the orphan; (b) `starts_at < Date().toString()` — ISO string vs human-readable date string, digit < letter means the check is ALWAYS true → every request 400'd. Fix: compare real objects — `new Date(starts_at) < new Date()`. Rule: NEVER compare two things of different types.

### [2026-08-22] — Admin assessments types (feature/assessments)
- **What I wrote:** `import { Timestamp } from "next/dist/server/lib/cache-handlers/types"` + `Assessments` (plural) with `starts_at: Timestamp`, no `questions` field, then `}[];` after both interfaces, then `questions: []`
- **What it did:** (1) imported from Next's internal machine room — fragile and wrong type; (2) `Timestamp` is not what the browser receives — `pg` gives `Date`, `JSON.stringify` turns it into an ISO string, so the client sees `string`; (3) `}[];` after an interface is invalid TS (interface ends at `}`); (4) `questions: []` means "empty tuple, never anything inside" — an empty box that can never hold data
- **What it should do:** delete the import, name it `AssessmentWithQuestions` singular, `starts_at: string`, `description: string | null`, and `questions: { id: number; text: string; options: string[]; correct_option: number; marks: number; order_index: number }[]` — the `[]` on the property type, not the interface. The shape must photograph `json_build_object` keys exactly.
- **Lesson:** the interface is a form — `[]` after `}` staples a paperclip to the outside; `questions: {…}[]` adds a labeled blank that holds a list. And never import from `next/dist/...` — that's the factory's back room. Trace a `TIMESTAMP` end-to-end: DB → `Date` in Node → ISO `string` over JSON → `string` on the page.

### [2026-08-22] — Admin assessments page skeleton + loaders (feature/assessments)
- **What I wrote:** `useState([])` for `selectedQuestionIds`/`questions`/`assessments` (again), `duration_minutes` as `useState(0)` (number), `show_visible` instead of `show_result` default `false`, missing `Question` import and `useEffect` import, `loadAssessments` did `await res.json()` BEFORE `if (!res.ok)` then `await res.json()` again inside the error branch, and `loadQuestions` was a copy-paste of `loadAssessments` still fetching `"/api/assessments"` and calling `setAssessments`
- **What it did:** (1) `never[]` again — `q.id` illegal; (2) `onChange` string into a number slot → TS error; (3) third name for one concept → mapping bug at POST; (4) parse-before-check + double read — HTML 404 would throw on the first parse, and even on JSON the second parse fails with "body already consumed" (a fetch body is a single-use letter); (5) questions pool stayed empty, assessments got overwritten with question data
- **What it should do:** `useState<number[]>([])` / `useState<Question[]>([])` / `useState<AssessmentWithQuestions[]>([])`, import `Question`, `duration_minutes: "60"` as string + `Number()` at submit, `show_result: true`, check `!res.ok` BEFORE any `await res.json()` and parse only once, and when duplicating a loader rename ALL three nouns: URL, setter, and error message
- **Lesson:** `never[]` recurs if the label is forgotten — the compiler guards both ends only when the interface is imported. Inputs always give strings; check the server's contract name, not a synonym. A fetch body is a letter you can only open once. Copy-paste is a photocopier — change the address, the filing cabinet, and the label, or the truck drives to the wrong building.

### [2026-08-22] — Assessment create handler + form JSX + GET query (feature/assessments)
- **What I wrote:** handler posted to `"/api/assignments"` (wrong word) with `question_ids` (undefined var) and `duration_minutes` as a string, did `const data = await res.json()` before `if (!res.ok)`, called `loadQuestions()` after creating an assessment, and `setSelectedQuestionIds<number[]>([])`; form was `<form>` with no `onSubmit`, no submit button, `<input type="textarea">`, and `required` on the `show_result` checkbox; picker and roster were missing; GET used `json_agg` with `'[]'::jsonb` and no `FILTER`, and never selected `a.created_by`
- **What it did:** (1) `assignments` 404 → HTML → `res.json()` threw; (2) `question_ids: undefined` → API 400 "Pick at least one"; (3) string duration slipped past `< 0` by accident; (4) generic `setSelectedQuestionIds<number[]>` is invalid syntax (generics only on declaration); (5) `<form>` without `onSubmit` never fired — Enter just reloaded the page; (6) `type="textarea"` rendered as a plain text box; (7) `required` on the checkbox forced `show_result = true` always; (8) `json_agg` + `'[]'::jsonb` → Postgres 500 "could not convert type jsonb to json"; without `FILTER` an empty assessment would return `[{"id":null,…}]` instead of `[]`; missing `a.created_by` left `created_by: undefined` while the interface promised `number`
- **What it should do:** URL `/api/assessments`, `question_ids: selectedQuestionIds`, `duration_minutes: Number(duration_minutes)`, check `!res.ok` then parse `err.error`, `loadAssessments()`, `setSelectedQuestionIds([])`, `<form onSubmit={handleSubmit}>` + `<button type="submit">`, `<textarea>`, remove `required` from checkbox, picker with `includes`/`filter`/spread inside the form, roster below the form, and GET `COALESCE(jsonb_agg(... ) FILTER (WHERE q.id IS NOT NULL), '[]'::jsonb)` plus `a.created_by` in the SELECT
- **Lesson:** a form without `onSubmit` or a button is a door with no handle. `type="textarea"` doesn't exist — the element is `<textarea>`. `required` on a checkbox means "must be checked" like a terms box, not a boolean field. And `COALESCE` needs matching types — `json_agg` is `json`, `jsonb` is `jsonb`; `LEFT JOIN` + `json_agg` without `FILTER` aggregates a ghost row of nulls — the filter exorcises it. `starts_at` AM (`02:00`) vs PM (`14:00`) is a 12-hour gap; a future-start check correctly rejected AM, but a generic "Bad Request" hid the reason until specific messages and `err.error` wiring exposed it.

### [2026-08-22] — Student dashboard API (feature/student-dashboard)
- **What I wrote:** `app/api/student/dashboard/route.ts` started as 13 lines with only `getCurrentUser` + 401/403 and no queries, then `const upcomming = await pool.query(...)` with `WHERE id NOT IN (...)` but returned `{ upcomming: upcomming, finished: finished }` (the whole result objects), and `ORDER BY att.submmitted_at` (double m)
- **What it did:** (1) stub returned `undefined` (no `return` after auth) → client hung; (2) `upcomming` typo → `data.upcoming` was `undefined`, upcoming list forever empty with no error; (3) `submmitted_at` → Postgres 500 "column does not exist" — one extra letter, whole route 500s; (4) returning the `pool.query` result object instead of `.rows` → `upcoming.rows` as an object, `upcoming.map` threw "not a function" on the page
- **What it should do:** variable `upcoming`, order `submitted_at` (one m), `return { upcoming: upcoming.rows || [], finished: finished.rows || [], user }` — the `|| []` keeps the page from crashing on first load before data arrives, and `user` is already in scope from `getCurrentUser()` so the profile needs no second fetch
- **Lesson:** the DB is literal — `submmitted` vs `submitted` is a different word. The wire format matters: `pool.query` returns `{ rows }`, not the array. And spelling is a contract — the API key `upcomming` and the client's `upcoming` must match character-for-character, or the list is silently empty (another whisper bug).

### [2026-08-22] — Student dashboard page shell + data wiring (feature/student-dashboard)
- **What I wrote:** `export default function dashboard()` (lowercase) with `useState([])` for `upcoming`/`finished` (again `never[]`), `const [user, setUser] = useState<User[]>([])` (array), no `User`/`FinishedItem` in `lib/types.ts` yet, `loadData` defined but no `useEffect` and `const data = await res.json()` with no `setUser`/`setUpcoming`/`setFinished`, then `upcoming.map(a => <div>` with no `key` and `<button>Start Assessment</button>` with no `onClick`, `finished` section missing entirely, and `Reslts hidden` typo
- **What it did:** (1) lowercase component name works but breaks convention and React DevTools display; (2) `never[]` again — `a.title` illegal; (3) `User[]` is "list of users" while the API gives one user object — `user.name` would be `undefined`; (4) `loadData` never called → page fetched nothing, roster stayed "coming soon"; (5) data fetched but discarded → still empty; (6) no `key` → React warning + unstable re-renders; (7) button with no handler → Start did nothing; (8) finished section absent → finished list never shown
- **What it should do:** `Dashboard` PascalCase, `useState<AssessmentWithQuestions[]>([])` / `useState<FinishedItem[]>([])`, `useState<User | null>(null)`, add `User` + `FinishedItem` interfaces that photograph the API's `SELECT` keys, `useEffect(() => { loadData(); }, [])`, then `setUser(data.user)` etc. inside `loadData`, `upcoming.map(a => <div key={a.id}>` + `onClick={() => router.push(\`/exam/${a.id}\`)}`, finished block with `key` and `f.show_result ? \`Score: ${f.score}\` : "Results hidden"` (spelled correctly), and `error` at the top with `res.ok` before `res.json()`
- **Lesson:** the same `never[]` returns whenever the label is forgotten — check `lib/types.ts` exports before importing. A function you never call is a letter you never sent. `data` you never store is a delivery you left on the porch. `key` and `onClick` are not decoration — without `key` React loses track, without `onClick` a button is a sticker.