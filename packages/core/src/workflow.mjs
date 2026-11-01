import { appendAudit } from "./state.mjs";

function now() {
  return new Date().toISOString();
}

function defaultSteps(title) {
  return [
    { id: "scope", title: "Inspect scope and required tools for: " + title, status: "pending" },
    { id: "plan", title: "Prepare safe execution plan and verification checks", status: "pending" },
    { id: "approval", title: "Wait for developer approval before write actions", status: "blocked" }
  ];
}

export function createTaskWithPlan(state, { title, area = "workspace", actor = "cli" }) {
  if (!title || !title.trim()) throw new Error("Task title is required.");
  const task = {
    id: "task-" + state.counters.task++,
    title: title.trim(),
    area,
    status: "planning",
    createdAt: now(),
    updatedAt: now()
  };
  const plan = {
    id: "plan-" + state.counters.plan++,
    taskId: task.id,
    status: "draft",
    createdAt: now(),
    approvedAt: null,
    steps: defaultSteps(task.title)
  };
  state.tasks.unshift(task);
  state.plans.unshift(plan);
  appendAudit(state, { actor, type: "task.created", target: task.id, summary: task.title });
  appendAudit(state, { actor, type: "plan.created", target: plan.id, summary: "Draft plan for " + task.id });
  return { task, plan };
}

export function approvePlan(state, planId, { actor = "cli" } = {}) {
  const plan = state.plans.find((item) => item.id === planId);
  if (!plan) throw new Error("Plan not found: " + planId);
  if (plan.status === "approved") return plan;
  if (plan.status !== "draft") throw new Error("Plan cannot be approved from state: " + plan.status);

  plan.status = "approved";
  plan.approvedAt = now();
  plan.steps = plan.steps.map((step) => step.id === "approval" ? { ...step, status: "approved" } : step);

  const task = state.tasks.find((item) => item.id === plan.taskId);
  if (task) {
    task.status = "ready";
    task.updatedAt = now();
  }
  appendAudit(state, { actor, type: "plan.approved", target: plan.id, summary: "Task is ready for controlled execution." });
  return plan;
}

export function findTask(state, taskId) {
  return state.tasks.find((task) => task.id === taskId) || null;
}

export function findPlan(state, planId) {
  return state.plans.find((plan) => plan.id === planId) || null;
}
