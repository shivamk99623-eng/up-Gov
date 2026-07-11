/**
 * CommonJS bootstrap for the SQLite worker.
 * Uses jiti so TypeScript + `@/` path aliases resolve outside the Next bundler.
 */
const fs = require("node:fs");
const path = require("node:path");
const { parentPort, workerData } = require("node:worker_threads");

function fail(err) {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  console.error("[sqlite-worker]", message);
  if (parentPort) {
    try {
      parentPort.postMessage({ id: -1, ok: false, error: message });
    } catch {
      /* ignore */
    }
  }
  process.exit(1);
}

try {
  if (!parentPort) {
    throw new Error("sqlite-worker must run in a worker_thread");
  }

  function resolveRoot() {
    const candidates = [
      workerData && workerData.projectRoot,
      process.env.UP_PROJECT_ROOT,
      path.join(__dirname, ".."),
      process.cwd(),
    ].filter(Boolean);

    for (const candidate of candidates) {
      let dir = candidate;
      try {
        dir = fs.realpathSync(candidate);
      } catch {
        /* keep candidate */
      }
      const entry = path.join(dir, "src/lib/db-worker/entry.ts");
      const db = path.join(dir, "database/data.db");
      if (fs.existsSync(entry) && fs.existsSync(db)) return dir;
    }

    throw new Error(
      `Cannot resolve project root (need src/lib/db-worker/entry.ts + database/data.db). Tried: ${candidates.join(", ")}`,
    );
  }

  const root = resolveRoot();
  process.env.UP_PROJECT_ROOT = root;

  const shim = path.join(__dirname, "server-only-shim.cjs");
  if (!fs.existsSync(shim)) {
    throw new Error(`Missing server-only shim at ${shim}`);
  }

  const jiti = require("jiti")(__filename, {
    alias: {
      "@": path.join(root, "src"),
      "server-only": shim,
    },
    interopDefault: true,
    cache: false,
  });

  jiti(path.join(root, "src/lib/db-worker/entry.ts"));
} catch (err) {
  fail(err);
}
