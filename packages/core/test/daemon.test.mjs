import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { startControlServer } from "../src/daemon.mjs";

test("loopback daemon exposes health, status, and visual action manifest", async () => {
  const home = await mkdtemp(join(tmpdir(), "madevi-daemon-"));
  const service = await startControlServer({ home, port: 0, persist: false });
  try {
    const health = await fetch(service.state.url + "/health").then((response) => response.json());
    const actions = await fetch(service.state.url + "/v1/actions?surface=visual").then((response) => response.json());
    const visual = await fetch(service.state.url + "/").then((response) => response.text());
    assert.equal(health.ok, true);
    assert.ok(actions.actions.some((action) => action.id === "workspace.inspect"));
    assert.match(visual, /Madevi Agent/);
  } finally {
    await service.close();
    await rm(home, { recursive: true, force: true });
  }
});
