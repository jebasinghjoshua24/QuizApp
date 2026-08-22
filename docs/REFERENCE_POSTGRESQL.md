# PostgreSQL Reference — what's built into the database

> **CHEAT-SHEET MAP**
> Stuck on the **framework** (routing, cookies, responses)? → `REFERENCE_NEXTJS.md`
> Stuck on the **language** (types, operators, imports)? → `REFERENCE_TYPESCRIPT.md`
> Stuck on the **data** (SQL, tables, queries)? → **you are here**
> Stuck on the **UI logic** (components, state, events)? → `REFERENCE_REACT.md`
> Stuck on the **styling** (classes, layout, colors)? → `REFERENCE_TAILWIND.md`
>
> Rule: search your sheet for 2 minutes. Still stuck? Ask me — I'll give you
> the algorithm, not the code.

Lookup sheet: **syntax → what it does → input → output.** The SQL we use in
this project. SQL is case-insensitive for keywords; we uppercase them by habit.

## The big idea vs JS
SQL is *declarative*: you describe WHAT rows you want, the DB figures out HOW.
No loops — you say "give me all rows where X", it returns a set.

## Statements

### `CREATE TABLE` — make a table
- **Syntax:**
  ```sql
  CREATE TABLE users (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL
  );
  ```
- **Does:** defines a table + its columns
- **Input:** column definitions (name TYPE constraints, comma-separated)
- **Output:** an empty table (or an error — table already exists)

### `INSERT INTO ... VALUES` — add rows
- **Syntax:** `INSERT INTO users (name, email) VALUES ('Ada', 'a@b.c');`
- **Does:** creates one row per VALUES group
- **Input:** (column list) must match (values) in ORDER, one-to-one
- **Output:** the "INSERT 0 N" status (N = rows added)
- **Gotcha:** values can be multiple groups separated by commas: `VALUES (...), (...), (...)`

### `SELECT ... FROM ... WHERE ...` — read rows
- **Syntax:**
  ```sql
  SELECT id, name FROM users WHERE email = $1;
  ```
- **Does:** returns rows matching the filter
- **Input:** columns (or `*` = all), table, conditions
- **Output:** a result set. In Node: `result.rows` (array of objects),
  `result.rows[0]` (first row or undefined)
- **`*`:** every column — handy, but explicit lists are safer/clearer

### `UPDATE ... SET ... WHERE` — change rows
- **Syntax:** `UPDATE attempts SET status = 'submitted', score = 8 WHERE id = $1;`
- **Does:** modifies matching rows
- **Input:** column = new value pairs, filter
- **Output:** update count

### `DELETE FROM ... WHERE` — remove rows
- **Syntax:** `DELETE FROM sessions WHERE token = $1;`
- **Does:** removes matching rows (logout!)
- **Output:** delete count

## Column types

| Type | Stores | JS equivalent | Notes |
|---|---|---|---|
| `SERIAL` | auto-increment integer | `id++` | Primary keys; DB hands out the next number |
| `INTEGER` | whole number | `number` | marks, order_index, duration |
| `TEXT` | unlimited string | `string` | question text, titles |
| `VARCHAR(n)` | string capped at n | `string` (max) | emails, names |
| `BOOLEAN` | true/false | `boolean` | show_result |
| `TIMESTAMP` | date + time | `Date` | started_at, expires_at |
| `JSONB` | JSON document | object/array | questions.options |

## Constraints (the guardrails)

| Constraint | Syntax | Enforces |
|---|---|---|
| `PRIMARY KEY` | `id SERIAL PRIMARY KEY` | unique + never null (every row addressable) |
| `NOT NULL` | `name TEXT NOT NULL` | must be provided on insert |
| `UNIQUE` | `email VARCHAR(100) UNIQUE` | no duplicate values |
| `DEFAULT` | `marks INTEGER DEFAULT 1` | value used when not provided |
| `CHECK` | `CHECK (role IN ('student','admin'))` | arbitrary rule; insert/update refused if violated |
| `REFERENCES` | `user_id INTEGER REFERENCES users(id)` | foreign key — value must exist in the other table |

Two-column `UNIQUE`: a table-level line `UNIQUE (assessment_id, question_id)`
on its own line, spans the pair.
CHECK can also compare columns: `CHECK (ends_at > starts_at)`.

## Functions & operators (the toolbox)

### `NOW()`
- **Syntax:** `NOW()` in INSERT/SELECT
- **Does:** current timestamp
- **Output:** `TIMESTAMP` — "right now, server clock"

### `INTERVAL '7 days'`
- **Syntax:** `NOW() + INTERVAL '7 days'` / `NOW() - INTERVAL '1 day'`
- **Does:** a time span; add/subtract from timestamps
- **Input:** duration string (`'7 days'`, `'1 day'`, `'2 hours'`)
- **Output:** arithmetic on timestamps

