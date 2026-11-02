import assert from "node:assert/strict";
import test from "node:test";
import { actionManifest, assertUniqueActions, defineAction } from "../src/action-contract.mjs";

test("action contracts validate and project a surface manifest", () => {
  const action = defineAction({
    id: "workspace.inspect",
    title: "Inspect workspace",
    area: "workspace",
    risk: "informational",
    scopes: ["workspace:read"],
    approval: "none",
    executor: "workspace",
    verification: "return findings",
    surfaces: ["cli", "visual"]
  });
  assert.equal(assertUniqueActions([action]), true);
  assert.deepEqual(actionManifest([action], "visual").map((item) => item.id), ["workspace.inspect"]);
  assert.deepEqual(actionManifest([action], "telegram"), []);
});
