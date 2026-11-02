#!/usr/bin/env node
import { readConfig, writeConfig } from "../../../packages/core/src/config.mjs";
import { readState, writeState } from "../../../packages/core/src/state.mjs";
import { approvePlan, createTaskWithPlan, findPlan, findTask } from "../../../packages/core/src/workflow.mjs";
import { ACTIONS, findAction } from "../../../packages/core/src/actions.mjs";
import { closeSession, createProject, findProject, startSession } from "../../../packages/core/src/workspace.mjs";
import { policyDecision } from "../../../packages/policy/src/rules.mjs";
import { monitorStatus } from "../../../services/monitor/src/sentinel.mjs";

const [command = "help", subcommand, ...remaining] = process.argv.slice(2);
const value = remaining.join(" ");

function print(output) {
  console.log(typeof output === "string" ? output : JSON.stringify(output, null, 2));
}

function help() {
  print([
    "Madevi CLI v0.1.2",
    "",
    "Usage:",
    "  madevi init",
    "  madevi status",
    "  madevi model list",
    "  madevi model use <model-id>",
    "  madevi model add <id> <provider> <label>",
    "  madevi model remove <model-id>",
    "  madevi auth status",
    "  madevi project create <name>",
    "  madevi project list|use <project-id>",
    "  madevi session start <title>",
    "  madevi session list|close <session-id>",
    "  madevi task create <title>",
    "  madevi task list|show <task-id>",
    "  madevi plan list|show <plan-id>|approve <plan-id>",
    "  madevi audit [limit]",
    "  madevi action list|show <action-id>",
    "  madevi monitor on|off|status",
    "  madevi version"
  ].join("\n"));
}

