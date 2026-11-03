#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readConfig, writeConfig } from "../../../packages/core/src/config.mjs";
import { readState, writeState } from "../../../packages/core/src/state.mjs";
import { approvePlan, createTaskWithPlan, findPlan, findTask } from "../../../packages/core/src/workflow.mjs";
import { ACTIONS, findAction } from "../../../packages/core/src/actions.mjs";
import { closeSession, createProject, findProject, startSession } from "../../../packages/core/src/workspace.mjs";
import { policyDecision } from "../../../packages/policy/src/rules.mjs";
import { createSystemSnapshot, monitorStatus } from "../../../services/monitor/src/sentinel.mjs";
import { acknowledgeIncident, evaluateSnapshot, recordIncident } from "../../../services/monitor/src/incidents.mjs";
import { daemonUrl, isProcessAlive, readDaemonState, removeDaemonState } from "../../../packages/core/src/daemon.mjs";
import { appendMessage, createAgentSession, setAgentMode, systemPromptForMode } from "../../../packages/core/src/agent-session.mjs";
import { runAgentTurn } from "../../../packages/core/src/agent-loop.mjs";
import { createInterface } from "node:readline/promises";

const [command = "help", subcommand, ...remaining] = process.argv.slice(2);
const value = remaining.join(" ");

function print(output) {
  console.log(typeof output === "string" ? output : JSON.stringify(output, null, 2));
}

function help() {
  print([
    "Madevi Harness CLI v0.1.9",
    "",
    "Usage:",
    "  madevi init",
    "  madevi daemon start|stop|status|url",
    "  madevi status",
    "  madevi model list",
    "  madevi model use <model-id>",
    "  madevi model add <id> <provider> <label>",
    "  madevi model connect <id> <base-url> <model> <api-key-env>",
    "  madevi model remove <model-id>",
    "  madevi auth status",
    "  madevi project create <name>",
    "  madevi project list|use <project-id>",
    "  madevi session start <title>",
    "  madevi session list|close <session-id>",
    "  madevi agent start <title>",
    "  madevi agent list|show <session-id>",
    "  madevi agent mode <session-id> <ask|plan|build|review|operate|assist>",
    "  madevi agent send <session-id> <prompt>",
    "  madevi task create <title>",
    "  madevi task list|show <task-id>",
    "  madevi plan list|show <plan-id>|approve <plan-id>",
    "  madevi audit [limit]",
    "  madevi action list|show <action-id>",
    "  madevi monitor on|off|status|check",
    "  madevi monitor incidents|acknowledge <incident-id>",
    "  madevi version"
  ].join("\n"));
}

