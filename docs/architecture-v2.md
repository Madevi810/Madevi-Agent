# Madevi Agent Runtime v2

Madevi is one self-hosted agent runtime. CLI, Visual Mode, Telegram, and Madevi Assist are interfaces to the same daemon, state, policy, and action contracts.

## Runtime shape

~~~text
interfaces → control gateway → agent runtime → policy → executors → audit/events
~~~

The runtime owns sessions, context collection, model routing, tool calls, task graphs, approval pauses, retries, and recovery. Interfaces never implement their own execution logic.

## Surfaces

| Surface | Location | Purpose |
|---|---|---|
| CLI/TUI | terminal or SSH | keyboard-first agent work and automation |
| Visual Mode | `127.0.0.1` locally or `agent.<domain>` on a VPS | full visual/IDE representation of the same capabilities |
| Telegram | paired users only | concise remote control, approvals, alerts, and handoff |
| Madevi Assist | a website widget/API | public or internal assistant with a strictly limited tool policy |

Visual Mode and CLI have capability parity for the same identity. A different role may have fewer permissions; a different interface may not.

## Action contract

Every operation declares an id, schema, area, scopes, risk, approval policy, executor, verification, rollback, and supported interfaces. `packages/contracts` is the canonical action declaration layer. Future UI buttons, CLI commands, bot commands, and assistant workflows must resolve an existing action contract.

## Modes

| Mode | Default authority |
|---|---|
| Ask | read-only exploration |
| Plan | analysis and plan artifacts; no write executor |
| Build | workspace writes inside an approved sandbox |
| Review | read-only code, quality, and security review |
| Operate | deploy and infrastructure actions guarded by policy |
| Assist | knowledge and public-safe tools only |

## Security boundaries

- The daemon binds to loopback by default. A VPS exposes it only through an authenticated HTTPS reverse proxy.
- Browser UI, CLI, Telegram, and Assist share an identity and authorization model.
- Secrets use a keychain/vault adapter; they never enter project config, chat history, or audit payloads.
- Public Assist cannot access terminal, deploy, Monitor Control, or unrestricted databases.
- Higher-risk actions require explicit approval, verification, rollback, and append-only audit events.

## Operations model

The token-free sentinel evaluates host and integration signals continuously. A twelve-hour audit is a scheduled deep review, not the only detection method. The model is called only when an event requires analysis, a plan, or an approved remediation.

Critical containment is preconfigured per environment. It prioritizes reversible isolation—maintenance mode, ingress blocking, credential rotation request, or service stop—over destructive actions.
