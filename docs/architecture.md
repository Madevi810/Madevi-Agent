# Madevi architecture

## Control plane

Every interface calls the same action registry:

~~~
Studio / CLI / Telegram Bot
            ↓
Action Registry → Policy Engine → Audit Trail
            ↓
Task Runtime → Workspace | Deploy | Monitor adapters
~~~

An action declaration must include its risk level, permission scopes, approval rule, verification procedure, and rollback option. The language model proposes work; deterministic policy decides whether a tool may run.

## Operating areas

| Area | Purpose | Default |
|---|---|---|
| Workspace | Files, Git, plans, tasks, terminal and model sessions | Enabled |
| Deploy | Infrastructure checks, releases, health validation, rollback | Enabled when requested |
| Monitor Control | Metrics, logs, alerts, security rules, incidents and audits | Disabled |

## Update policy

Madevi uses only two release categories:

- **Minor update:** optional fixes and improvements.
- **Major update:** required bundle upgrade for Core, CLI, Studio, Bot, Deploy, and Monitor compatibility.

A major update waits for active work to reach a safe checkpoint, retains the monitor sentinel, backs up state, verifies the new runtime, and rolls back on failure.
