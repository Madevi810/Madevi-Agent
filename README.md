# Madevi Agent

Madevi is an open-source, self-hosted agent platform for three connected jobs:

- **Workspace** — plan, inspect, edit, test, and automate project work.
- **Deploy** — verify infrastructure, release projects, validate health, and roll back safely.
- **Monitor Control** — optional low-cost server monitoring, incident handling, and scheduled audits.

Madevi has one shared control plane with three interfaces: Madevi CLI, Madevi Studio, and Madevi Bot. A task, approval, or incident has the same state in every interface.

> Status: early foundation. The CLI in this repository is dependency-free and safe by default; it does not execute project code or server actions yet.

## Studio preview

![Madevi Studio deployment plan preview](docs/assets/madevi-studio-preview.jpg)

The Studio design is chat-first: the active task and approval flow stay in the workspace, while project, model, deploy, monitor, and security controls live in the right-side control panel.

## Quick start

Requires Node.js 20 or newer.

~~~
git clone https://github.com/Madevi810/Madevi-Agent.git
cd Madevi-Agent
npm run cli -- init
npm run cli -- status
~~~

### One-command install

For Linux and macOS with Git and Node.js 20 or newer:

~~~
curl -fsSL https://raw.githubusercontent.com/Madevi810/Madevi-Agent/main/scripts/install.sh | bash
~~~

The installer uses ~/.local/share/madevi, creates ~/.local/bin/madevi, preserves an installation with uncommitted changes, and never uses sudo. If ~/.local/bin is not on PATH, it prints the one-line PATH command to add.

Useful starter commands:

~~~
npm run cli -- model list
npm run cli -- model use gpt-coder
npm run cli -- monitor on
npm run cli -- monitor status
~~~

Configuration is stored locally in ~/.madevi/config.json. Set MADEVI_HOME to use a different directory.

## Repository map

~~~
apps/cli/          Command-line interface
apps/studio/       Static Madevi Studio shell
packages/core/     Configuration and shared action contracts
packages/policy/   Risk tiers and approval rules
services/monitor/  Token-free system snapshot sentinel
docs/              Architecture notes
~~~

## Safety model

- Monitoring is disabled until explicitly enabled.
- The default policy is read-only / safe-edit; destructive server actions are not implemented in the starter.
- Future tools must declare risk, required permission, approval rule, verification, and rollback behavior.
- Secrets belong in a vault provider, never in Telegram chat or repository files.

## License and brand

Madevi Core uses Apache-2.0. The Madevi name and logo are not granted by that code license; publish a trademark policy before authorizing branded forks or commercial distributions.
