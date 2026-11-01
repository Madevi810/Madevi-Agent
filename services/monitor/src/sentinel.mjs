import os from "node:os";

export function createSystemSnapshot() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  return {
    capturedAt: new Date().toISOString(),
    host: os.hostname(),
    platform: os.platform() + " " + os.release(),
    uptimeSeconds: Math.round(os.uptime()),
    loadAverage: os.loadavg().map((value) => Number(value.toFixed(2))),
    cpuCount: os.cpus().length,
    memory: { totalBytes: totalMemory, usedBytes: usedMemory, usedPercent: Number(((usedMemory / totalMemory) * 100).toFixed(1)) }
  };
}

export function monitorStatus(config) {
  return { enabled: config.monitor.enabled, auditIntervalHours: config.monitor.auditIntervalHours, snapshot: createSystemSnapshot() };
}
