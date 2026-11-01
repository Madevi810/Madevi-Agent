export const RISK = Object.freeze({
  INFORMATIONAL: "informational",
  LOW: "low",
  MEDIUM: "medium",
  URGENT: "urgent",
  CRITICAL: "critical"
});

export const ACTIONS = Object.freeze([
  { id: "workspace.inspect", risk: RISK.INFORMATIONAL, scopes: ["workspace:read"], approval: "none", verification: "report findings", rollback: null },
  { id: "deploy.plan", risk: RISK.LOW, scopes: ["deploy:read"], approval: "none", verification: "plan contains validation and rollback steps", rollback: null },
  { id: "deploy.release", risk: RISK.MEDIUM, scopes: ["deploy:write"], approval: "developer", verification: "health checks pass", rollback: "deploy.rollback" },
  { id: "monitor.contain", risk: RISK.CRITICAL, scopes: ["monitor:contain"], approval: "incident-policy", verification: "public ingress and affected credentials are isolated", rollback: "monitor.restore" }
]);

export function findAction(id) {
  return ACTIONS.find((action) => action.id === id) || null;
}
