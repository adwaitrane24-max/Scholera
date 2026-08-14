export interface Citation {
  lecture: string
  slide: number
}

export interface Message {
  id: string
  role: "user" | "assistant"
  created_at: string
  content: string
  citations?: Citation[]
}

export interface Conversation {
  id: string
  course: { id: string; code: string; title: string; instructor: string }
  student: { id: string; name: string }
  started_at: string | null
  messages: Message[]
}

export interface Slide {
  slide_number: number
  title: string
  bullets?: string[]
  formulas?: string[]
  figure?: { description: string }
  notes: string
}

export interface Lecture {
  lecture_id: string
  course_code: string
  course_title: string
  week: number
  title: string
  slides: Slide[]
}

export interface Scenario {
  id: "plain" | "code" | "math" | "table" | "long" | "refusal" | "error-midstream" | "slow"
  prompt: string
  first_token_delay_ms: number
  chunk_delay_ms: number
  text: string
  citations: Citation[]
  error?: string
  fails_before_first_token?: boolean
}

export type ScenarioId = Scenario["id"]
