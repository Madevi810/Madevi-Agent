import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { madeviHome } from "./config.mjs";

export const DEFAULT_STATE = Object.freeze({
  schemaVersion: 1,
  counters: { task: 1, plan: 1, audit: 1, project: 1, session: 1, incident: 1 },
  tasks: [],
  plans: [],
  projects: [],
  sessions: [],
  incidents: [],
  audit: []
});

export function normalizeState(value) {
  const state = value && typeof value === "object" ? value : {};
  state.schemaVersion = 1;
  state.counters = { ...DEFAULT_STATE.counters, ...(state.counters || {}) };
  for (const collection of ["tasks", "plans", "projects", "sessions", "incidents", "audit"]) {
    if (!Array.isArray(state[collection])) state[collection] = [];
  }
  return state;
}

export function stateFile(home) {
  return join(madeviHome(home), "state.json");
}

export async function initializeState(home) {
  const folder = madeviHome(home);
  const path = stateFile(folder);
  await mkdir(folder, { recursive: true });
  try {
    await readFile(path, "utf8");
  } catch {
    await writeFile(path, JSON.stringify(DEFAULT_STATE, null, 2) + "\n", "utf8");
  }
  return path;
}

export async function readState(home) {
  const path = await initializeState(home);
  return { path, state: normalizeState(JSON.parse(await readFile(path, "utf8"))) };
}

export async function writeState(state, home) {
  const path = await initializeState(home);
  const temporary = path + ".tmp";
  await writeFile(temporary, JSON.stringify(state, null, 2) + "\n", "utf8");
  await rename(temporary, path);
  return path;
}

export function appendAudit(state, event) {
  const entry = {
    id: "audit-" + state.counters.audit++,
    at: new Date().toISOString(),
    ...event
  };
  state.audit.unshift(entry);
  state.audit = state.audit.slice(0, 500);
  return entry;
}
