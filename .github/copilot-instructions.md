# GitHub Copilot Instructions — Scholera Tutor Chat UI
 
This file is read automatically by GitHub Copilot in VS Code for every suggestion and chat request in this repo. Keep it in `.github/copilot-instructions.md`.
 
## What this project is
A frontend-only chat UI for an AI tutor scoped to one course (CS 4780). No backend, no real AI model — all data is static JSON, and streaming is faked by `data/mock-stream.mjs`. This is a take-home assignment graded on product judgement, craft, originality, and restraint. Depth on a few features beats breadth — do not suggest or add features beyond what's listed below.
 
## Tech stack
- React + Vite + TypeScript
- Tailwind CSS (no other UI/component libraries — hand-build components)
- `remark` + `remark-gfm` + `remark-math` + `rehype-katex` for rendering assistant message content (markdown, tables, LaTeX)
- React Context + `useReducer` (or Zustand) for state — no Redux
- `localStorage` for pinned answers — no backend calls beyond the mock stream
## Design language
Reference: Claude.ai and Notion. Calm, low-chrome, content-first.
- Neutral background, one accent color used only for: active citation chips, active pin icon, send button, focus states
- No drop shadows — use `1px solid` low-contrast borders or subtle background-shade separation
- Plain sans UI chrome; message content can have wider line-height for readability
- Message text max-width ~65–75ch on desktop, never edge-to-edge
- Panel/sheet transitions: 150–200ms ease, no bounce/spring
- Icons: outline style, muted until active/hovered
- Mobile tap targets ≥44px
## Exact data schema — do not guess field names, this is confirmed from the real files
 
```typescript
interface Citation { lecture: string; slide: number; }
// citation.lecture is a DISPLAY STRING like "Week 2 — Gradient Descent and Backpropagation"
// It is NOT the same as lecture_id ("lec_02") in the lecture files — there is no direct id link.
// Build the display string as `Week ${week} — ${title}` from each lecture file to match citations.
 
interface Message {
  id: string;
  role: "user" | "assistant";
  created_at: string;
  content: string;
  citations?: Citation[]; // only on assistant messages, can be empty array
}
 
interface Conversation {
  id: string;
  course: { id: string; code: string; title: string; instructor: string };
  student: { id: string; name: string };
  started_at: string | null;
  messages: Message[];
}
 
interface Slide {
  slide_number: number;
  title: string;
  bullets?: string[];    // not always present
  formulas?: string[];   // raw LaTeX, no $ delimiters, not always present
  figure?: { description: string }; // some slides are figure-only, no bullets
  notes: string;          // always present
}
 
interface Lecture {
  lecture_id: string; // NOT what citations reference
  course_code: string;
  course_title: string;
  week: number;
  title: string;
  slides: Slide[];
}
 
interface Scenario {
  id: "plain" | "code" | "math" | "table" | "long" | "refusal" | "error-midstream" | "slow";
  prompt: string;
  first_token_delay_ms: number;
  chunk_delay_ms: number;
  text: string;
  citations: Citation[];
  error?: string; // only on 'error-midstream'
}
```
 
## mock-stream.mjs usage — do not rewrite its core logic
```javascript
import { streamResponse, listScenarios, getScenario } from '../data/mock-stream.mjs'
 
for await (const chunk of streamResponse(scenarioId, { signal: abortController.signal })) {
  // append chunk (string) to message text
}
```
- `first_token_delay_ms`: `slow` scenario is 4200ms, everything else under 600ms — treat anything over ~1.5s as needing a "thinking" indicator before streaming starts
- `error-midstream`: streams its deliberately-truncated `text` in full, then throws — the partial text IS the final broken state, not a loading state
- Supports `AbortController` for a Stop button — aborting ends cleanly, no throw
## The 5 features to build (nothing beyond these)
1. **Citation → slide linking** — clickable citation chips open a Slide Detail panel (side panel desktop / bottom sheet mobile) rendering that slide's bullets, KaTeX-rendered formulas, figure description, and notes — conditionally, since not all fields exist on every slide
2. **Empty-state topic browser** — when conversation is empty, show topic chips generated from real slide titles (skip slide 1 of each lecture, it's just a title card) instead of a blank composer
3. **Graceful handling of all 8 mock-stream scenarios** — explicit states: `idle → slow-start → streaming → done`, plus `error` and `cancelled`, each visibly distinct. Include a Stop button while streaming, and a Retry control on `error-midstream`
4. **Pin/save answers** — pin icon on assistant messages with citations, persisted to `localStorage`, separate Saved view reusing the citation-chip component from feature 1
5. **Mobile-first responsive** — single-column base layout always; panels collapse to bottom sheets under 768px; sticky composer respecting `env(safe-area-inset-bottom)`
## What NOT to suggest
No knowledge graph, no auth/backend, no theme switcher, no component libraries (MUI/shadcn/etc.), no features outside the 5 above. If a suggestion would add scope, flag it as optional rather than including it by default.
 
## Code style
Conventional React patterns over clever abstractions — this code needs to be explained line-by-line in a review call. Small, readable components. Prefer named functions over deeply nested inline logic.