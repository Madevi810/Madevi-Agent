import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readConfig, writeConfig } from "../src/config.mjs";
import { readState, writeState } from "../src/state.mjs";
import { findAction } from "../src/actions.mjs";
import { approvePlan, createTaskWithPlan } from "../src/workflow.mjs";
import { policyDecision } from "../../policy/src/rules.mjs";

test("Madevi creates isolated default configuration", async () => {
  const home = await mkdtemp(join(tmpdir(), "madevi-test-"));
  try {
    const first = await readConfig(home);
    assert.equal(first.config.agent.name, "Madevi");
    assert.equal(first.config.monitor.enabled, false);
    assert.equal(first.config.model.active, null);

    first.config.monitor.enabled = true;
    await writeConfig(first.config, home);

    const second = await readConfig(home);
    assert.equal(second.config.monitor.enabled, true);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test("task, draft plan, approval, and audit persist together", async () => {
  const home = await mkdtemp(join(tmpdir(), "madevi-workflow-"));
  try {
    const { state } = await readState(home);
    const created = createTaskWithPlan(state, { title: "Inspect deployment logs" });
    assert.equal(created.task.status, "planning");
    assert.equal(created.plan.status, "draft");
    assert.equal(state.audit.length, 2);

    approvePlan(state, created.plan.id, { actor: "developer" });
    await writeState(state, home);

    const restored = await readState(home);
    assert.equal(restored.state.tasks[0].status, "ready");
    assert.equal(restored.state.plans[0].status, "approved");
    assert.equal(restored.state.audit[0].type, "plan.approved");
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
