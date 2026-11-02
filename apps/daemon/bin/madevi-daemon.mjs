#!/usr/bin/env node
import { startControlServer } from "../../../packages/core/src/daemon.mjs";

const port = Number.parseInt(process.env.MADEVI_PORT || "8787", 10);
const service = await startControlServer({ port: Number.isInteger(port) ? port : 8787 });
console.log(JSON.stringify({ started: true, ...service.state }));

async function stop(signal) {
  await service.close();
  process.exit(signal === "SIGINT" ? 130 : 0);
}

process.once("SIGINT", () => { stop("SIGINT").catch(() => process.exit(1)); });
process.once("SIGTERM", () => { stop("SIGTERM").catch(() => process.exit(1)); });
