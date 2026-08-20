# Next.js Reference — what's built into the framework

> **CHEAT-SHEET MAP**
> Stuck on the **framework** (routing, cookies, responses)? → **you are here**
> Stuck on the **language** (types, operators, imports)? → `REFERENCE_TYPESCRIPT.md`
> Stuck on the **data** (SQL, tables, queries)? → `REFERENCE_POSTGRESQL.md`
> Stuck on the **UI logic** (components, state, events)? → `REFERENCE_REACT.md`
> Stuck on the **styling** (classes, layout, colors)? → `REFERENCE_TAILWIND.md`
>
> Rule: search your sheet for 2 minutes. Still stuck? Ask me — I'll give you
> the algorithm, not the code.

Lookup sheet: **syntax → what it does → input → output.** Next.js 16 App Router.

## The routing model (most important concept)

**The folder path IS the URL.** Files inside `app/` become routes.

| File | URL it serves | Purpose |
|---|---|---|
| `app/api/auth/login/route.ts` | `POST /api/auth/login` | API endpoint |
| `app/login/page.tsx` | `GET /login` | A page |
| `app/layout.tsx` | every child route | Shared shell (headers, nav) |

Rules: only `route.ts` and `page.tsx` are special; any other `.ts` file inside
`app/` is just code and does NOT become a route.

## Route Handlers (the backend)

### Route handler convention
- **Syntax:** `export async function POST(request: Request) { ... }` in `route.ts`
- **Does:** handles an HTTP request of that method (GET/POST/PUT/DELETE...)
- **Input:** the web `Request` object
- **Output:** must RETURN a `Response` (see below)
- JS/Express equivalent: `app.post("/path", handler)`

### `request.json()`
- **Syntax:** `const body = await request.json();`
- **Does:** parses the JSON body into a JS object
- **Input:** raw request body
- **Output:** the parsed object (or throws on bad JSON)
- Express equivalent: `req.body`

### `NextResponse.json(data, options)`
- **Syntax:** `NextResponse.json({ user }, { status: 200 })`
- **Does:** builds a JSON HTTP response
- **Input:** (1) the payload to send, (2) options with `status`
- **Output:** a `Response` object — the ONLY thing a route handler may return
- **Gotcha:** the status goes INSIDE the call as the 2nd argument. A closing
  paren in the wrong place silently changes what's returned

### HTTP status codes — the language of responses
| Code | Meaning | We use it for |
|---|---|---|
| 200 | OK | successful reads/actions |
| 201 | Created | resource made (POST questions) |
| 400 | Bad request | client sent nonsense (validation failed) |
| 401 | Unauthorized | not logged in / bad credentials |
| 403 | Forbidden | logged in, but wrong role |
| 404 | Not found | URL or resource doesn't exist |
| 500 | Server error | our code threw (the catch-all) |

Rule of thumb: 4xx = the CLIENT's fault (tell them what), 5xx = OUR fault
(never leak details — generic message, log it).

## Cookies

### `cookies()` from `next/headers`
- **Syntax:** `const store = await cookies();` (ASYNC — always await)
- **Does:** read/write HTTP cookies for the current request
- **Input/Output:** a cookie store object

### `store.get("name")`
- **Syntax:** `store.get("session_token")?.value`
- **Does:** reads a cookie sent by the browser
- **Input:** cookie name
- **Output:** the cookie object `{ name, value }` or `undefined` — hence `?.`

### `store.set(name, value, options)`
- **Syntax:**
  ```ts
  store.set("session_token", token, {
    httpOnly: true, sameSite: "lax", maxAge: 604800, path: "/"
  });
  ```
- **Does:** adds a `Set-Cookie` header to the response
- **Input:** name, value, options object
- **Output:** header written; browser stores the cookie
- **Options that matter:**
  - `httpOnly: true` — JS can't read it (XSS defense)
  - `sameSite: "lax"` — not sent cross-site (CSRF defense)
  - `maxAge` — lifetime in SECONDS
  - `path: "/"` — applies to the whole site
- Express equivalent: `res.cookie(name, value, options)`

### `store.delete("name")`
- **Syntax:** `store.delete("session_token");`
- **Does:** tells the browser to drop the cookie (logout)

## Pages & components

### `page.tsx` — a page component
- **Syntax:** `export default async function Page() { ... }`
- **Does:** renders at its folder's URL. `async` allowed = server pages can
  query the DB directly (Server Components — we'll use these)
- **Input:** props (params/query) for advanced cases
- **Output:** JSX (HTML)

### `layout.tsx` — the shared shell
- **Syntax:** `export default function Layout({ children }: { children: React.ReactNode }) { ... }`
- **Does:** wraps every page under its folder (app layout = whole site)

### Client vs Server Components
- Server (default): runs on the server, can await DB/API calls
- Client: needs `"use client";` as the first line — runs in the browser, can
  use `useState`, `useEffect`, onClick (we'll meet these in the login page)

## Imports & config

### The `@/` alias
- **Syntax:** `import pool from "@/lib/db";`
- **Does:** `@/` = the project root (tsconfig `paths`). No relative `../../` hell

### `npm run dev` / `npm run build` / `npm run lint`
- dev = local server with hot reload; build = production compile; lint = eslint

## Coming in later features (preview)
- `"use client"` + `useState` / `useEffect` (exam timer, forms)
- `redirect()` from `next/navigation` (login → dashboard by role)
- `useRouter()` (client-side navigation)
- `fetch("/api/...")` from client code

## Client vs Server Components
- Server (default): runs on the server, can await DB/API calls
- Client: needs `"use client";` as the first line — runs in the browser, can
  use state, events, fetch (all React pieces live in REFERENCE_REACT.md)

## Imports & config

### The `@/` alias
- **Syntax:** `import pool from "@/lib/db";`
- **Does:** `@/` = the project root (tsconfig `paths`). No relative `../../` hell

### `npm run dev` / `npm run build` / `npm run lint`
- dev = local server with hot reload; build = production compile; lint = eslint

## Coming in later features (preview)
- `redirect()` from `next/navigation` (server-side redirects)
- `revalidatePath()` (refresh data after mutations)
