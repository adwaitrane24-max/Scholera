import responses from "@/data/scholera/responses.json"
import type { Scenario, ScenarioId } from "./types"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface StreamOptions {
  signal?: AbortSignal
  speed?: number
}

interface ScenarioListItem {
  id: ScenarioId
  prompt: string
}

interface ResponsesFile {
  scenarios: Scenario[]
}

const typedResponses = responses as ResponsesFile

export function listScenarios(): ScenarioListItem[] {
  return typedResponses.scenarios.map(({ id, prompt }) => ({ id, prompt }))
}

export function getScenario(id: ScenarioId): Scenario {
  const scenario = typedResponses.scenarios.find((entry) => entry.id === id)
  if (!scenario) {
    const known = typedResponses.scenarios.map((entry) => entry.id).join(", ")
    throw new Error(`Unknown scenario "${id}". Try: ${known}`)
  }
  return scenario
}

function chunkify(text: string): string[] {
  const chunks: string[] = []
  let i = 0
  let seed = 1337
  const next = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)

  while (i < text.length) {
    const size = 2 + Math.floor(next() * 6)
    chunks.push(text.slice(i, i + size))
    i += size
  }
  return chunks
}

export async function* streamResponse(id: ScenarioId, opts: StreamOptions = {}) {
  const { signal, speed = 1 } = opts
  const scenario = getScenario(id)
  const chunks = chunkify(scenario.text)

  await sleep(scenario.first_token_delay_ms * speed)
  if (signal?.aborted) {
    return
  }

  if (scenario.error && scenario.fails_before_first_token) {
    throw new Error(scenario.error)
  }

  for (const chunk of chunks) {
    if (signal?.aborted) {
      return
    }
    yield chunk
    await sleep(scenario.chunk_delay_ms * speed)
  }

  if (scenario.error) {
    throw new Error(scenario.error)
  }
}
