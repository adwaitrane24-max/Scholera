"use client"

import { useCallback, useRef, useState } from "react"
import { getScenario, streamResponse } from "@/lib/scholera/mockStream"
import { matchScenario } from "@/lib/scholera/useMockStream"
import { pinMessage, unpinMessage, getPinned } from "@/lib/scholera/pinnedStore"
import type { Citation, Message, ScenarioId } from "@/lib/scholera/types"
import type { StreamStatus } from "@/lib/scholera/useMockStream"

export interface ChatState {
  messages: Message[]
  // The id of the currently streaming assistant message (null when idle)
  streamingId: string | null
  // Per-message stream status
  statusById: Record<string, StreamStatus>
  // Per-message error string
  errorById: Record<string, string | undefined>
  // Which scenario powered which assistant message (for retry + refusal styling)
  scenarioIdByMessageId: Record<string, ScenarioId>
  // Pinned message ids (from localStorage)
  pinnedIds: Set<string>
  // Citation currently open in the modal (null → modal closed)
  openCitationData: Citation | null
}

export function useScholeraChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    streamingId: null,
    statusById: {},
    errorById: {},
    scenarioIdByMessageId: {},
    pinnedIds: new Set(getPinned().map((m) => m.id)),
    openCitationData: null,
  })

  const abortRef = useRef<AbortController | null>(null)

  // ─── helpers ────────────────────────────────────────────────────────────────

  function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }

  function now() {
    return new Date().toISOString()
  }

  // ─── send a user message and start the streaming response ───────────────────

  const sendMessage = useCallback(async (userInput: string) => {
    const trimmed = userInput.trim()
    if (!trimmed) return

    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const userId = makeId()
    const assistantId = makeId()
    const scenarioId = matchScenario(trimmed)
    const scenario = getScenario(scenarioId)

    const userMessage: Message = {
      id: userId,
      role: "user",
      content: trimmed,
      created_at: now(),
    }

    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      created_at: now(),
      citations: [], // filled in when done
    }

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      streamingId: assistantId,
      statusById: {
        ...prev.statusById,
        [assistantId]:
          scenario.first_token_delay_ms > 1500 ? "slow-start" : "idle",
      },
      errorById: { ...prev.errorById, [assistantId]: undefined },
      scenarioIdByMessageId: {
        ...prev.scenarioIdByMessageId,
        [assistantId]: scenarioId,
      },
    }))

    try {
      let sawFirstChunk = false

      for await (const chunk of streamResponse(scenarioId, {
        signal: controller.signal,
      })) {
        if (controller.signal.aborted) break

        if (!sawFirstChunk) {
          sawFirstChunk = true
          setState((prev) => ({
            ...prev,
            statusById: { ...prev.statusById, [assistantId]: "streaming" },
          }))
        }

        setState((prev) => {
          const updated = prev.messages.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m,
          )
          return { ...prev, messages: updated }
        })
      }

      if (controller.signal.aborted) {
        setState((prev) => ({
          ...prev,
          streamingId: null,
          statusById: { ...prev.statusById, [assistantId]: "cancelled" },
        }))
        return
      }

      // Stream complete — attach citations
      setState((prev) => {
        const updated = prev.messages.map((m) =>
          m.id === assistantId
            ? { ...m, citations: scenario.citations as Citation[] }
            : m,
        )
        return {
          ...prev,
          messages: updated,
          streamingId: null,
          statusById: { ...prev.statusById, [assistantId]: "done" },
        }
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Streaming failed"
      setState((prev) => ({
        ...prev,
        streamingId: null,
        statusById: { ...prev.statusById, [assistantId]: "error" },
        errorById: { ...prev.errorById, [assistantId]: msg },
      }))
    }
  }, [])

  // ─── cancel ─────────────────────────────────────────────────────────────────

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  // ─── retry ──────────────────────────────────────────────────────────────────

  const retry = useCallback(
    async (assistantMessageId: string) => {
      const scenarioId = state.scenarioIdByMessageId[assistantMessageId]
      if (!scenarioId) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const scenario = getScenario(scenarioId)

      setState((prev) => {
        const updated = prev.messages.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: "", citations: [] }
            : m,
        )
        return {
          ...prev,
          messages: updated,
          streamingId: assistantMessageId,
          statusById: {
            ...prev.statusById,
            [assistantMessageId]:
              scenario.first_token_delay_ms > 1500 ? "slow-start" : "idle",
          },
          errorById: { ...prev.errorById, [assistantMessageId]: undefined },
        }
      })

      try {
        let sawFirstChunk = false

        for await (const chunk of streamResponse(scenarioId, {
          signal: controller.signal,
        })) {
          if (controller.signal.aborted) break

          if (!sawFirstChunk) {
            sawFirstChunk = true
            setState((prev) => ({
              ...prev,
              statusById: {
                ...prev.statusById,
                [assistantMessageId]: "streaming",
              },
            }))
          }

          setState((prev) => {
            const updated = prev.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: m.content + chunk }
                : m,
            )
            return { ...prev, messages: updated }
          })
        }

        if (controller.signal.aborted) {
          setState((prev) => ({
            ...prev,
            streamingId: null,
            statusById: {
              ...prev.statusById,
              [assistantMessageId]: "cancelled",
            },
          }))
          return
        }

        setState((prev) => {
          const updated = prev.messages.map((m) =>
            m.id === assistantMessageId
              ? { ...m, citations: scenario.citations as Citation[] }
              : m,
          )
          return {
            ...prev,
            messages: updated,
            streamingId: null,
            statusById: { ...prev.statusById, [assistantMessageId]: "done" },
          }
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Streaming failed"
        setState((prev) => ({
          ...prev,
          streamingId: null,
          statusById: {
            ...prev.statusById,
            [assistantMessageId]: "error",
          },
          errorById: { ...prev.errorById, [assistantMessageId]: msg },
        }))
      }
    },
    [state.scenarioIdByMessageId],
  )

  // ─── pin/unpin ──────────────────────────────────────────────────────────────

  const togglePin = useCallback((message: Message) => {
    setState((prev) => {
      const isPinned = prev.pinnedIds.has(message.id)
      if (isPinned) {
        unpinMessage(message.id)
        const next = new Set(prev.pinnedIds)
        next.delete(message.id)
        return { ...prev, pinnedIds: next }
      } else {
        pinMessage(message)
        const next = new Set(prev.pinnedIds)
        next.add(message.id)
        return { ...prev, pinnedIds: next }
      }
    })
  }, [])

  // ─── citation modal ──────────────────────────────────────────────────────────

  const openCitation = useCallback((citation: Citation) => {
    setState((prev) => ({ ...prev, openCitationData: citation }))
  }, [])

  const closeCitation = useCallback(() => {
    setState((prev) => ({ ...prev, openCitationData: null }))
  }, [])

  return {
    state,
    sendMessage,
    cancel,
    retry,
    togglePin,
    openCitation,
    closeCitation,
  }
}
