import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { normalizeConfig, readConfig, writeConfig } from "../src/config.mjs";
import { readState, writeState } from "../src/state.mjs";
import { findAction } from "../src/actions.mjs";
import { approvePlan, createTaskWithPlan } from "../src/workflow.mjs";
import { closeSession, createProject, startSession } from "../src/workspace.mjs";
import { policyDecision } from "../../policy/src/rules.mjs";
import { evaluateSnapshot, recordIncident } from "../../../services/monitor/src/incidents.mjs";

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

test("configuration migration supplies new monitor thresholds", () => {
  const migrated = normalizeConfig({ monitor: { enabled: true } });
  assert.equal(migrated.monitor.enabled, true);
  assert.equal(migrated.monitor.thresholds.memoryCriticalPercent, 95);
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

test("project and model-bound session persist with a full audit trail", async () => {
  const home = await mkdtemp(join(tmpdir(), "madevi-session-"));
  try {
    const { state } = await readState(home);
    const project = createProject(state, { name: "Madevi web" });
    const session = startSession(state, { title: "Prepare release", projectId: project.id, modelId: "gpt-coder" });
    closeSession(state, session.id, { actor: "developer" });
    await writeState(state, home);

    const restored = await readState(home);
    assert.equal(restored.state.projects[0].name, "Madevi web");
    assert.equal(restored.state.sessions[0].status, "closed");
    assert.equal(restored.state.audit[0].type, "session.closed");
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

test("sentinel opens an incident only after a threshold is crossed", async () => {
  const home = await mkdtemp(join(tmpdir(), "madevi-incident-"));
  try {
    const snapshot = { capturedAt: "2026-11-02T00:00:00.000Z", cpuCount: 2, loadAverage: [4.5, 0, 0], memory: { usedPercent: 96 } };
    const report = evaluateSnapshot(snapshot, { memoryWarningPercent: 85, memoryCriticalPercent: 95, loadWarningPerCpu: 1.25, loadCriticalPerCpu: 2 });
    assert.equal(report.level, "critical");
    const { state } = await readState(home);
    const incident = recordIncident(state, report);
    assert.equal(incident.status, "open");
    assert.equal(state.audit[0].type, "incident.opened");
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
