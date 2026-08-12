// ── Matches the real files in data/ exactly ──────────────────────────────

export interface Citation {
  lecture: string;   // e.g. "Week 2 — Gradient Descent and Backpropagation"
  slide: number;      // slide_number inside that lecture
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  created_at: string;
  content: string;
  citations?: Citation[]; // only present on assistant messages, can be []
}

export interface Conversation {
  id: string;
  course: {
    id: string;
    code: string;
    title: string;
    instructor: string;
  };
  student: { id: string; name: string };
  started_at: string | null;
  messages: Message[];
}

// ── lectures/*.json ───────────────────────────────────────────────────────

export interface SlideFigure {
  description: string;
}

export interface Slide {
  slide_number: number;
  title: string;
  bullets?: string[];
  formulas?: string[];   // raw LaTeX, no $ delimiters — wrap yourself when rendering
  figure?: SlideFigure;
  notes: string;          // professor's speaker notes — always present
}

export interface Lecture {
  lecture_id: string;     // "lec_01" etc — NOT what citations reference
  course_code: string;
  course_title: string;
  week: number;
  title: string;           // "Gradient Descent and Backpropagation"
  slides: Slide[];
}

// ── responses.json / mock-stream.mjs ────────────────────────────────────

export interface ScenarioMeta {
  id: string;
  prompt: string;
}

export interface Scenario extends ScenarioMeta {
  first_token_delay_ms: number;
  chunk_delay_ms: number;
  text: string;
  citations: Citation[];
  error?: string;                    // present on 'error-midstream' scenario
  fails_before_first_token?: boolean; // not used by any current scenario, but supported by mock-stream.mjs
}

// The 8 scenario ids that currently exist in responses.json — use these as your
// UI test matrix. Don't hardcode elsewhere; always read via listScenarios().
export type ScenarioId =
  | "plain"
  | "code"
  | "math"
  | "table"
  | "long"
  | "refusal"
  | "error-midstream"
  | "slow";
