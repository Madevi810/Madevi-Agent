import { appendAudit } from "./state.mjs";

function now() {
  return new Date().toISOString();
}

export function createProject(state, { name, path = null, actor = "cli" }) {
  if (!name || !name.trim()) throw new Error("Project name is required.");
  const project = {
    id: "project-" + state.counters.project++,
    name: name.trim(),
    path: path || null,
    createdAt: now(),
    updatedAt: now()
  };
  state.projects.unshift(project);
  appendAudit(state, { actor, type: "project.created", target: project.id, summary: project.name });
  return project;
}

export function findProject(state, projectId) {
  return state.projects.find((project) => project.id === projectId) || null;
}

export function startSession(state, { title, projectId = null, modelId, actor = "cli" }) {
  if (!modelId) throw new Error("Select a model before starting a session.");
  const session = {
    id: "session-" + state.counters.session++,
    title: (title || "Untitled session").trim(),
    projectId,
    modelId,
    status: "active",
    createdAt: now(),
    updatedAt: now()
  };
  state.sessions.unshift(session);
  appendAudit(state, { actor, type: "session.started", target: session.id, summary: session.title });
  return session;
}

export function closeSession(state, sessionId, { actor = "cli" } = {}) {
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session) throw new Error("Session not found: " + sessionId);
  if (session.status === "closed") return session;
  session.status = "closed";
  session.updatedAt = now();
  appendAudit(state, { actor, type: "session.closed", target: session.id, summary: session.title });
  return session;
}