async function main() {
  if (["help", "--help", "-h"].includes(command)) return help();
  if (["version", "--version"].includes(command)) return print("Madevi Harness CLI v0.1.9");

  const { path, config } = await readConfig();
  if (command === "init") return print({ initialized: true, configPath: path, mode: "workspace" });
  if (command === "daemon" && subcommand === "status") {
    const state = await readDaemonState();
    return print({ running: Boolean(state && isProcessAlive(state.pid)), daemon: state });
  }
  if (command === "daemon" && subcommand === "url") {
    const state = await readDaemonState();
    return print({ url: state?.url || daemonUrl() });
  }
  if (command === "daemon" && subcommand === "start") {
    const existing = await readDaemonState();
    if (existing && isProcessAlive(existing.pid)) return print({ started: false, alreadyRunning: true, daemon: existing });
    const entry = fileURLToPath(new URL("../../daemon/bin/madevi-daemon.mjs", import.meta.url));
    const child = spawn(process.execPath, [entry], { detached: true, stdio: "ignore", env: process.env });
    child.unref();
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const state = await readDaemonState();
      if (state && isProcessAlive(state.pid)) return print({ started: true, daemon: state });
    }
    throw new Error("Daemon did not become ready. Run 'madevi daemon status' for details.");
  }
  if (command === "daemon" && subcommand === "stop") {
    const state = await readDaemonState();
    if (!state || !isProcessAlive(state.pid)) {
      await removeDaemonState();
      return print({ stopped: false, message: "No Madevi daemon is running." });
    }
    process.kill(state.pid, "SIGTERM");
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!isProcessAlive(state.pid)) {
        await removeDaemonState();
        return print({ stopped: true, daemon: state });
      }
    }
    throw new Error("Daemon did not stop within three seconds.");
  }
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
  if (command === "model" && subcommand === "connect") {
    const [id, baseUrl, model, apiKeyEnv] = remaining;
    const profile = config.model.profiles.find((item) => item.id === id);
    if (!profile || !baseUrl || !model || !apiKeyEnv) throw new Error("Usage: madevi model connect <id> <base-url> <model> <api-key-env>");
    if (!/^https?:\/\//.test(baseUrl)) throw new Error("Model base URL must start with http:// or https://");
    if (!/^[A-Z][A-Z0-9_]*$/.test(apiKeyEnv)) throw new Error("Credential environment variable must be uppercase letters, digits, and underscores.");
    Object.assign(profile, { baseUrl, model, apiKeyEnv });
    await writeConfig(config);
    return print({ connected: true, profile: { ...profile, apiKeyEnv }, note: "The key itself remains only in the environment." });
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
  if (command === "agent" && subcommand === "start") {
    const { state } = await readState();
    const session = createAgentSession(state, { title: value, projectId: config.workspace.activeProject, modelId: config.model.active });
    await writeState(state);
    return print({ started: true, session });
  }
  if (command === "agent" && subcommand === "list") {
    const { state } = await readState();
    return print(state.sessions.map(({ messages, ...session }) => ({ ...session, messageCount: messages?.length || 0 })));
  }
  if (command === "agent" && subcommand === "show") {
    const { state } = await readState();
    const session = state.sessions.find((item) => item.id === value);
    if (!session) throw new Error("Session not found: " + value);
    return print(session);
  }
  if (command === "agent" && subcommand === "mode") {
    const [sessionId, mode] = remaining;
    const { state } = await readState();
    const session = setAgentMode(state, sessionId, mode);
    await writeState(state);
    return print({ updated: true, session });
  }
  if (command === "agent" && subcommand === "send") {
    const [sessionId, ...promptParts] = remaining;
    const prompt = promptParts.join(" ");
    const { state } = await readState();
    const session = state.sessions.find((item) => item.id === sessionId);
    if (!session) throw new Error("Session not found: " + sessionId);
    const profile = config.model.profiles.find((item) => item.id === session.modelId);
    appendMessage(state, session.id, { role: "user", content: prompt });
    await writeState(state);
    const messages = [{ role: "system", content: systemPromptForMode(session.mode) }, ...session.messages.map(({ role, content }) => ({ role, content }))];
    const approve = async ({ path, content, bytes }) => {
      if (!process.stdin.isTTY || !process.stderr.isTTY) return false;
      console.error(`\nProposed replacement: ${path} (${bytes} bytes)\n--- proposed content ---\n${content}\n--- end ---`);
      const prompt = createInterface({ input: process.stdin, output: process.stderr });
      try { return (await prompt.question("Allow this write? [y/N] ")).trim().toLowerCase() === "y"; }
      finally { prompt.close(); }
    };
    const result = await runAgentTurn({ profile, messages, root: process.cwd(), mode: session.mode, approve, onEvent: (event) => console.error(`[${event.type}] ${event.name}${event.ok === undefined ? "" : event.ok ? " ok" : " denied/failed"}`) });
    const assistant = appendMessage(state, session.id, { role: "assistant", content: result.text, actor: "provider:" + profile.id });
    await writeState(state);
    return print({ sessionId: session.id, mode: session.mode, steps: result.steps, workspace: process.cwd(), assistant });
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
  if (command === "monitor" && subcommand === "check") {
    if (!config.monitor.enabled) throw new Error("Monitor Control is disabled. Run 'madevi monitor on' before checks.");
    const snapshot = createSystemSnapshot();
    const report = evaluateSnapshot(snapshot, config.monitor.thresholds);
    const { state } = await readState();
    const incident = recordIncident(state, report);
    if (incident) await writeState(state);
    return print({ snapshot, report, incident, message: incident ? "Incident recorded. Madevi has not remediated anything automatically." : "No incident threshold was reached." });
  }
  if (command === "monitor" && subcommand === "incidents") {
    const { state } = await readState();
    return print(state.incidents);
  }
  if (command === "monitor" && subcommand === "acknowledge") {
    const { state } = await readState();
    const incident = acknowledgeIncident(state, value);
    await writeState(state);
    return print({ acknowledged: true, incident });
  }
  if (command === "monitor" && subcommand === "status") return print(monitorStatus(config));
  throw new Error("Unknown command: " + [command, subcommand, value].filter(Boolean).join(" "));
}

main().catch((error) => {
  console.error("Madevi error: " + error.message);
  process.exitCode = 1;
});