### `BETWEEN`
- **Syntax:** `WHERE x BETWEEN 0 AND 3`
- **Does:** inclusive range check
- JS equivalent: `x >= 0 && x <= 3`

### `IN`
- **Syntax:** `WHERE role IN ('student', 'admin')`
- **Does:** "matches any of these"
- JS equivalent: `["student","admin"].includes(role)`

### `jsonb_array_length(...)`
- **Syntax:** `jsonb_array_length(options) = 4`
- **Does:** counts elements in a JSONB array
- **Input:** a JSONB array column
- **Output:** integer count

### `crypt(plaintext, gen_salt('bf'))` — pgcrypto extension
- **Syntax:** `crypt('admin123', gen_salt('bf'))`
- **Does:** bcrypt-hashes a password (needs `CREATE EXTENSION pgcrypto` first)
- **Input:** plaintext password + salt
- **Output:** a `$2a$...` hash — the ONLY form in which we ever store passwords
- **Why salt:** identical passwords get different hashes

### `JOIN` — walk the arrows
- **Syntax:**
  ```sql
  SELECT u.name FROM sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.token = $1;
  ```
- **Does:** combines rows from two tables on a matching condition
- **Input:** second table + ON condition (usually FK = PK)
- **Output:** one row per match — the join is how we follow REFERENCES arrows

### `ORDER BY`
- **Syntax:** `SELECT ... ORDER BY id DESC`
- **Does:** sorts the result (ASC default, DESC descending)
- JS equivalent: `.sort()` — but done by the DB, before the data reaches Node

### `GROUP BY` + aggregates (preview, used in results feature)
- **Syntax:** `SELECT assessment_id, SUM(marks) FROM answers GROUP BY assessment_id`
- **Does:** collapses rows into groups, computing per-group values
- JS equivalent: reduce() over a grouped map

### `RETURNING` — read what you just wrote
- **Syntax:**
  ```sql
  INSERT INTO questions (text, options) VALUES ($1, $2::jsonb)
  RETURNING id, text, options, correct_option, marks;
  ```
- **Does:** makes INSERT/UPDATE/DELETE hand back rows like a SELECT
- **Input:** the columns you want back
- **Output:** `result.rows` — no second query needed to get the new row's id

### `BEGIN` / `COMMIT` / `ROLLBACK` — transactions (all-or-nothing)
- **Syntax:**
  ```sql
  BEGIN;
  INSERT ...;
  INSERT ...;
  COMMIT;   -- both inserts become permanent together
  -- on error instead: ROLLBACK; -- both inserts vanish
  ```
- **Does:** groups statements into ONE atomic unit: either every statement
  succeeds (COMMIT) or none of them do (ROLLBACK). The DB holds the changes
  invisibly until COMMIT — other queries can't see them mid-transaction
- **From Node:** a client is needed (`pool.connect()` → `client.query('BEGIN')`
  ... `client.query('COMMIT')` / `'ROLLBACK'`), because transactions must run
  on ONE connection; `pool.query` grabs a random connection per call
- **Why we need it:** creating an assessment = INSERT assessment + INSERT N
  links. If link 3 fails, without a transaction we'd have a half-made
  assessment with 2 links. With BEGIN/COMMIT, the whole thing is saved or
  nothing is. JS equivalent: two commits in git — either both land or neither

### `json_agg(...)` — build an array of rows inside SQL
- **Syntax:**
  ```sql
  SELECT a.id, a.title,
         json_agg(json_build_object('id', q.id, 'text', q.text)) AS questions
  FROM assessments a
  LEFT JOIN assessment_questions aq ON aq.assessment_id = a.id
  LEFT JOIN questions q ON q.id = aq.question_id
  GROUP BY a.id;
  ```
- **Does:** collects all matching child rows (one per question) into a JSON
  array on the parent row — the nested-object problem solved IN the query
- **Input:** an expression (usually a json_build_object call) + you must GROUP
  BY every parent column you select
- **Output:** a JSONB array per parent row. JS equivalent: `groupBy` + map
- **Gotcha:** with LEFT JOIN, a parent with no children yields `null` —
  wrap it: `COALESCE(json_agg(...), '[]'::jsonb)` so it's always an array

### `json_build_object('key', value, ...)` — a JSON object from columns
- **Syntax:** `json_build_object('id', q.id, 'marks', aq.marks)`
- **Does:** assembles a JSON object whose keys are the strings and values are
  the columns — the shape of what json_agg collects
- **Output:** a JSON object; feeds directly into json_agg as its argument

### `LEFT JOIN` — keep parents even with no children
- **Syntax:** `FROM assessments a LEFT JOIN assessment_questions aq ON ...`
- **Does:** returns ALL left-table rows; unmatched ones get NULL for the right
  table's columns (plain JOIN would drop a parent with zero questions)
- **Input:** same as JOIN; the word LEFT changes the "keep" rule

### `COALESCE(a, b, ...)` — first non-NULL
- **Syntax:** `COALESCE(x, '[]'::jsonb)`
- **Does:** returns the first argument that isn't NULL
- **Why we need it:** turns "no questions → NULL" into "no questions → []"

