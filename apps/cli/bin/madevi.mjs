#!/usr/bin/env node
import { readConfig, writeConfig } from "../../../packages/core/src/config.mjs";
import { readState, writeState } from "../../../packages/core/src/state.mjs";
import { approvePlan, createTaskWithPlan, findPlan, findTask } from "../../../packages/core/src/workflow.mjs";
import { monitorStatus } from "../../../services/monitor/src/sentinel.mjs";

const [command = "help", subcommand, ...remaining] = process.argv.slice(2);
const value = remaining.join(" ");

function print(output) {
  console.log(typeof output === "string" ? output : JSON.stringify(output, null, 2));
}

function help() {
  print([
    "Madevi CLI v0.1.1",
    "",
    "Usage:",
    "  madevi init",
    "  madevi status",
    "  madevi model list",
    "  madevi model use <model-id>",
    "  madevi task create <title>",
    "  madevi task list|show <task-id>",
    "  madevi plan list|show <plan-id>|approve <plan-id>",
    "  madevi audit [limit]",
    "  madevi monitor on|off|status",
    "  madevi version"
  ].join("\n"));
}

async function main() {
  if (["help", "--help", "-h"].includes(command)) return help();
  if (["version", "--version"].includes(command)) return print("Madevi CLI v0.1.1");

  const { path, config } = await readConfig();
  if (command === "init") return print({ initialized: true, configPath: path, mode: "workspace" });
  if (command === "status") {
    const activeModel = config.model.profiles.find((profile) => profile.id === config.model.active) || null;
    return print({ agent: config.agent.name, configPath: path, mode: config.monitor.enabled ? "workspace + monitor-control" : "workspace", activeModel, policy: config.policy.profile, monitorEnabled: config.monitor.enabled });
  }
  if (command === "model" && subcommand === "list") {
    return print(config.model.profiles.map((profile) => ({ ...profile, active: profile.id === config.model.active })));
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
