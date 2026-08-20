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