# React Reference — the UI library built into Next.js

Lookup sheet: **syntax → what it does → input → output.** React 19.
Next.js ships React; every `page.tsx` is a React component.

> **CHEAT-SHEET MAP**
> Stuck on the **framework** (routing, cookies, responses)? → `REFERENCE_NEXTJS.md`
> Stuck on the **language** (types, operators, imports)? → `REFERENCE_TYPESCRIPT.md`
> Stuck on the **data** (SQL, tables, queries)? → `REFERENCE_POSTGRESQL.md`
> Stuck on the **UI logic** (components, state, events)? → **you are here**
> Stuck on the **styling** (classes, layout, colors)? → `REFERENCE_TAILWIND.md`
>
> Rule: search your sheet for 2 minutes. Still stuck? Ask me — I'll give you
> the algorithm, not the code.

## The core idea

**A component is a function that returns UI.** One component = one job.
Pages arrange components like a mall floor plan arranges kiosks.

## Components & JSX

### A component
- **Syntax:**
  ```tsx
  function Greeting() {
    return <p>Hello, Ada</p>;
  }
  ```
- **Does:** a reusable piece of UI
- **Input:** props (see below) or nothing
- **Output:** JSX (the markup to render)

### JSX rules
- HTML-like markup inside a JS function; one root element per return
- **JavaScript goes in `{ }`:** `{user.name}`, `{2 + 2}`, `{error ? <p>{error}</p> : null}`
- Class names use `className` (NOT `class` — that's HTML; this is JS):
  `<p className="text-red-500">`

### Props — the component's inputs
- **Syntax:**
  ```tsx
  function QuestionCard({ question }: { question: Question }) {
    return <h3>{question.text}</h3>;
  }
  // usage: <QuestionCard question={q} />
  ```
- **Does:** passes data from a parent component into a child
- **Input:** an object of named values (typed after the `:` )
- **Output:** the child renders using those values
- JS equivalent: function arguments — but passed as `name={value}` attributes

### Using a component
- **Syntax:** `<Greeting />` or `<QuestionCard question={q} />`
- **Does:** renders that component's output at that spot
- **Input:** props as attributes
- **Output:** the component's JSX, inserted

## State & events

### `useState` — component memory
- **Syntax:** `const [email, setEmail] = useState("");`
- **Does:** a state slot: `email` = current value, `setEmail` = the ONLY way to
  change it; calling the setter re-renders the component with the new value
- **Input:** the initial value
- **Output:** a pair: [current value, setter function]
- **Why "const"?** you never reassign `email` — you call `setEmail`, which
  makes React re-run the function with the new value
- **Typing arrays:** `useState([])` infers `never[]` (TS: "array of nothing").
  Label it: `useState<Question[]>([])` — the generic tells TS what the array
  holds, so `q.id` in a `.map` is legal and autocompleted

### Controlled inputs (forms)
- **Syntax:**
  ```tsx
  <input value={email} onChange={(e) => setEmail(e.target.value)} />
  ```
- **Does:** input text comes FROM state; typing calls the setter. State is the
  single source of truth — the input is its mirror

### Event handlers
- **Syntax:** `onClick={handler}` / `onSubmit={handler}` / `onChange={handler}`
- **Does:** runs `handler` when the event fires
- **Input:** the event object (`e`)
- **`event.preventDefault()`:** stops the browser's default behavior
  (a form submit would reload the page)

### Conditional rendering
- **Syntax:** `{error && <p className="text-red-600">{error}</p>}`
- **Does:** renders the right side only when the left side is truthy
- JS equivalent: `if (error) show`

### Lists
- **Syntax:**
  ```tsx
  {questions.map((q) => <QuestionCard key={q.id} question={q} />)}
  ```
- **Does:** renders one component per array element
- **Input:** an array + a function
- **`key`:** a unique id per element — React's index into the list; without it
  React warns and list updates get buggy

## Async in components

### `useEffect` — side effects (preview: exam timer)
- **Syntax:**
  ```tsx
  useEffect(() => {
    // runs after the component appears on screen
    return () => { /* cleanup: runs when it leaves */ };
  }, [deps]);
  ```
- **Does:** runs code after render (timers, fetch, subscriptions)
- **Input:** a function (and optional cleanup), plus a dependency array:
  `[]` = run once on mount; `[seconds]` = re-run when seconds changes
- **Output:** nothing directly — it schedules the function