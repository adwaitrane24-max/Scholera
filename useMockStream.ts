import { useCallback, useRef, useState } from "react";
import { streamResponse, listScenarios, getScenario } from "../data/mock-stream.mjs";
import type { ScenarioId, Citation } from "./types";

// mock-stream.mjs has no signal for "first token is late" — you have to infer
// slow-start yourself from first_token_delay_ms before streaming even starts.
const SLOW_START_THRESHOLD_MS = 1500;

export type StreamStatus = "idle" | "slow-start" | "streaming" | "done" | "error" | "cancelled";

export interface StreamState {
  status: StreamStatus;
  text: string;
  citations: Citation[];
  errorMessage?: string;
}

/**
 * Turns mock-stream.mjs's async generator into explicit UI states.
 * Usage:
 *   const { state, run, cancel } = useMockStream();
 *   run('code');
 */
export function useMockStream() {
  const [state, setState] = useState<StreamState>({ status: "idle", text: "", citations: [] });
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const run = useCallback(async (scenarioId: ScenarioId) => {
    const scenario = getScenario(scenarioId);
    const controller = new AbortController();
    controllerRef.current = controller;

    // Show the "thinking" state immediately if this scenario is known to be slow
    // (the 'slow' scenario has first_token_delay_ms: 4200 — don't let the UI sit blank).
    setState({
      status: scenario.first_token_delay_ms > SLOW_START_THRESHOLD_MS ? "slow-start" : "idle",
      text: "",
      citations: scenario.citations ?? [],
    });

    try {
      let first = true;
      for await (const chunk of streamResponse(scenarioId, { signal: controller.signal })) {
        if (controller.signal.aborted) break;
        if (first) {
          setState((s) => ({ ...s, status: "streaming" }));
          first = false;
        }
        setState((s) => ({ ...s, text: s.text + chunk }));
      }

      if (controller.signal.aborted) {
        setState((s) => ({ ...s, status: "cancelled" }));
        return;
      }

      setState((s) => ({ ...s, status: "done" }));
    } catch (err) {
      // Covers both fails_before_first_token and error-midstream — partial text
      // (if any) is preserved in state.text, matching what a dropped connection
      // actually looks like.
      setState((s) => ({
        ...s,
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Something went wrong.",
      }));
    }
  }, []);

  return { state, run, cancel };
}

export function getScenarioList() {
  return listScenarios();
}

/**
 * Very lightweight matcher: picks the scenario whose prompt shares the most
 * words with the student's input. Good enough for a mock — this is not meant
 * to be real NLU. Falls back to 'refusal' when nothing overlaps meaningfully,
 * which is an honest behavior for an app with no real model behind it.
 */
export function matchScenario(userInput: string): ScenarioId {
  const inputWords = new Set(
    userInput.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean)
  );

  let best: { id: ScenarioId; score: number } = { id: "refusal", score: 0 };

  for (const { id, prompt } of listScenarios()) {
    const promptWords = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
    const score = promptWords.filter((w) => inputWords.has(w)).length;
    if (score > best.score) best = { id: id as ScenarioId, score };
  }

  return best.id;
}
