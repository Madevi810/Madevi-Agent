import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readConfig, writeConfig } from "../src/config.mjs";
import { findAction } from "../src/actions.mjs";
import { policyDecision } from "../../policy/src/rules.mjs";

test("Madevi creates isolated default configuration", async () => {
  const home = await mkdtemp(join(tmpdir(), "madevi-test-"));
  try {
    const first = await readConfig(home);
    assert.equal(first.config.agent.name, "Madevi");
    assert.equal(first.config.monitor.enabled, false);

    first.config.monitor.enabled = true;
    await writeConfig(first.config, home);

    const second = await readConfig(home);
    assert.equal(second.config.monitor.enabled, true);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test("monitor containment stays blocked until monitoring is enabled", () => {
  const action = findAction("monitor.contain");
  assert.deepEqual(policyDecision(action, { monitorEnabled: false }), {
    allowed: false,
    reason: "Monitor Control is disabled."
  });
  assert.equal(policyDecision(action, { monitorEnabled: true }).approval, "policy-defined");
});
