# AI Usage

## Tools used
- Claude Code (this session) — implemented all UI/UX changes below from detailed
  spec prompts; verified via `tsc --noEmit` and headless-browser automation
  (Playwright + system Chrome) rather than static review alone.
- v0.app (Vercel) — appears to have generated the original project scaffold
  before this session started (`generator: "v0.app"` in app/layout.tsx metadata,
  plus the pre-existing shadcn/ui component set). Unconfirmed — see notes below.

## Where AI helped
- Sidebar collapse/expand (components/sidebar.tsx): icon-rail rework with
  localStorage persistence, portalled Radix tooltips for the collapsed state,
  and a width transition synced with the main panel — matched the spec on
  the first pass.
- Citation-to-slide preview (SlidePreview.tsx, CitationModal.tsx): reused the
  existing lectureIndex.ts lookup and the same remark-math/rehype-katex
  pipeline already used for chat markdown, instead of building a second
  rendering path.
- Found and fixed a bug outside the requested scope: KaTeX's CSS was never
  imported anywhere, so all chat math (not just the new slide feature) had
  been rendering unstyled the whole time. One-line fix, verified by
  screenshot before/after.
- Caught two real bugs only because I drove the app in an actual headless
  browser (real message sent, real citation chips clicked, prev/next
  exercised) instead of stopping once the code compiled — see below.

## Where AI led me wrong / had to be corrected
- Two positioning bugs shipped in the first pass of the citation-modal
  wiring, both invisible from reading the code:
  1. The close button sat as a fixed-position sibling *before* the lightbox
     div in the DOM. Despite a higher z-index, the dialog visually swallowed
     it because of stacking order — had to move it to be the dialog's last
     child instead of trusting z-index alone.
  2. The prev/next/close buttons all carry a shared `.btn-3d` utility class
     that hardcodes `position: relative` for its hover effect. That silently
     beat my `absolute`/`fixed` classes due to CSS cascade order, so every
     nav arrow rendered in the wrong place. Only caught by inspecting
     `getComputedStyle` in the browser; fixed with Tailwind's `!` important
     modifier.
- No instance in this session of me rejecting a flashier/generic AI-proposed
  direction — every round was a fully-specified prompt from me, executed as
  given, not the AI proposing alternatives I then vetoed. If that happened
  in an earlier session, it isn't captured here.

## What I wrote/decided myself
- Every feature spec — sidebar behavior, scroll-pause-on-manual-scroll
  semantics, dot-grid opacity range, moving Export into the Options menu
  instead of deleting it, keeping the slide preview light-on-dark rather
  than theme-matched dark — came from my own detailed prompts, not
  open-ended asks.
- "Do not invent new lecture content" — explicit constraint set before the
  citation-preview feature was built, which is why it only ever renders
  fields already present in lectures/*.json.
- Required an isolated, hardcoded-data preview of SlidePreview and explicit
  approval before it was wired into the citation click path, rather than
  accepting the full feature in one shot.
