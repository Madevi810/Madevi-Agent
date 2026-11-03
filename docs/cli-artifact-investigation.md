# CLI artifact investigation

Date: 2026-11-03. This records direct observations of downloaded Linux x86-64 artifacts and source. It is not a complete reverse engineering of the runtimes, a model-backed comparison, or proof that Madevi has equivalent features. No third-party binaries are redistributed in this repository.

## Provenance and identity

| Product | Download | Observed version | Executable SHA-256 |
| --- | --- | --- | --- |
| Codex | `@openai/codex@0.166.0-linux-x64` npm platform package | `codex-cli 0.166.0` | `b8a11fedf24b2dfb59a70c9e52b030f9a508dcd49cd2dd0d41956f4c785156b8` |
| OpenCode | `@opencode/cli-linux-x64@2.2.5` npm platform package | `opencode v2.2.5` | `8d060e1d2fbb9bb44cf09ae6ed1f3f6a7cff070b5227e2f90970132b23a92050` |
| Claude Code | `@anthropic-ai/claude-code-linux-x64@2.1.317` npm platform package | `2.1.317 (Claude Code)` | `eb224419e344575faa4a1f39b290b649425a10cd5ee2ef1d003480cd9ae57eb0` |
| Antigravity | Google official CLI installer manifest, Linux x64 archive version 1.4.12 | `1.4.12` | `1edfb30477447825f0aaa05fd9a91d82f9adf26686f41cd4f5c70b90abe383e8` |
| Hermes | Public source `NousResearch/hermes-agent` | `vgit.c314285`; commit `c314285f077e91937c995d419b9fa40af9eb4981` | Python source; no standalone binary. |

The Antigravity archive's SHA-512 matched the official manifest: `ea01c73b772187bca928852cf96235f0d846d6da5ebdac188b9ae719597465737f325540d483ee5f3f62d151029001713344972a187ddfb98cc7b97f7204b7f4`. The top-level npm packages of Codex, OpenCode and Claude are wrappers/installers; the platform packages contain the real executables. `file` identifies all four as ELF x86-64 executables; the observed Codex and Antigravity binaries are stripped. A native executable does not expose its original source merely by unpacking its archive.

## Direct CLI observations

Each of the four binaries ran `--version` and `--help` successfully under `env -i PATH=/usr/bin:/bin TERM=dumb` and a ten/twelve-second timeout. Hermes source also ran those commands using an isolated Python 3.14 environment after installing minimal dependencies. No real model account, secret or project was passed. Help output establishes exposed interfaces, not that each feature was executed or verified.

| Product | Exposed by observed help | Madevi implication |
| --- | --- | --- |
| Codex | Interactive and `exec` modes; resume/fork; workspace directories; sandbox and approvals; MCP; app server; plugins. | Support noninteractive and interactive paths through one core; enforce sandbox and session lifecycle, rather than only naming modes. |
| OpenCode | `run`, `session`, `auth`, `mcp`, `plugin`, `serve`, background service and standalone mode. | Decouple client from shared server, and make services and session identity explicit. |
| Claude Code | Print mode; tool allow/deny lists; custom agents; MCP; session resume; background agent and plugin commands. | Per-tool permissions, structured output and session controls need real implementation and tests. |
| Antigravity | Plan/auto/accept-edits modes; print and streaming JSON; resume; sandbox option; MCP/plugins and remote-control subcommand. | Machine-readable event stream, mode policy and remote controls must be consistent with local enforcement. |
| Hermes | TUI/CLI, model and fallback, skill selection, profiles, worktrees, gateway, cron and webhook commands. | Provide isolated profiles and a unified messaging gateway; schedule execution independently of an interactive client. |

Hermes source entry point is `hermes_cli.main:main` (`pyproject.toml`). Initial launch failed on missing dependencies; after installing a minimal set in a separate virtual environment, help and version ran. Version lookup reported network name-resolution failure and the OpenAI SDK was not installed. This does not establish a working model-backed session.

## Source traces corroborating design, not runtime benchmarks

- Codex `codex-rs/core/src/session/turn.rs` runs turn preparation and compaction; `tools/orchestrator.rs` handles tool execution with sandbox and approval context.
- OpenCode `packages/core/src/session/runner/llm.ts` coordinates model transport, storage, context, compaction, and settlement of stale tool calls.
- Hermes `run_agent.py` separates parallel-safe tool segments from sequential barriers and implements stall guards.
- Claude and Antigravity help descriptions are public interface evidence; do not claim their internal algorithms were established by help or strings.

## Madevi v0.1.9 gaps and next working slices

1. Replace one-turn transient tool transcript with durable, recoverable tool-call and approval states; never replay an uncertain write silently.
2. Replace pathname-only checking with an actual OS-backed sandbox and handle symlink/race conditions. The current workspace tools are not an OS security boundary.
3. Add bounded process execution inside the sandbox, command approval, captured output and test execution; explicitly preserve non-interactive denial by default.
4. Implement interactive TUI, structured event streaming and noninteractive mode on shared core APIs; currently the visual endpoint is read-only.
5. Add provider capability negotiation, authentication adapters, context compaction, MCP/skill lifecycle and transactional persistence with redacted durable audit.
6. Compare in controlled fixtures: identical bug fix, plan-only refusal to write, failed test, interrupted tool call, session resume and provider outage. Record exact versions, configuration, model, fixture hash, outputs and costs. CLI help/version alone cannot establish superiority.

Monitor, deploy, Telegram and website assistant remain later first-party modules subject to the same core policy; public assistant identities must not inherit administrative tools.
