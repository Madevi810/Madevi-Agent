const SURFACES = new Set(["cli", "visual", "telegram", "assist"]);
const RISKS = new Set(["informational", "low", "medium", "urgent", "critical"]);

/**
 * The single source of truth for a capability exposed by Madevi.
 * Interfaces render or invoke contracts; they must not invent execution rules.
 */
export function defineAction(input) {
  const action = {
    input: { type: "object", required: [], properties: {} },
    surfaces: ["cli", "visual"],
    rollback: null,
    ...input
  };
  if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/.test(action.id || "")) {
    throw new Error("Action id must be dot-separated lowercase words.");
  }
  if (!action.title || !RISKS.has(action.risk)) throw new Error("Action requires title and known risk.");
  if (!Array.isArray(action.scopes) || !action.scopes.length) throw new Error("Action requires at least one scope.");
  if (!Array.isArray(action.surfaces) || !action.surfaces.length || action.surfaces.some((surface) => !SURFACES.has(surface))) {
    throw new Error("Action must declare supported surfaces.");
  }
  if (!action.approval || !action.executor || !action.verification) throw new Error("Action requires approval, executor, and verification.");
  return Object.freeze({ ...action, scopes: Object.freeze([...action.scopes]), surfaces: Object.freeze([...action.surfaces]) });
}

export function actionManifest(actions, surface) {
  if (!SURFACES.has(surface)) throw new Error("Unknown surface: " + surface);
  return actions.filter((action) => action.surfaces.includes(surface)).map((action) => ({
    id: action.id,
    title: action.title,
    area: action.area,
    risk: action.risk,
    approval: action.approval,
    scopes: action.scopes
  }));
}

export function assertUniqueActions(actions) {
  const ids = new Set();
  for (const action of actions) {
    if (ids.has(action.id)) throw new Error("Duplicate action id: " + action.id);
    ids.add(action.id);
  }
  return true;
}
