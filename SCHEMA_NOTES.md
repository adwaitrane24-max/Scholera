# Real data schema — confirmed from the actual repo

## Files
- `data/conversation.json` — one populated conversation, 12 messages, course = CS 4780
- `data/conversation-empty.json` — same shape, `messages: []`, `started_at: null`
- `data/lectures/lecture-01-linear-models.json`, `lecture-02-gradient-descent.json`, `lecture-03-regularization.json` — 15 slides each
- `data/responses.json` — 8 scenarios: `plain`, `code`, `math`, `table`, `long`, `refusal`, `error-midstream`, `slow`
- `data/mock-stream.mjs` — `streamResponse(id, {signal, speed})` async generator, `listScenarios()`, `getScenario(id)`

## The one non-obvious gotcha
**Citations don't reference `lecture_id`.** A citation looks like:
```json
{ "lecture": "Week 2 — Gradient Descent and Backpropagation", "slide": 9 }
```
But the lecture file itself has:
```json
{ "lecture_id": "lec_02", "week": 2, "title": "Gradient Descent and Backpropagation" }
```
There is no direct id match. You have to reconstruct `"Week {week} — {title}"` from each lecture file and match citations against *that* string. `lectureIndex.ts` does this once at load time via a `Map`, so lookups are O(1) after that — don't re-derive the string on every render.

## Slide fields are inconsistent by design — build your renderer defensively
Not every slide has every field:
- Slide 1 of any lecture: just `bullets` (title card), no `formulas`, no `figure`
- Some slides: `bullets` + `formulas`
- Some slides (e.g. lecture-02 slide 4, slide 10): **only** `figure`, no `bullets` at all — these are diagram-only slides where the description text is the whole point
- `notes` (speaker notes) is present on every slide, no exceptions — safe to always render

So your Slide Detail component needs to conditionally render bullets / formulas / figure, not assume all three exist.

## `error-midstream` scenario
Its `text` field is the **full intended answer already truncated** — `mock-stream.mjs` streams exactly that shortened text, then throws. There's no "real" longer answer hiding anywhere; what you see in `responses.json` is deliberately incomplete. Your error UI should treat the streamed partial text as final-and-broken, not as "still loading."

## `slow` scenario
`first_token_delay_ms: 4200` — this is the only scenario over the 1.5s threshold I used in `useMockStream.ts` for `slow-start`. Everything else starts under 550ms.

## No scenario currently sets `fails_before_first_token: true`
`mock-stream.mjs` supports it (throws before yielding anything), and `types.ts` includes the field, but none of the 8 scenarios use it today. Worth testing manually anyway if you want to be thorough, since the file explicitly calls it out as a distinct case from `error-midstream`.

## Empty-state topic browser data
`getAllTopics()` in `lectureIndex.ts` filters out pure title-card slides (slide 1 of each lecture only has `bullets: ["CS 4780 — Week 2", "Dr. Elena Márquez"]`, not real content) so your topic chips are teaching content, not "Week 2" repeated three times.

## Matching free-text input to a scenario
There's no real NLU here — `matchScenario()` in `useMockStream.ts` is a simple word-overlap heuristic against each scenario's `prompt` field, falling back to `refusal` when nothing overlaps. This is good enough for a mock and is itself an honest design choice worth mentioning in your README/video ("no real model, so input matching is a simple heuristic — call this out as a known limitation").
