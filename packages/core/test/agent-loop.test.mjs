import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { executeWorkspaceTool, runAgentTurn } from "../src/agent-loop.mjs";

test("agent loops through a real read and approved write before responding", async () => {
  const root = await mkdtemp(join(tmpdir(), "madevi-loop-"));
  try {
    await writeFile(join(root, "hello.txt"), "before");
    let step = 0;
    const request = async (_profile, messages) => {
      step++;
      if (step === 1) return { role: "assistant", tool_calls: [{ id: "1", type: "function", function: { name: "read_file", arguments: '{"path":"hello.txt"}' } }] };
      if (step === 2) {
        assert.match(messages.at(-1).content, /before/);
        return { role: "assistant", tool_calls: [{ id: "2", type: "function", function: { name: "write_file", arguments: '{"path":"hello.txt","content":"after"}' } }] };
      }
      assert.match(messages.at(-1).content, /written/);
      return { role: "assistant", content: "done" };
    };
    const result = await runAgentTurn({ messages: [], root, mode: "build", request, approve: async () => true });
    assert.equal(result.text, "done");
    assert.equal(await readFile(join(root, "hello.txt"), "utf8"), "after");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("workspace tools reject escapes, symlinks, unapproved and plan writes", async () => {
  const root = await mkdtemp(join(tmpdir(), "madevi-boundary-"));
  try {
    await symlink(tmpdir(), join(root, "outside"));
    await assert.rejects(executeWorkspaceTool("read_file", { path: "../secret" }, { root, mode: "ask" }), /outside/);
    await assert.rejects(executeWorkspaceTool("list_files", { path: "outside" }, { root, mode: "ask" }), /Symlinks/);
    await assert.rejects(executeWorkspaceTool("write_file", { path: "new", content: "x" }, { root, mode: "plan", approve: async () => true }), /build mode/);
    await assert.rejects(executeWorkspaceTool("write_file", { path: "new", content: "x" }, { root, mode: "build" }), /denied/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("agent bounds repeated model tool calls", async () => {
  const root = await mkdtemp(join(tmpdir(), "madevi-limit-"));
  try {
    const request = async () => ({ tool_calls: [{ id: "1", type: "function", function: { name: "list_files", arguments: '{"path":"."}' } }] });
    await assert.rejects(runAgentTurn({ messages: [], root, mode: "ask", request, maxSteps: 2 }), /maximum number/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
