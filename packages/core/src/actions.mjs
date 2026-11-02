import { assertUniqueActions, defineAction } from "../../contracts/src/action-contract.mjs";

export const RISK = Object.freeze({
  INFORMATIONAL: "informational",
  LOW: "low",
  MEDIUM: "medium",
  URGENT: "urgent",
  CRITICAL: "critical"
});

export const ACTIONS = Object.freeze([
  defineAction({ id: "workspace.inspect", title: "Inspect workspace", area: "workspace", risk: RISK.INFORMATIONAL, scopes: ["workspace:read"], approval: "none", executor: "workspace", verification: "report findings", surfaces: ["cli", "visual"] }),
  defineAction({ id: "workspace.edit", title: "Edit workspace", area: "workspace", risk: RISK.LOW, scopes: ["workspace:write"], approval: "policy", executor: "workspace", verification: "run declared checks", rollback: "git revert or restore backup", surfaces: ["cli", "visual"] }),
  defineAction({ id: "deploy.plan", title: "Plan deployment", area: "deploy", risk: RISK.LOW, scopes: ["deploy:read"], approval: "none", executor: "deploy", verification: "plan contains validation and rollback steps", surfaces: ["cli", "visual", "telegram"] }),
  defineAction({ id: "deploy.release", title: "Release deployment", area: "deploy", risk: RISK.MEDIUM, scopes: ["deploy:write"], approval: "developer", executor: "deploy", verification: "health checks pass", rollback: "deploy.rollback", surfaces: ["cli", "visual", "telegram"] }),
  defineAction({ id: "monitor.block", title: "Block suspicious traffic", area: "monitor", risk: RISK.URGENT, scopes: ["monitor:defend"], approval: "developer-or-emergency-policy", executor: "monitor", verification: "confirm attack signal subsides", rollback: "monitor.unblock", surfaces: ["cli", "visual", "telegram"] }),
  defineAction({ id: "monitor.contain", title: "Contain critical incident", area: "monitor", risk: RISK.CRITICAL, scopes: ["monitor:contain"], approval: "incident-policy", executor: "monitor", verification: "public ingress and affected credentials are isolated", rollback: "monitor.restore", surfaces: ["cli", "visual", "telegram"] })
]);

assertUniqueActions(ACTIONS);

export function findAction(id) {
  return ACTIONS.find((action) => action.id === id) || null;
}
