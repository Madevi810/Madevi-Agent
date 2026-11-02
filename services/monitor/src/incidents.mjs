import { appendAudit } from "../../../packages/core/src/state.mjs";

export function evaluateSnapshot(snapshot, thresholds) {
  const perCpuLoad = snapshot.cpuCount > 0 ? snapshot.loadAverage[0] / snapshot.cpuCount : 0;
  const signals = [];
  if (snapshot.memory.usedPercent >= thresholds.memoryCriticalPercent) signals.push({ level: "critical", code: "memory.critical", value: snapshot.memory.usedPercent, threshold: thresholds.memoryCriticalPercent, summary: "Memory usage is critically high." });
  else if (snapshot.memory.usedPercent >= thresholds.memoryWarningPercent) signals.push({ level: "warning", code: "memory.warning", value: snapshot.memory.usedPercent, threshold: thresholds.memoryWarningPercent, summary: "Memory usage is above the warning threshold." });
  if (perCpuLoad >= thresholds.loadCriticalPerCpu) signals.push({ level: "critical", code: "load.critical", value: Number(perCpuLoad.toFixed(2)), threshold: thresholds.loadCriticalPerCpu, summary: "CPU load per core is critically high." });
  else if (perCpuLoad >= thresholds.loadWarningPerCpu) signals.push({ level: "warning", code: "load.warning", value: Number(perCpuLoad.toFixed(2)), threshold: thresholds.loadWarningPerCpu, summary: "CPU load per core is above the warning threshold." });
  const level = signals.some((signal) => signal.level === "critical") ? "critical" : signals.length ? "warning" : "normal";
  return { checkedAt: snapshot.capturedAt, level, perCpuLoad: Number(perCpuLoad.toFixed(2)), signals };
}

export function recordIncident(state, report, { actor = "sentinel" } = {}) {
  if (report.level === "normal") return null;
  const incident = {
    id: "incident-" + state.counters.incident++,
    status: "open",
    severity: report.level,
    openedAt: report.checkedAt,
    acknowledgedAt: null,
    signals: report.signals
  };
  state.incidents.unshift(incident);
  appendAudit(state, { actor, type: "incident.opened", target: incident.id, summary: incident.severity + " monitor incident" });
  return incident;
}

export function acknowledgeIncident(state, incidentId, { actor = "cli" } = {}) {
  const incident = state.incidents.find((item) => item.id === incidentId);
  if (!incident) throw new Error("Incident not found: " + incidentId);
  if (incident.status === "acknowledged") return incident;
  incident.status = "acknowledged";
  incident.acknowledgedAt = new Date().toISOString();
  appendAudit(state, { actor, type: "incident.acknowledged", target: incident.id, summary: "Incident acknowledged; no remediation executed automatically." });
  return incident;
}
