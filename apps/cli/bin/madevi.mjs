#!/usr/bin/env node
import { readConfig, writeConfig } from "../../../packages/core/src/config.mjs";
import { monitorStatus } from "../../../services/monitor/src/sentinel.mjs";

const [command = "help", subcommand, value] = process.argv.slice(2);

function print(output) {
  console.log(typeof output === "string" ? output : JSON.stringify(output, null, 2));
}

function help() {
  print([
    "Madevi CLI v0.1.0",
    "",
    "Usage:",
    "  madevi init",
    "  madevi status",
    "  madevi model list",
    "  madevi model use <model-id>",
    "  madevi monitor on|off|status",
    "  madevi version"
  ].join("\n"));
}

async function main() {
  if (["help", "--help", "-h"].includes(command)) return help();
  if (["version", "--version"].includes(command)) return print("Madevi CLI v0.1.0");

  const { path, config } = await readConfig();
  if (command === "init") return print({ initialized: true, configPath: path, mode: "workspace" });
  if (command === "status") {
    const activeModel = config.model.profiles.find((profile) => profile.id === config.model.active);
    return print({ agent: config.agent.name, configPath: path, mode: config.monitor.enabled ? "workspace + monitor-control" : "workspace", activeModel, policy: config.policy.profile, monitorEnabled: config.monitor.enabled });
  }
  if (command === "model" && subcommand === "list") {
    return print(config.model.profiles.map((profile) => ({ ...profile, active: profile.id === config.model.active })));
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