### `GROUP BY` + aggregates
- **Syntax:** `SELECT assessment_id, SUM(marks) FROM answers GROUP BY assessment_id`
- **Does:** collapses rows into groups, computing per-group values; every
  column in SELECT that isn't an aggregate MUST appear in GROUP BY
- JS equivalent: reduce() over a grouped map

### `BEGIN` / `COMMIT` / `ROLLBACK` — transactions (all-or-nothing)
- **Syntax:**
  ```sql
  BEGIN;
  INSERT ...;
  INSERT ...;
  COMMIT;   -- both inserts become permanent together
  -- on error instead: ROLLBACK; -- both inserts vanish
  ```
- **Does:** groups statements into ONE atomic unit: either every statement
  succeeds (COMMIT) or none of them do (ROLLBACK). The DB holds the changes
  invisibly until COMMIT — other queries can't see them mid-transaction
- **From Node:** a client is needed (`pool.connect()` → `client.query('BEGIN')`
  ... `client.query('COMMIT')` / `'ROLLBACK'`), because transactions must run
  on ONE connection; `pool.query` grabs a random connection per call
- **Why we need it:** creating an assessment = INSERT assessment + INSERT N
  links. If link 3 fails, without a transaction we'd have a half-made
  assessment with 2 links. With BEGIN/COMMIT, the whole thing is saved or
  nothing is. JS equivalent: two commits in git — either both land or neither

### `json_agg(...)` — build an array of rows inside SQL
- **Syntax:**
  ```sql
  SELECT a.id, a.title,
         json_agg(json_build_object('id', q.id, 'text', q.text)) AS questions
  FROM assessments a
  LEFT JOIN assessment_questions aq ON aq.assessment_id = a.id
  LEFT JOIN questions q ON q.id = aq.question_id
  GROUP BY a.id;
  ```
- **Does:** collects all matching child rows (one per question) into a JSON
  array on the parent row — the nested-object problem solved IN the query
- **Input:** an expression (usually a json_build_object call) + you must GROUP
  BY every parent column you select
- **Output:** a JSONB array per parent row. JS equivalent: `groupBy` + map
- **Gotcha:** with LEFT JOIN, a parent with no children yields `null` —
  wrap it: `COALESCE(json_agg(...), '[]'::jsonb)` so it's always an array

### `json_build_object('key', value, ...)` — a JSON object from columns
- **Syntax:** `json_build_object('id', q.id, 'marks', aq.marks)`
- **Does:** assembles a JSON object whose keys are the strings and values are
  the columns — the shape of what json_agg collects
- **Output:** a JSON object; feeds directly into json_agg as its argument

### `LEFT JOIN` — keep parents even with no children
- **Syntax:** `FROM assessments a LEFT JOIN assessment_questions aq ON ...`
- **Does:** returns ALL left-table rows; unmatched ones get NULL for the right
  table's columns (plain JOIN would drop a parent with zero questions)
- **Input:** same as JOIN; the word LEFT changes the "keep" rule

### `COALESCE(a, b, ...)` — first non-NULL
- **Syntax:** `COALESCE(x, '[]'::jsonb)`
- **Does:** returns the first argument that isn't NULL
- **Why we need it:** turns "no questions → NULL" into "no questions → []"

### `GROUP BY` + aggregates
- **Syntax:** `SELECT assessment_id, SUM(marks) FROM answers GROUP BY assessment_id`
- **Does:** collapses rows into groups, computing per-group values; every
  column in SELECT that isn't an aggregate MUST appear in GROUP BY
- JS equivalent: reduce() over a grouped map

### The `::` cast — "treat this value AS that type"
- **Syntax:** `$2::jsonb`, `NOW()::date`
- **Does:** explicit type conversion — the value arrives as text, `::jsonb` makes
  Postgres validate and store it as a JSON document
- **Input:** value + target type
- **Why we need it:** `options` comes from Node as a JSON *string*
  (`JSON.stringify`); without the cast Postgres would complain or store a string

## Running SQL

| Command | Does |
|---|---|
| `psql -U postgres -d quizapp -f file.sql` | runs a whole file (one statement at a time) |
| `psql -U postgres -d quizapp -c "SQL"` | runs one statement |
| `\dt` | list tables |
| `\d table` | show a table's columns |

## Parameters from Node (the `pg` driver)

### Placeholders `$1, $2, ...`
- **Syntax:**
  ```ts
  pool.query("SELECT * FROM users WHERE email = $1 AND id = $2", [email, id])
  ```
- **Does:** the ARRAY supplies values in placeholder order; values travel as
  data, never spliced into the SQL string
- **Why:** this is THE SQL-injection defense (never build SQL with string
  interpolation of user input)
- **Input:** SQL with `$n` + array of values (n = position, 1-based)
- **Output:** query result with `.rows`
