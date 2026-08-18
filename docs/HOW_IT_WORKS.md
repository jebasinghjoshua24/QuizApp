# HOW_IT_WORKS.md — The Anti-Blackbox Doc

Every feature in this app gets traced end-to-end here:

```
Browser (page) → API route (request) → SQL (query) → response → page (render)
```

Reading this file, you can explain ANY feature of the app in 5 sentences. That is
the goal. It feeds directly into the final README.

## Current flow map (updated per feature)

| Feature | Page | API route(s) | Table(s) touched |
|---|---|---|---|
| _(not built yet)_ | — | — | — |

---

## Feature: <feature name>

_When this feature is built, its flow gets documented here like this:_

### Flow
1. **Page:** ...
2. **API route:** receives ..., does ...
3. **SQL:** queries/inserts ... into table ...
4. **Response:** returns ... to the page
5. **Page:** renders ... / handles errors by ...

### Gotchas learned while building
- ...

---

## Schema cheat-sheet

_Once migrations are written, each table gets a 3-line summary here (what it stores,
what keys it has, what flows read/write it)._