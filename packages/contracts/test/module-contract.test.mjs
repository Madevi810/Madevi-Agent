import assert from "node:assert/strict";
import test from "node:test";
import { assertUniqueModules, defineModule } from "../src/module-contract.mjs";

test("module contract rejects unknown kinds and duplicate module ids", () => {
  assert.throws(() => defineModule({ id: "bad", title: "Bad", kind: "unknown", stability: "foundation" }), /known kind/);
  const one = defineModule({ id: "workspace", title: "Workspace", kind: "runtime", stability: "foundation" });
  assert.equal(assertUniqueModules([one]), true);
  assert.throws(() => assertUniqueModules([one, one]), /Duplicate module id/);
});
