"use client"

import { useCallback, useRef, useState } from "react"
import { getScenario, listScenarios, streamResponse } from "./mockStream"
import type { Citation, ScenarioId } from "./types"

const SLOW_START_THRESHOLD_MS = 1500

export type StreamStatus = "idle" | "slow-start" | "streaming" | "done" | "error" | "cancelled"

export interface StreamState {
  status: StreamStatus
  text: string
  citations: Citation[]
  errorMessage?: string
}

export function useMockStream() {
  const [state, setState] = useState<StreamState>({ status: "idle", text: "", citations: [] })
  const activeControllerRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    activeControllerRef.current?.abort()
  }, [])

  const run = useCallback(async (scenarioId: ScenarioId) => {
    const scenario = getScenario(scenarioId)
    const controller = new AbortController()
    activeControllerRef.current = controller

    setState({
      status: scenario.first_token_delay_ms > SLOW_START_THRESHOLD_MS ? "slow-start" : "idle",
      text: "",
      citations: scenario.citations,
      errorMessage: undefined,
    })

    try {
      let sawFirstChunk = false
      for await (const chunk of streamResponse(scenarioId, { signal: controller.signal })) {
        if (controller.signal.aborted) {
          break
        }

        if (!sawFirstChunk) {
          sawFirstChunk = true
          setState((prev) => ({ ...prev, status: "streaming" }))
        }

        setState((prev) => ({
          ...prev,
          status: "streaming",
          text: prev.text + chunk,
        }))
      }

      if (controller.signal.aborted) {
        setState((prev) => ({ ...prev, status: "cancelled" }))
        return
      }

      setState((prev) => ({ ...prev, status: "done" }))
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Streaming failed"
      setState((prev) => ({ ...prev, status: "error", errorMessage }))
    }
  }, [])

  return { state, run, cancel }
}

export function getScenarioList() {
  return listScenarios()
}

export function matchScenario(userInput: string): ScenarioId {
  const terms = new Set(
    userInput
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  )

  if (terms.size === 0) {
    return "refusal"
  }

  let bestScenario: ScenarioId = "refusal"
  let bestScore = 0

  for (const scenario of listScenarios()) {
    const score = scenario.prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0 && terms.has(word)).length

    if (score > bestScore) {
      bestScore = score
      bestScenario = scenario.id
    }
  }

  return bestScore > 0 ? bestScenario : "refusal"
}
