declare module "*.json" {
  const value: any;
  export default value;
}

declare module "*.mjs" {
  type ScenarioId = "plain" | "code" | "math" | "table" | "long" | "refusal" | "error-midstream" | "slow";
  interface Citation {
    lecture: string;
    slide: number;
  }
  interface Scenario {
    id: ScenarioId;
    prompt: string;
    first_token_delay_ms: number;
    chunk_delay_ms: number;
    text: string;
    citations: Citation[];
    error?: string;
  }
  export function streamResponse(
    scenarioId: ScenarioId,
    options?: { signal?: AbortSignal },
  ): AsyncGenerator<string, void, unknown>;
  export function listScenarios(): Array<Pick<Scenario, "id" | "prompt">>;
  export function getScenario(scenarioId: ScenarioId): Scenario;
}
