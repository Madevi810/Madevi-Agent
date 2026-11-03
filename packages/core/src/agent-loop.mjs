import { lstat, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { completeWithProfile } from "./provider.mjs";

const LIMIT = 128 * 1024;
const schema = (name, description, properties, required) => ({ type: "function", function: { name, description, parameters: { type: "object", properties, required, additionalProperties: false } } });
export const TOOLS = [
  schema("list_files", "List a workspace directory", { path: { type: "string" } }, ["path"]),
  schema("read_file", "Read a UTF-8 workspace file", { path: { type: "string" } }, ["path"]),
  schema("write_file", "Replace or create a UTF-8 file after explicit user approval", { path: { type: "string" }, content: { type: "string" } }, ["path", "content"])
];

async function checkedPath(root, path, create = false) {
  if (typeof path !== "string" || !path || isAbsolute(path)) throw new Error("Path must be relative to the workspace.");
  const target = resolve(root, path);
  const rel = relative(root, target);
  if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) throw new Error("Path is outside the workspace.");
  // Resolve every existing component: never follow a symlink out of the workspace.
  let current = root;
  for (const part of rel.split(sep).filter(Boolean)) {
    current = resolve(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new Error("Symlinks are not supported by workspace tools.");
    } catch (error) {
      if (error.code === "ENOENT" && create && current === target) break;
      throw error;
    }
  }
  return target;
}

export async function executeWorkspaceTool(name, args, { root, mode, approve = async () => false }) {
  if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Invalid tool arguments.");
  const workspace = await realpath(root);
  if (name === "list_files") {
    const path = await checkedPath(workspace, args.path);
    return (await readdir(path, { withFileTypes: true })).slice(0, 500).map(e => ({ name: e.name, type: e.isDirectory() ? "directory" : e.isSymbolicLink() ? "symlink" : "file" }));
  }
  if (name === "read_file") {
    const path = await checkedPath(workspace, args.path);
    const info = await lstat(path);
    if (!info.isFile() || info.size > LIMIT) throw new Error("File must be a regular file no larger than 128 KiB.");
    return await readFile(path, "utf8");
  }
  if (name === "write_file") {
    if (mode !== "build") throw new Error("Writes require build mode.");
    if (typeof args.content !== "string" || Buffer.byteLength(args.content) > LIMIT) throw new Error("Content must be UTF-8 text no larger than 128 KiB.");
    const path = await checkedPath(workspace, args.path, true);
    if (!(await approve({ name, path: args.path, bytes: Buffer.byteLength(args.content), content: args.content }))) throw new Error("Write denied by user.");
    await checkedPath(workspace, args.path, true);
    await realpath(dirname(path));
    await writeFile(path, args.content, { encoding: "utf8", flag: "w" });
    return { written: args.path, bytes: Buffer.byteLength(args.content) };
  }
  throw new Error("Unknown tool: " + name);
}

export async function runAgentTurn({ profile, messages, root, mode, approve, request = completeWithProfile, onEvent = () => {}, maxSteps = 12 }) {
  const transcript = [...messages];
  for (let step = 0; step < maxSteps; step++) {
    const response = await request(profile, transcript, { tools: TOOLS, structured: true });
    const calls = response.tool_calls || [];
    if (!Array.isArray(calls)) throw new Error("Invalid provider tool_calls.");
    if (!calls.length) {
      if (typeof response.content !== "string" || !response.content.trim()) throw new Error("Provider returned no final text.");
      return { text: response.content, steps: step + 1 };
    }
    if (calls.length > 8) throw new Error("Provider requested too many tools in one step.");
    transcript.push({ role: "assistant", content: response.content || null, tool_calls: calls });
    for (const call of calls) {
      if (!call.id || call.type !== "function" || !call.function?.name) throw new Error("Invalid provider tool call.");
      let result;
      try {
        const args = JSON.parse(call.function.arguments || "{}");
        onEvent({ type: "tool.start", name: call.function.name });
        result = { ok: true, result: await executeWorkspaceTool(call.function.name, args, { root, mode, approve }) };
      } catch (error) { result = { ok: false, error: error.message }; }
      onEvent({ type: "tool.finish", name: call.function.name, ok: result.ok });
      transcript.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  throw new Error("Agent stopped after reaching the maximum number of model steps.");
}
