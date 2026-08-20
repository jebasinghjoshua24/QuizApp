# TypeScript Reference — what's built into the language

> **CHEAT-SHEET MAP**
> Stuck on the **framework** (routing, cookies, responses)? → `REFERENCE_NEXTJS.md`
> Stuck on the **language** (types, operators, imports)? → **you are here**
> Stuck on the **data** (SQL, tables, queries)? → `REFERENCE_POSTGRESQL.md`
> Stuck on the **UI logic** (components, state, events)? → `REFERENCE_REACT.md`
> Stuck on the **styling** (classes, layout, colors)? → `REFERENCE_TAILWIND.md`
>
> Rule: search your sheet for 2 minutes. Still stuck? Ask me — I'll give you
> the algorithm, not the code.

Every entry: **syntax → what it does → input → output.** This is a lookup sheet,
not a tutorial. If you don't know which piece you need, read the feature
algorithm and hunt here.

## Core types (annotations)

### `string`, `number`, `boolean`
- **Syntax:** `let name: string = "Ada";`
- **Does:** restricts what values the variable may hold
- **Input:** the value
- **Output:** compile-time check — wrong type = error before runtime
- JS equivalent: same values, but JS never checks

### `any`
- **Syntax:** `let x: any;`
- **Does:** disables checking (escape hatch)
- **Why it's a smell:** brings back the JS bugs TS exists to kill. Only for
  migrating legacy code.

### `null` and `undefined`
- **Syntax:** `let x: string | null = null;`
- **Does:** `|` builds a **union type** — "this variable can be a string OR null"
- **Input/Output:** union types make "maybe absent" visible in the signature

### `Date`
- **Syntax:** `const d: Date = new Date();`
- **Does:** a point in time (the JS Date object)
- **Input:** constructor, timestamps, etc.
- **Output:** an object with date methods

### Arrays
- **Syntax:** `let opts: string[] = [];`
- **Does:** array whose elements must be `string`
- JS equivalent: `[]`, but checked element type

### Objects (inline type)
- **Syntax:** `let user: { id: number; name: string } = { id: 1, name: "Ada" };`
- **Does:** exact shape requirement

### `interface` / `type`
- **Syntax:**
  ```ts
  interface User { id: number; name: string }
  type User = { id: number; name: string };
  ```
- **Does:** names a shape so you can reuse it everywhere
- **Input:** fields with types
- **Output:** a reusable type name; `interface` for objects, `type` for unions

## Functions

### Parameter + return types
- **Syntax:** `function add(a: number, b: number): number { return a + b; }`
- **Does:** types the inputs AND the output; callers must match
- JS equivalent: same function, untyped

### Arrow functions with types
- **Syntax:** `const add = (a: number, b: number): number => a + b;`

## Async / promises

### `async` / `await`
- **Syntax:** `async function f(): Promise<string> { ... }`
- **Does:** `async` makes a function return a **Promise**; `await` unwraps a
  promise into its value inside async functions
- **Input:** a Promise
- **Output:** the resolved value (or throws if rejected)
- JS equivalent: identical — TS just types the Promise: `Promise<string>` =
  "promise that resolves to a string"

### `Promise<T>`
- **Syntax:** `Promise<string>`, `Promise<User>` — the generic version of "later value of T"

## TypeScript tricks we use

### Optional chaining `?.`
- **Syntax:** `cookie?.value`
- **Does:** if the thing before `?.` is null/undefined, the whole expression
  yields `undefined` instead of throwing
- **JS equivalent:** the same operator (it's also JS!)

### Nullish coalescing `??`
- **Syntax:** `a ?? b`
- **Does:** `a` if `a` is not null/undefined, otherwise `b`
- **Different from `||`:** `||` also treats `0`, `""`, `false` as "empty";
  `??` only null/undefined

### Destructuring
- **Syntax:** `const { email, password } = body;`
- **Does:** pulls named fields out of an object into variables
- JS equivalent: same operator, typed

### `process.env.X`
- **Syntax:** `process.env.DATABASE_URL`
- **Does:** reads an environment variable (set in `.env.local` for Next)
- **Input:** variable name
- **Output:** the string value or `undefined`

### Import / export
- **Syntax:** `import pool from "@/lib/db";` / `export default pool;`
- **Does:** `export` makes something available outside the file; `import` pulls
  it in. `default` = the file's main export (one per file)
- **Input/Output:** values across files

## Error handling & validation tools

### `try / catch`
- **Syntax:**
  ```ts
  try { ... } catch (err) { ... }
  ```
- **Does:** runs the try block; if anything inside throws, jumps to catch with
  the error object
- **Input:** the thrown error
- **Output:** your handling code (log, return 500, etc.)
- Express equivalent: error middleware; here we wrap routes manually

### `Array.isArray(x)` — the truth about arrays
- **Syntax:** `Array.isArray(options)`
- **Input:** anything
- **Output:** `true` only if it's a real array
- **Why:** `typeof []` returns `"object"` — typeof lies about arrays. This is
  the honest check

### `Number.isInteger(x)`
- **Input:** anything
- **Output:** `true` only for whole numbers — and it rejects `"5"` (string),
  `5.5`, `NaN`
- **Use:** validating ids, indexes, marks

### `JSON.stringify(x)` / `JSON.parse(x)`
- **Syntax:** `JSON.stringify({ a: 1 })` → `'{"a":1}'` / `JSON.parse(...)` → `{ a: 1 }`
- **Does:** object → JSON text (stringify), JSON text → object (parse)
- **Why:** the wire (fetch bodies, responses) and the DB (`::jsonb`) talk TEXT —
  you stringify on the way out, parse on the way in

## THE falsy trap (your bug, 2026-08-19)

### `!value` means "not a real value" — but it lies about 0 and ""
- **Falsy values in JS:** `0`, `""`, `false`, `null`, `undefined`, `NaN`.
  `!x` is true for ALL of them
- **The bug it caused:** `if (!correctOption)` rejected `correctOption = 0` —
  option A, a completely legal answer — as "missing"
- **The rule:** presence-checks must be explicit:
  `if (x === undefined || x === null)` — never `!x` when `0` or `""` are
  legitimate values
- **The precise tools:** `?.` (missing-safe access) and `??` (fallback) exist
  because truthiness is blunt
