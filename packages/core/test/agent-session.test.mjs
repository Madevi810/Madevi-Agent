import assert from "node:assert/strict";
import test from "node:test";
import { createAgentSession, appendMessage, setAgentMode, systemPromptForMode } from "../src/agent-session.mjs";
import { completeWithProfile } from "../src/provider.mjs";
import { DEFAULT_STATE, normalizeState } from "../src/state.mjs";

test("agent session keeps mode and transcript in shared state", () => {
  const state = normalizeState(structuredClone(DEFAULT_STATE));
  const session = createAgentSession(state, { title: "Plan auth", modelId: "custom-model", mode: "plan" });
  appendMessage(state, session.id, { role: "user", content: "Plan an auth flow" });
  setAgentMode(state, session.id, "review");
  assert.equal(session.messages.length, 1);
  assert.equal(session.mode, "review");
  assert.match(systemPromptForMode("review"), /Do not mutate/);
});

test("OpenAI-compatible provider adapter keeps credentials outside config", async () => {
  const original = process.env.MADEVI_TEST_KEY;
  process.env.MADEVI_TEST_KEY = "not-persisted";
  try {
    const text = await completeWithProfile(
      { baseUrl: "https://provider.invalid/v1", model: "test-model", apiKeyEnv: "MADEVI_TEST_KEY" },
      [{ role: "user", content: "Hello" }],
      { fetchImpl: async (_url, request) => {
        assert.equal(request.headers.authorization, "Bearer not-persisted");
        return new Response(JSON.stringify({ choices: [{ message: { content: "Hello from provider" } }] }), { status: 200 });
      } }
    );
    assert.equal(text, "Hello from provider");
  } finally {
    if (original === undefined) delete process.env.MADEVI_TEST_KEY;
    else process.env.MADEVI_TEST_KEY = original;
  }
});
