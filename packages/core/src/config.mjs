import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_CONFIG = Object.freeze({
  schemaVersion: 1,
  agent: { name: "Madevi", updateChannel: "stable" },
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
  monitor: { enabled: false, auditIntervalHours: 12 },
  policy: { profile: "safe-edit" }
});

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
  return { path, config: JSON.parse(await readFile(path, "utf8")) };
}

export async function writeConfig(config, home) {
  const path = await initializeConfig(home);
  await writeFile(path, JSON.stringify(config, null, 2) + "\n", "utf8");
  return path;
}
