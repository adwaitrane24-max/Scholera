# Product Requirements Document — Course Tutor Chat UI
**Project:** Scholera Frontend Engineer Intern — Take-Home Assignment
**Author:** Adwait Rane
**Status:** Draft v1 — pending real data schema confirmation

---

## 1. One-line pitch

A revision-first tutor screen — not a chat log — where every answer is traceable to a real lecture slide, the empty state teaches you what you *can* ask, nothing you ask is ever lost to scrolling, and every failure mode of an AI stream is handled visibly instead of silently.

## 2. Why this over a ChatGPT clone

The brief is explicit: don't build a chat log, build something a chat log isn't. A student revising doesn't want "everything I said in order" — they want "what have I covered," "where did this come from," and "what do I want to keep." Five features answer that directly:

1. Citation → slide linking
2. Empty-state topic browser
3. *(dropped: knowledge graph — too much for 10–12 hrs, not chosen)*
4. Graceful handling of all 8 mock responses
5. Pin/save answers
6. Mobile-first responsive layout

Depth on these five > breadth across everything mentioned in the brief.

## 3. Design language

**Reference points:** Claude.ai and Notion — calm, low-chrome, generous whitespace, one accent color, no unnecessary borders/shadows, content-first typography.

**Rules:**
- Neutral base (near-white or near-black background depending on theme), one accent color used sparingly (citations, active states, the pin icon when active).
- Serif or clean sans for lecture/slide content (make it feel like "reading," not "chatting"); UI chrome stays in a plain sans (Inter/system font).
- No heavy card shadows. Use subtle borders (`1px solid`, low-contrast) or background-shade separation instead.
- Motion is functional, not decorative: streaming text appears smoothly, panels slide in with a short ease (150–200ms), no bouncy/spring effects.
- Icons: outline style, small, muted until active (matches Notion's low-noise iconography).
- Generous line-height and max-width on message text (~65–75ch) so long answers stay readable — don't let text stretch edge-to-edge on desktop.

## 4. Information architecture / screens

```
App
├── Header (course name, minimal — no logo clutter)
├── Main area (switches by state)
│   ├── Empty State           → Topic Browser (feature 2)
│   └── Active Conversation   → Message List (feature 1, 4)
├── Composer (input + send, sticky bottom)
├── Side Panel / Bottom Sheet  → Slide Detail (feature 1)
└── Saved Drawer / Tab         → Pinned Answers (feature 5)
```

On **desktop**: Slide Detail is a right-hand side panel (~360–420px), Saved is a collapsible left rail or a top tab.
On **mobile**: both Slide Detail and Saved collapse into full-height bottom sheets / separate views reached via a bottom tab bar or a top icon — never squeezed side-by-side with chat (feature 6).

## 5. Feature specs

### 5.1 Citation → slide linking
**Data dependency:** each assistant message in `conversation.json` includes citation(s) referencing a lecture + slide. Each file in `lectures/` contains slides with bullets, speaker notes, LaTeX formulas, figure descriptions.

**Behavior:**
- Render citations as small chips inline or right after the answer text (e.g. `[Lecture 2 · Slide 4]`), styled muted until hovered/tapped.
- Tapping a chip opens the Slide Detail panel showing: slide bullets, speaker notes, rendered formula (KaTeX), figure description as styled text (not a broken image tag).
- If a message has multiple citations, show all as separate chips; panel can show one slide at a time with a small "1 of 3" switcher if needed.
- Panel has a clear back/close affordance — never a dead end.

**Acceptance:** every citation in the real data resolves to a real slide; no "citation not found" states in normal use.

### 5.2 Empty-state topic browser
**Data dependency:** `conversation-empty.json` (starting state), slide titles/topics extracted from `lectures/`.

**Behavior:**
- When conversation is empty, don't show a blank input — show a short intro line + a grid/list of topic chips generated from lecture slide titles (e.g., "Gradient Descent," "Backpropagation").
- Tapping a chip pre-fills the composer with a natural question about that topic (e.g., "Can you explain {topic}?") — user can edit before sending, or it sends immediately (pick one, document the choice).
- Once the first message is sent, this view is replaced by the normal message list and doesn't reappear unless the student clears the conversation.

**Acceptance:** topic chips are pulled from real slide titles, not hardcoded strings.

### 5.3 Graceful handling of the 8 mock responses
**Data dependency:** `responses.json` (8 canned answers) + `mock-stream.mjs` (fake streaming endpoint, deterministic, supports cancel).

**Known response types to explicitly design for:**
| Type | UI treatment |
|---|---|
| Normal short answer | Standard streamed bubble |
| Table | Real `<table>` rendering, horizontally scrollable on mobile, not a squished mess |
| Math-heavy | KaTeX/remark-math rendering, not raw `$...$` text |
| Long answer | No truncation; consider a "jump to bottom" affordance if it pushes past viewport |
| >4s delay before first token | Explicit "thinking" skeleton/indicator — not a spinner forever, not a blank gap |
| "I don't know" | Visually distinct tone (muted background/icon) so it doesn't look like a confident wrong answer |
| Dies mid-stream | Partial text stays visible + a clear inline "Response interrupted — Retry" affordance using the same mock stream |
| Cancel support | If user can cancel a stream, show a stop button while streaming; cancelling leaves partial text marked as stopped, not deleted |

**State machine per message:** `idle → streaming → done` plus `error` and `slow-start`. These must be visibly different states, not just internally different.

**Acceptance:** manually trigger all 8 responses during dev and confirm each renders distinctly and correctly — this is your "craft" score.

### 5.4 Pin/save answers
**Data dependency:** none beyond the message objects already in state — pure frontend feature.

**Behavior:**
- Pin icon appears on assistant messages that carry citations (i.e., "real" tutor answers, not small talk / errors).
- Tapping pins it into a `Saved` list, persisted to `localStorage` so it survives reload.
- Saved view: list of pinned answers, each still showing its citation chip (reuses 5.1's component), optionally grouped by lecture.
- Unpinning removes it from Saved but never edits/deletes the original message in the conversation.

**Acceptance:** pin state persists across a page reload; saved answers remain traceable to their source slide.

### 5.5 Mobile-first responsive
**Behavior:**
- Single-column chat is the base layout at all widths.
- Slide Detail panel: right-side panel ≥768px, bottom sheet <768px.
- Saved drawer: left rail or top tab ≥768px, separate bottom-sheet/tab <768px.
- Composer is sticky to viewport bottom, respects safe-area insets (important for iOS).
- Tap targets ≥44px on mobile (citation chips, pin icon, topic chips).

**Acceptance:** test at 375px width (iPhone SE-ish) throughout — not just once at the end.

## 6. Data flow (schema-agnostic — confirm exact keys before coding)

```
lectures/*.json  ──┐
                    ├──> buildSlideIndex() → Map<lectureId, Map<slideId, SlideData>>
conversation.json ──┘

responses.json + mock-stream.mjs ──> useMockStream(responseId)
                                       returns: { text, status: 'streaming'|'done'|'error', cancel() }

Message { id, role, text, citations?: [{lectureId, slideId}] }

State:
- messages: Message[]           (conversation state)
- pinned: Message[]             (persisted to localStorage)
- activeSlide: {lectureId, slideId} | null   (drives side panel/sheet)
- streamStatus per in-flight message
```

## 7. Tech stack recommendation

- **React + Vite** (fast setup, matches "5 min to running" requirement)
- **Tailwind CSS** — fastest way to hit a clean minimal look consistently
- **remark/rehype + remark-math + KaTeX** — for markdown, tables, and LaTeX rendering from the response text
- **Zustand or plain Context+useReducer** — lightweight state, no need for Redux here
- **localStorage** — for pinned answers, no backend

## 8. Build order

1. Data layer: parse `lectures/`, build slide index; type conversation/response data (confirm real schema first)
2. Core chat: message list + composer wired to `mock-stream.mjs` via `responses.json`
3. Response-state handling (5.3) — this is graded heavily, do it early, not last
4. Citation chips + Slide Detail panel (5.1)
5. Empty-state topic browser (5.2)
6. Pin/save (5.5 → 5.4 renumber) + localStorage
7. Mobile layout pass — done incrementally alongside each step above, not as a final pass
8. README + AI_USAGE.md, written honestly, including what's left broken

## 9. Open items — need real file contents to finalize

- [ ] Exact key names in `conversation.json` (role field name, citation object shape)
- [ ] Exact key names in `lectures/*.json` (slide id format, how figures/formulas are stored)
- [ ] `mock-stream.mjs` exported function signature and cancel API
- [ ] `responses.json` — how each of the 8 responses is identified/selected (by id? by matching a question?)

Paste the raw contents of these four files and I'll turn section 6 into exact TypeScript interfaces plus a working `useMockStream` hook and slide-index builder, ready to hand to Copilot.
