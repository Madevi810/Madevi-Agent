import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_CONFIG = Object.freeze({
  schemaVersion: 1,
  agent: { name: "Madevi Harness", updateChannel: "stable" },
  workspace: { activeProject: null },
  model: {
    active: null,
    profiles: [
      { id: "gpt-coder", provider: "OpenAI", label: "GPT Coder", source: "managed" },
      { id: "claude-code", provider: "Anthropic", label: "Claude Code", source: "managed" },
      { id: "internal-llm", provider: "Custom API", label: "Internal LLM", source: "custom" },
      { id: "qwen-coder", provider: "Local", label: "Qwen Coder", source: "local" }
    ]
  },
  monitor: {
    enabled: false,
    auditIntervalHours: 12,
    thresholds: { memoryWarningPercent: 85, memoryCriticalPercent: 95, loadWarningPerCpu: 1.25, loadCriticalPerCpu: 2 }
  },
  policy: { profile: "safe-edit" }
});

export function normalizeConfig(value) {
  const config = value && typeof value === "object" ? value : {};
  config.schemaVersion = 1;
  config.agent = { ...DEFAULT_CONFIG.agent, ...(config.agent || {}) };
  config.workspace = { ...DEFAULT_CONFIG.workspace, ...(config.workspace || {}) };
  config.model = { ...DEFAULT_CONFIG.model, ...(config.model || {}) };
  if (!Array.isArray(config.model.profiles)) config.model.profiles = [...DEFAULT_CONFIG.model.profiles];
  config.monitor = { ...DEFAULT_CONFIG.monitor, ...(config.monitor || {}) };
  config.monitor.thresholds = { ...DEFAULT_CONFIG.monitor.thresholds, ...(config.monitor.thresholds || {}) };
  config.policy = { ...DEFAULT_CONFIG.policy, ...(config.policy || {}) };
  return config;
}

export function madeviHome(home = process.env.MADEVI_HOME) {
  return home || join(homedir(), ".madevi");
}

export function configFile(home) {
  return join(madeviHome(home), "config.json");
}

export async function initializeConfig(home) {
  const folder = madeviHome(home);
  await mkdir(folder, { recursive: true });
  const path = configFile(folder);
  try {
    await readFile(path, "utf8");
  } catch {
    await writeFile(path, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n", "utf8");
  }
  return path;
}

export async function readConfig(home) {
  const path = await initializeConfig(home);
  return { path, config: normalizeConfig(JSON.parse(await readFile(path, "utf8"))) };
}

export async function writeConfig(config, home) {
  const path = await initializeConfig(home);
  await writeFile(path, JSON.stringify(config, null, 2) + "\n", "utf8");
  return path;
}
