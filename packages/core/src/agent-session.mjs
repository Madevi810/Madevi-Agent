import { appendAudit } from "./state.mjs";

export const AGENT_MODES = Object.freeze(["ask", "plan", "build", "review", "operate", "assist"]);

function now() { return new Date().toISOString(); }

function getSession(state, sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session) throw new Error("Session not found: " + sessionId);
  return session;
}

export function createAgentSession(state, { title, modelId, projectId = null, mode = "ask", actor = "cli" }) {
  if (!modelId) throw new Error("Select a model before starting an agent session.");
  if (!AGENT_MODES.includes(mode)) throw new Error("Unknown agent mode: " + mode);
  const session = {
    id: "session-" + state.counters.session++,
    title: (title || "Untitled agent session").trim(),
    projectId,
    modelId,
    mode,
    status: "active",
    messages: [],
    createdAt: now(),
    updatedAt: now()
  };
  state.sessions.unshift(session);
  appendAudit(state, { actor, type: "agent.session.started", target: session.id, summary: session.title + " (" + mode + ")" });
  return session;
}

export function setAgentMode(state, sessionId, mode, { actor = "cli" } = {}) {
  if (!AGENT_MODES.includes(mode)) throw new Error("Unknown agent mode: " + mode);
  const session = getSession(state, sessionId);
  session.mode = mode;
  session.updatedAt = now();
  appendAudit(state, { actor, type: "agent.mode.changed", target: session.id, summary: "Mode changed to " + mode });
  return session;
}

export function appendMessage(state, sessionId, { role, content, actor = "cli" }) {
  if (!["user", "assistant", "system", "tool"].includes(role)) throw new Error("Unknown message role: " + role);
  if (!content || !content.trim()) throw new Error("Message content is required.");
  const session = getSession(state, sessionId);
  if (!Array.isArray(session.messages)) session.messages = [];
  const message = { id: session.id + "-message-" + (session.messages.length + 1), role, content: content.trim(), createdAt: now() };
  session.messages.push(message);
  session.updatedAt = now();
  appendAudit(state, { actor, type: "agent.message." + role, target: session.id, summary: content.trim().slice(0, 120) });
  return message;
}

export function systemPromptForMode(mode) {
  const rules = {
    ask: "Answer and inspect only. Do not propose executing write actions.",
    plan: "Analyze the request and produce a safe plan. Do not edit files or run mutating tools.",
    build: "Implement only within the approved workspace. Run declared verification after edits.",
    review: "Review changes and report evidence. Do not mutate the workspace.",
    operate: "Treat infrastructure actions as policy-governed. Ask for approval when required.",
    assist: "Use only public-safe knowledge and tools. Never expose secrets or operational access."
  };
  return "You are Madevi Harness. " + rules[mode];
}
