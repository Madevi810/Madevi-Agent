# Madevi Harness: forensic baseline and construction strategy

Status: preliminary source investigation, 2026-11-03. This is a baseline, not a completed behavioral benchmark. The objectives are a useful general-purpose agent harness and, later, Madevi's operational modules. Claims of superiority require comparable measurements.

## Evidence ledger

All references below are pinned to inspected clones. Source observations describe the referenced code, not a complete inventory or a runtime experiment.

| Target | Revision | Observation | Boundary |
| --- | --- | --- | --- |
| [Codex](https://github.com/openai/codex/tree/cb2b5857c249c88075a973faad53b6693248a6cc) | cb2b5857c249c88075a973faad53b6693248a6cc | `codex-rs/core/src/session/turn.rs` starts a turn with cancellation and pre-sampling compaction; `tools/orchestrator.rs` includes per-attempt sandbox and approval handling. | Partial source reading; CLI not run in this environment. |
| [OpenCode](https://github.com/anomalyco/opencode/tree/3ba597f) | 3ba597f | `packages/core/src/session/runner/llm.ts` brings together session storage, context, transport, compaction and stale tool-call settlement. | Partial source reading; no observed model/tool session. |
| [Hermes](https://github.com/NousResearch/hermes-agent/tree/c314285f) | c314285f | `run_agent.py` executes tool batches, segments parallel-safe work from sequential barriers and has stall-guard handling. | Partial source reading; CLI not run. |
| [Claude Code](https://github.com/anthropics/claude-code/tree/964d695) | 964d695 | The checked repository contains examples, plugins, tests and documentation. | The internal agent loop was not established by this inspection; CLI not run. |
| [Antigravity candidate](https://github.com/google-antigravity/antigravity-cli/tree/841f45d) | 841f45d | Tracked files observed include README, demo and statusline/title examples. | Authenticity as the official implementation and internal runtime remain unverified; CLI not run. Do not infer architecture from this repo. |
| [REA](https://github.com/morluto/rea/tree/8c857ce) | 8c857ce | The REA skill directs source-level work to repository tools and process/packaged behavior to evidence-producing REA workflows. Process capture inherits privileges and is not a sandbox. | No REA Evidence was produced in this pass. The current session has no REA MCP tools; package acquisition was attempted but did not complete. |
| Madevi Harness | ef15246308b5e9115a1d493873fc60600a0f2a14 | Actual local `--version`, `init`, `status`, and `action show workspace.edit` ran; 11 existing automated tests passed. | No live model, third-party CLI benchmark or UI browser test was performed. |

For reproducible continuation, record full revision, license, install method, runtime version, platform, fixture digest, commands and exit status. Distinguish source observations, runtime observations, inference, and unknown. Do not publish credentials or third-party source copies.

## Madevi baseline and risks

1. `apps/cli/bin/madevi.mjs` persists the user message then calls `completeWithProfile` once. `packages/core/src/provider.mjs` extracts assistant text only; there is no model-to-tool-to-model loop. `workspace.edit` is a declaration, not a working executor.
2. Agent modes in `agent-session.mjs` are prompt instructions; they are not an enforced sandbox. `policyDecision` returns a decision, but the present policy is not a complete execution boundary. A low-risk edit is reported as allowed without approval; no edit was performed in the probe.
3. `state.mjs` writes a single JSON document using a shared `.tmp` path, without a visible concurrency protocol. Concurrent processes can lose updates or conflict. Audit is capped at 500 entries and message summaries may contain sensitive user text. It is not an append-only security audit.
4. The daemon exposes read-only routes; Visual Mode cannot yet execute the CLI's operations. Capability parity is a target, not a present property. Telegram, Assist, deploy and automatic containment are not implemented by listing modules.
5. OpenAI-compatible text completion works through environment-sourced credentials, but tool calling, streaming, retry semantics, provider capability negotiation and explicit timeouts require implementation and tests.

## Target architecture

One core owns durable sessions and a versioned event protocol. CLI and Visual are clients of that core; Telegram and Assist are policy-scoped adapters. The core routes each model-requested tool through validated schemas, identity, authority, approval, an isolated executor and an evidence/audit pipeline. A capability declaration grants no execution authority.

### Construction order and acceptance gates

1. **Research lab:** finish pinned source traces, verify Antigravity provenance, obtain permitted runnable CLIs and run identical isolated fixture scenarios. Use REA process capture where available, retaining its actual evidence and limitations. Output feature matrix and license review; do not treat inaccessible code as observed.
2. **Durable turn engine:** persist turn/tool-call states, streaming events, interruption, cancellation and restart recovery. Tests must cover crashes at each transition and replay without duplicating a side effect.
3. **Provider and tool loop:** add typed provider capabilities, structured tool calls/results, bounded steps, timeouts and loop-stall detection. A deterministic fake provider must drive a read → edit → test task to completion.
4. **Authority and sandbox:** enforce real workspace boundaries and per-tool permissions outside the prompt; validate canonical paths, symlinks, command execution and network access. Fail closed where an OS sandbox is unavailable. Tests must prove plan mode cannot write even if a model asks.
5. **Persistence and audit:** transactional store, migrations and concurrent writer tests; durable redacted audit with retention configuration; explicit uncertainty when a side effect may have completed before a crash.
6. **Developer usefulness:** interactive CLI, repository search, safe file edits, diff, shell, Git-aware workflow, test/lint feedback, context budgeting and resume. Evaluate on held-out fixtures, including broken tests and denied permissions.
7. **Extensibility and identity:** provider authentication through supported methods, local/custom endpoints, project rules, skills and MCP lifecycle; constrain extensions with declared scopes and explicit grants.
8. **Shared surfaces:** daemon actions and event streaming consumed by CLI and visual; test equivalent authorized outcomes and denials for each identity. Add Telegram with pairing, revocation and approval binding.
9. **Madevi modules:** Assist with public-safe permissions; Deploy with dry-run, verification and rollback; Monitor with low-cost detectors, independent 12-hour audits, incident handling, explicit emergency policy and reversible containment. Never implement blanket shutdown as an untested default.
10. **Release gate:** local and VPS integration, independent security review, migration/recovery, documented support matrix and comparative task benchmarks. Report task completion, test success, permission escapes, latency and token/cost with reproducible model and environment.

## Design differentiators to validate

- Evidence receipts bind intended action, approval, changes and verification without storing secrets.
- Recoverable task timeline makes uncertain side effects visible and asks for reconciliation rather than silently retrying them.
- Operations-aware workflows connect code changes, deployment health and incidents under a single policy model.
- Event-driven monitoring only wakes a model when an event requires analysis; deterministic detection runs independently.

These are product hypotheses, not proven advantages. Complexity is valuable only when the system stays usable, secure and measurable.

## Remaining investigation

- Obtain or build each legitimate CLI in an isolated environment with no production credentials; perform help/version and a deterministic fixture, then model-backed runs when a suitable test provider is available.
- Obtain a working REA CLI/MCP with its process-capture prerequisites. A process capture does not provide isolation: run it inside a separately isolated disposable environment.
- Verify repository provenance and license terms before reusing code; prefer original implementations from documented principles.
- Trace Codex tool routing and cancellation end-to-end, OpenCode permission/store transitions, Hermes provider/session and skill lifecycle. Document exact source locations and unanswered questions.
