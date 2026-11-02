import { createServer } from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { actionManifest } from "../../contracts/src/action-contract.mjs";
import { ACTIONS } from "./actions.mjs";
import { madeviHome, readConfig } from "./config.mjs";
import { readState } from "./state.mjs";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;

export function daemonStateFile(home) {
  return join(madeviHome(home), "daemon.json");
}

export function daemonUrl({ host = DEFAULT_HOST, port = DEFAULT_PORT } = {}) {
  return "http://" + host + ":" + port;
}

export async function readDaemonState(home) {
  try {
    return JSON.parse(await readFile(daemonStateFile(home), "utf8"));
  } catch {
    return null;
  }
}

export async function removeDaemonState(home) {
  await rm(daemonStateFile(home), { force: true });
}

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function writeDaemonState(state, home) {
  const folder = madeviHome(home);
  await mkdir(folder, { recursive: true });
  await writeFile(daemonStateFile(home), JSON.stringify(state, null, 2) + "\n", "utf8");
}

export async function controlStatus(home) {
  const [{ config }, { state }] = await Promise.all([readConfig(home), readState(home)]);
  return {
    agent: config.agent.name,
    version: config.agent.version || null,
    mode: config.monitor.enabled ? "workspace + monitor-control" : "workspace",
    monitorEnabled: config.monitor.enabled,
    activeProject: config.workspace.activeProject,
    activeModel: config.model.active,
    activeSessions: state.sessions.filter((session) => session.status === "active").length,
    openIncidents: state.incidents.filter((incident) => incident.status === "open").length
  };
}

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

const visualIndex = fileURLToPath(new URL("../../../apps/visual/index.html", import.meta.url));

/** Starts a loopback-only control server. No mutation endpoint is exposed at this stage. */
export async function startControlServer({ host = DEFAULT_HOST, port = DEFAULT_PORT, home, persist = true } = {}) {
  if (host !== "127.0.0.1" && host !== "::1" && host !== "localhost") {
    throw new Error("Madevi control server is loopback-only. Put a verified reverse proxy in front of a VPS deployment.");
  }
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", daemonUrl({ host, port }));
    if (request.method !== "GET") return json(response, 405, { error: "method_not_allowed" });
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const html = await readFile(visualIndex, "utf8");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return response.end(html);
    }
    if (url.pathname === "/health") return json(response, 200, { ok: true, service: "madevi-agent" });
    if (url.pathname === "/v1/status") return json(response, 200, await controlStatus(home));
    if (url.pathname === "/v1/actions") {
      const surface = url.searchParams.get("surface") || "visual";
      try {
        return json(response, 200, { surface, actions: actionManifest(ACTIONS, surface) });
      } catch (error) {
        return json(response, 400, { error: error.message });
      }
    }
    return json(response, 404, { error: "not_found" });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  const state = { pid: process.pid, host, port: actualPort, startedAt: new Date().toISOString(), url: daemonUrl({ host, port: actualPort }) };
  if (persist) await writeDaemonState(state, home);
  const close = async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (persist) await removeDaemonState(home);
  };
  return { server, state, close };
}
