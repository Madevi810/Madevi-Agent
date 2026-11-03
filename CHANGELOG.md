# Changelog

## 0.1.8

- Rename the product and public package identity to Madevi Harness while preserving the `madevi` command and existing repository URL.
- Add a first-party harness module registry for Workspace, Deploy, Monitor Control, Madevi Assist, and Telegram Gateway.
- Expose the read-only module manifest through the local daemon and Visual Mode.

## 0.1.7

- Add daemon-served Madevi Agent Visual Mode with live Core status and action manifest.

## 0.1.6

- Add persistent agent transcripts and Ask, Plan, Build, Review, Operate, and Assist session modes.
- Add an opt-in OpenAI-compatible text provider adapter with environment-only credentials.
- Add CLI commands for model connection, agent sessions, mode selection, and turns.

## 0.1.5

- Add a loopback-only Madevi Core daemon with health, status, and action-manifest endpoints.
- Add CLI lifecycle commands for the local daemon.
- Add daemon API integration coverage.

## 0.1.4

- Begin the Madevi runtime rebuild with a source-level benchmark of public agent repositories.
- Add shared action contracts as the foundation for future CLI, Visual Mode, Telegram, and Assist parity.
- Publish the v2 architecture and patch-by-patch release plan.

## 0.1.3

- Add deterministic Monitor Control threshold evaluation and incident lifecycle commands.
- Store monitor incidents and acknowledgements in the shared audit trail.
- Keep remediation manual: threshold detection never changes a server by itself.

## 0.1.2

- Add CLI project and model-bound session lifecycle with persistent audit records.
- Add safe custom model metadata management and explicit credential-storage guidance.
- Add action contract inspection with current policy decisions.
- Replace the Studio shell with an interactive, responsive control-plane prototype.

## 0.1.1

- Add persistent task, plan, approval, and audit lifecycle for Madevi CLI.
- Change the default model state to unselected.
- Add CLI commands for task, plan, and audit inspection.

## 0.1.0

- Bootstrap Madevi Agent Core, CLI, Studio shell, policy, and monitor snapshot.
