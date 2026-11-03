# Madevi Harness

Madevi Harness is the product identity for the self-hosted agent system in this repository. The command remains `madevi`; no second daemon, bot, or visual application is created by the rename.

## One runtime, multiple interfaces

The harness has a single Core daemon, policy engine, action contracts, state store, and audit trail. CLI/TUI, Visual Mode, Telegram, and Madevi Assist connect to that same Core. A feature cannot become available in one interface by bypassing contracts or policy in another.

## First-party modules

| Module | Role | Current state |
|---|---|---|
| Workspace Agent | sessions, planning, code work, reviews | foundation |
| Deploy | release planning and guarded execution | planned |
| Monitor Control | signal collection, incidents, containment policy | experimental |
| Madevi Assist | website-facing assistant with public-safe boundaries | planned |
| Telegram Gateway | paired remote control and alerts | planned |

The registry describes intended lifecycle and interface reach. It grants no permission. Privileged work must still use an action contract and receive a policy decision.

## Upgrade compatibility

The `madevi` binary, `~/.madevi` home directory, and repository URL are kept for compatibility. Fresh installations show `Madevi Harness` as the default name. Existing configuration retains a user-selected agent name rather than overwriting it during normalization.
