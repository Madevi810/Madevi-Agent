# Agent runtime benchmark

This document records architectural lessons from public upstream repositories reviewed for Madevi. It is not a license to copy their code, branding, prompts, or product identity.

| Project | Source-level observation | Madevi decision |
|---|---|---|
| OpenAI Codex | Rust workspace separates core business logic, app-server/daemon, protocol, TUI, sandbox, exec policy, thread store, skills, MCP, and worktree support. | Build one Core with a local daemon and typed event/action protocol; keep UI clients thin. |
| OpenCode | TypeScript monorepo separates core/session/tool state, server handlers, CLI/TUI, desktop/web, provider plugins, SQLite persistence, PTY, MCP, worktrees, and schedules. | Keep runtime, clients, adapters, and modules separately testable; action contracts are shared. |
| Hermes Agent | Gateway-centric runtime has lifecycle recovery, profiles, memory, toolsets, skills, plugins, messaging platforms, cron, vault paths, and rich evaluation suites. | Treat lifecycle, resumability, channel handoff, and test scenarios as product features, not afterthoughts. |
| Aider | A focused terminal agent combines repository mapping, model routing, edit strategies, lint/test feedback, and Git-aware workflow. | Make the default coding loop fast and useful before expanding operations modules. |
| Goose | Rust workspace includes agent, ACP, MCP, provider inventory, permissions, session management, recipes, subagents, desktop, and CLI. | Use protocol and extension boundaries so Madevi can grow without replacing its Core. |
| Claude Code / Antigravity CLI | Public repositories reviewed contain integration, configuration, examples, and installer material; their full internal runtime is not present there. | Learn only from verifiable public interfaces and documentation; do not infer or reproduce private implementation. |

## Non-negotiable conclusions

1. A live agent needs a durable daemon, session engine, executor lifecycle, recovery, and event stream.
2. Tool permission is granular; a global “agent allowed” switch is insufficient.
3. A GUI and CLI must be clients of one protocol to stay equal.
4. Memory, skills, MCP, project instructions, and provider routing must be explicit subsystems.
5. Monitor, deploy, Telegram, and web assistance belong behind the same policy and audit boundary.
