# Tailwind Reference — styling without writing CSS

Lookup sheet: **syntax → what it does → input → output.** Tailwind 4 (CSS-first
setup: `@import "tailwindcss"` in globals.css, no config file needed).

> **CHEAT-SHEET MAP**
> Stuck on the **framework** (routing, cookies, responses)? → `REFERENCE_NEXTJS.md`
> Stuck on the **language** (types, operators, imports)? → `REFERENCE_TYPESCRIPT.md`
> Stuck on the **data** (SQL, tables, queries)? → `REFERENCE_POSTGRESQL.md`
> Stuck on the **UI logic** (components, state, events)? → `REFERENCE_REACT.md`
> Stuck on the **styling** (classes, layout, colors)? → **you are here**
>
> Rule: search your sheet for 2 minutes. Still stuck? Ask me — I'll give you
> the algorithm, not the code.

## The big idea

No `.css` files per component. Instead: **utility classes** — small,
single-purpose classes applied directly in JSX: `className="p-4 text-center"`.
One class = one CSS property. You compose them like building blocks.

Every class follows the pattern: `property-abbreviation-value`.
- `p-4` = padding: 1rem on all sides
- `text-center` = text-align: center
- `bg-blue-500` = background-color: blue (shade 500)

## Spacing & sizing (the scale)

Tailwind's spacing scale: `0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24...`
(each step = 0.25rem). So `p-4` = 1rem, `p-8` = 2rem.

| Class | Does | CSS equivalent |
|---|---|---|
| `p-4` / `px-4` / `py-4` / `pt-4` | padding all / x-axis / y-axis / top | padding |
| `m-4` / `mx-auto` | margin all / center horizontally | margin |
| `gap-4` | space between flex/grid children | gap |
| `w-full` / `w-64` | width 100% / 16rem | width |
| `max-w-md` | max width (md = 28rem) | max-width |
| `h-screen` | full viewport height | height: 100vh |

## Layout

| Class | Does |
|---|---|
| `flex` | display: flex (children line up horizontally) |
| `flex-col` | flex direction: column (stack vertically) |
| `items-center` | align children on the cross axis (center) |
| `justify-between` / `justify-center` | distribute children / center on main axis |
| `grid grid-cols-2` | 2-column grid |
| `space-y-4` | vertical gaps between stacked children |

The classic centered-box recipe: `flex min-h-screen items-center justify-center`

## Typography

| Class | Does |
|---|---|
| `text-sm` / `text-lg` / `text-2xl` | font size (sm=0.875rem, lg=1.125rem, 2xl=1.5rem) |
| `font-bold` / `font-medium` | font weight |
| `text-center` / `text-left` | text alignment |

## Colors

`bg-<color>-<shade>` (background), `text-<color>-<shade>` (text),
`border-<color>-<shade>` (borders).

Common colors: `red, orange, yellow, green, blue, purple, gray, slate, white, black`.
Shades: `50` (lightest) → `900` (darkest). **500 = the "normal" one.**
- `bg-blue-500` — blue button
- `text-red-600` — error text
- `bg-gray-50` — light panel background

## Borders, rounding, shadows

| Class | Does |
|---|---|
| `rounded` / `rounded-lg` / `rounded-full` | corner radius (pill = rounded-full) |
| `border` / `border-2` | border width |
| `shadow` / `shadow-md` / `shadow-lg` | box shadow strength |
| `outline-none` | remove focus outline (combine with focus rings) |

## States — the `hover:` family

Prefix any class to apply it only in that state: `hover:bg-blue-600`,
`focus:ring-2`, `disabled:opacity-50`.

The classic button recipe: `bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded`

## Conditional classes in JSX

Since JSX is JS, classes can be computed:
```tsx
className={`p-4 rounded ${error ? "bg-red-50" : "bg-gray-50"}`}
```
(backticks build the string; the `{ }` embeds the expression — React sheet)

## Mental map: I want to...

| I want to... | Classes |
|---|---|
| Center a card on screen | `flex min-h-screen items-center justify-center` |
| Make a button | `bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded` |
| Space out form fields | `flex flex-col gap-4` |
| Make an input field | `border rounded px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none` |
| Show an error | `text-red-600 text-sm` |
| A card | `bg-white shadow rounded-lg p-6` |
| Full-width row | `flex w-full justify-between items-center` |