async function main() {
  if (["help", "--help", "-h"].includes(command)) return help();
  if (["version", "--version"].includes(command)) return print("Madevi CLI v0.1.2");

  const { path, config } = await readConfig();
  if (command === "init") return print({ initialized: true, configPath: path, mode: "workspace" });
  if (command === "status") {
    const activeModel = config.model.profiles.find((profile) => profile.id === config.model.active) || null;
    const { state } = await readState();
    const activeProject = findProject(state, config.workspace.activeProject);
    return print({ agent: config.agent.name, configPath: path, mode: config.monitor.enabled ? "workspace + monitor-control" : "workspace", activeModel, activeProject, policy: config.policy.profile, monitorEnabled: config.monitor.enabled, activeSessions: state.sessions.filter((session) => session.status === "active").length });
  }
  if (command === "model" && subcommand === "list") {
    return print(config.model.profiles.map((profile) => ({ ...profile, active: profile.id === config.model.active })));
  }
  if (command === "model" && subcommand === "add") {
    const [id, provider, ...labelParts] = remaining;
    const label = labelParts.join(" ");
    if (!id || !provider || !label) throw new Error("Usage: madevi model add <id> <provider> <label>");
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) throw new Error("Model id may contain letters, digits, and hyphens only.");
    if (config.model.profiles.some((profile) => profile.id === id)) throw new Error("A model already uses id: " + id);
    const profile = { id, provider, label, source: "custom" };
    config.model.profiles.push(profile);
    await writeConfig(config);
    return print({ added: true, profile, note: "Provider metadata was saved. Configure credentials through a supported secret provider, never in this CLI." });
  }
  if (command === "model" && subcommand === "remove") {
    const id = value;
    if (!id) throw new Error("Usage: madevi model remove <model-id>");
    const index = config.model.profiles.findIndex((profile) => profile.id === id);
    if (index === -1) throw new Error("Unknown model: " + id);
    const [removed] = config.model.profiles.splice(index, 1);
    if (config.model.active === id) config.model.active = null;
    await writeConfig(config);
    return print({ removed: true, profile: removed, activeModel: config.model.active });
  }
  if (command === "auth" && subcommand === "status") {
    return print({ configured: false, provider: null, message: "Credential storage is intentionally not implemented in this starter. Use an OS keychain, vault, or environment injection; never save API keys in Madevi configuration." });
  }
  if (command === "project" && subcommand === "create") {
    const { state } = await readState();
    const project = createProject(state, { name: value });
    await writeState(state);
    return print({ created: true, project });
  }
  if (command === "project" && subcommand === "list") {
    const { state } = await readState();
    return print(state.projects.map((project) => ({ ...project, active: project.id === config.workspace.activeProject })));
  }
  if (command === "project" && subcommand === "use") {
    const { state } = await readState();
    const project = findProject(state, value);
    if (!project) throw new Error("Project not found: " + value);
    config.workspace.activeProject = project.id;
    await writeConfig(config);
    return print({ updated: true, activeProject: project });
  }
  if (command === "session" && subcommand === "start") {
    const { state } = await readState();
    const session = startSession(state, { title: value, projectId: config.workspace.activeProject, modelId: config.model.active });
    await writeState(state);
    return print({ started: true, session });
  }
  if (command === "session" && subcommand === "list") {
    const { state } = await readState();
    return print(state.sessions);
  }
  if (command === "session" && subcommand === "close") {
    const { state } = await readState();
    const session = closeSession(state, value);
    await writeState(state);
    return print({ closed: true, session });
  }
  if (command === "task" && subcommand === "create") {
    const { state } = await readState();
    const result = createTaskWithPlan(state, { title: value });
    await writeState(state);
    return print(result);
  }
  if (command === "task" && subcommand === "list") {
    const { state } = await readState();
    return print(state.tasks);
  }
  if (command === "task" && subcommand === "show") {
    const { state } = await readState();
    const task = findTask(state, value);
    if (!task) throw new Error("Task not found: " + value);
    return print({ task, plans: state.plans.filter((plan) => plan.taskId === task.id) });
  }
  if (command === "plan" && subcommand === "list") {
    const { state } = await readState();
    return print(state.plans);
  }
  if (command === "plan" && subcommand === "show") {
    const { state } = await readState();
    const plan = findPlan(state, value);
    if (!plan) throw new Error("Plan not found: " + value);
    return print(plan);
  }
  if (command === "plan" && subcommand === "approve") {
    const { state } = await readState();
    const plan = approvePlan(state, value);
    await writeState(state);
    return print({ approved: true, plan });
  }
  if (command === "audit") {
    const { state } = await readState();
    const limit = Number.parseInt(subcommand || "20", 10);
    return print(state.audit.slice(0, Number.isFinite(limit) ? limit : 20));
  }
  if (command === "action" && subcommand === "list") {
    return print(ACTIONS.map((action) => ({ ...action, decision: policyDecision(action, { monitorEnabled: config.monitor.enabled }) })));
  }
  if (command === "action" && subcommand === "show") {
    const action = findAction(value);
    if (!action) throw new Error("Action not found: " + value);
    return print({ ...action, decision: policyDecision(action, { monitorEnabled: config.monitor.enabled }) });
  }
  if (command === "model" && subcommand === "use") {
    const selected = config.model.profiles.find((profile) => profile.id === value);
    if (!selected) throw new Error("Unknown model: " + value + ". Run 'madevi model list' first.");
    config.model.active = selected.id;
    await writeConfig(config);
    return print({ updated: true, activeModel: selected });
  }
  if (command === "monitor" && ["on", "off"].includes(subcommand)) {
    config.monitor.enabled = subcommand === "on";
    await writeConfig(config);
    return print({ updated: true, monitorEnabled: config.monitor.enabled, message: config.monitor.enabled ? "Monitor Control enabled. Sentinel can run without LLM tokens." : "Monitor Control disabled. Workspace agent remains available." });
  }
  if (command === "monitor" && subcommand === "status") return print(monitorStatus(config));
  throw new Error("Unknown command: " + [command, subcommand, value].filter(Boolean).join(" "));
}

main().catch((error) => {
  console.error("Madevi error: " + error.message);
  process.exitCode = 1;
});
