# Madevi Harness release plan

The public version advances one patch for each completed, tested vertical slice. Update classification remains separate: minor updates are optional; major updates are mandatory compatibility releases.

| Patch | Vertical slice | Exit criteria |
|---|---|---|
| 0.1.4 | Runtime architecture, source benchmark, action contracts | contracts validate, current actions migrate, documentation is internally consistent |
| 0.1.5 | Local daemon and control API | start/stop/status, event stream, daemon lock, loopback-only server, migration/backup tests |
| 0.1.6 | Standard interactive CLI agent | Ask/Plan/Build/Review, workspace boundaries, streamed tool execution, session resume |
| 0.1.7 | Visual Mode parity | browser UI calls daemon API; parity manifest and end-to-end CLI/UI test pass |
| 0.1.8 | Harness identity and module registry | product migration, first-party module contracts, daemon module endpoint, tests |
| 0.1.9 | Provider, context, skills, plugins | provider adapter, vault boundary, project rules, MCP/skill lifecycle |
| 0.1.10 | Madevi Assist | assistant profiles, knowledge source contract, public tool boundary, website channel API |
| 0.1.11 | Monitor runtime | scheduler, signal adapters, incident policy, alert/event simulation |
| 0.1.12 | Telegram gateway | pairing, `/ms`, approvals, alert delivery, channel handoff |
| 0.1.13 | Deploy runtime | environment verification, adapter contract, health checks, rollback contract |
| 0.1.14 | Final integration | local/VPS end-to-end tests, security review, migration tests, documentation, release audit |

No patch is released only because a folder or menu exists. Each requires a working path, automated checks, a changelog entry, and a public commit.
