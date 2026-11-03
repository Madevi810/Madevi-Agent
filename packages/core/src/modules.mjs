import { assertUniqueModules, defineModule } from "../../contracts/src/module-contract.mjs";

export const FIRST_PARTY_MODULES = Object.freeze([
  defineModule({ id: "workspace", title: "Workspace Agent", kind: "runtime", stability: "foundation", actions: ["workspace.inspect", "workspace.edit"], surfaces: ["cli", "visual"] }),
  defineModule({ id: "deploy", title: "Deploy", kind: "runtime", stability: "planned", actions: ["deploy.plan", "deploy.release"], surfaces: ["cli", "visual", "telegram"] }),
  defineModule({ id: "monitor", title: "Monitor Control", kind: "runtime", stability: "experimental", actions: ["monitor.block", "monitor.contain"], surfaces: ["cli", "visual", "telegram"] }),
  defineModule({ id: "assist", title: "Madevi Assist", kind: "interface", stability: "planned", actions: [], surfaces: ["assist"] }),
  defineModule({ id: "telegram", title: "Telegram Gateway", kind: "interface", stability: "planned", actions: [], surfaces: ["telegram"] })
]);

assertUniqueModules(FIRST_PARTY_MODULES);

export function moduleManifest() {
  return FIRST_PARTY_MODULES.map(({ id, title, kind, stability, actions, surfaces }) => ({ id, title, kind, stability, actions, surfaces }));
}
