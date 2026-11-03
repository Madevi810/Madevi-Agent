const KINDS = new Set(["runtime", "adapter", "interface"]);
const STABILITIES = new Set(["foundation", "experimental", "planned"]);

/**
 * Describes a harness module without granting it authority. Authority remains
 * in the action and policy contracts that a module may expose.
 */
export function defineModule(input) {
  const module = { actions: [], surfaces: [], ...input };
  if (!/^[a-z][a-z0-9-]*$/.test(module.id || "")) throw new Error("Module id must be lowercase letters, digits, and hyphens.");
  if (!module.title || !KINDS.has(module.kind) || !STABILITIES.has(module.stability)) {
    throw new Error("Module requires title, known kind, and known stability.");
  }
  if (!Array.isArray(module.actions) || !Array.isArray(module.surfaces)) throw new Error("Module actions and surfaces must be arrays.");
  return Object.freeze({ ...module, actions: Object.freeze([...module.actions]), surfaces: Object.freeze([...module.surfaces]) });
}

export function assertUniqueModules(modules) {
  const ids = new Set();
  for (const module of modules) {
    if (ids.has(module.id)) throw new Error("Duplicate module id: " + module.id);
    ids.add(module.id);
  }
  return true;
}
