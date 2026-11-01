import { RISK } from "../../core/src/actions.mjs";

export const DEFAULT_APPROVAL_WINDOWS = Object.freeze({
  [RISK.INFORMATIONAL]: { approval: false, timeoutMinutes: 0 },
  [RISK.LOW]: { approval: false, timeoutMinutes: 0 },
  [RISK.MEDIUM]: { approval: true, timeoutMinutes: 60 },
  [RISK.URGENT]: { approval: true, timeoutMinutes: 10 },
  [RISK.CRITICAL]: { approval: "policy-defined", timeoutMinutes: 0 }
});

export function policyDecision(action, { monitorEnabled = false } = {}) {
  if (action.id.startsWith("monitor.") && !monitorEnabled) {
    return { allowed: false, reason: "Monitor Control is disabled." };
  }
  const rule = DEFAULT_APPROVAL_WINDOWS[action.risk];
  return { allowed: true, ...rule, reason: rule.approval ? "Approval required before execution." : "Safe action." };
}
