import "server-only";
import { Worker } from "node:worker_threads";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { DbWorkerOp, DbWorkerRequest, DbWorkerResponse } from "./types";

type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
};

type PooledWorker = {
  worker: Worker;
  busy: boolean;
};

const POOL_SIZE = Math.min(2, Math.max(1, os.cpus().length - 1));

let nextId = 1;
const pending = new Map<number, Pending>();
const pool: PooledWorker[] = [];
const waitQueue: Array<() => void> = [];
let started = false;
let cachedRoot: string | null = null;

/**
 * Project root for DB + TypeScript sources.
 * Prefer realpath so workers can read files even when cwd is Turbopack's `/ROOT`.
 */
export function resolveProjectRoot(): string {
  if (cachedRoot) return cachedRoot;

  const anchors = [
    "database/data.db",
    "workers/sqlite-worker.cjs",
    "src/lib/db-worker/entry.ts",
  ];
  const starts = [
    process.env.UP_PROJECT_ROOT,
    process.env.PWD,
    process.env.INIT_CWD,
    process.cwd(),
  ].filter(Boolean) as string[];

  for (const start of starts) {
    let dir = path.resolve(start);
    for (let i = 0; i < 12; i++) {
      if (anchors.every((a) => fs.existsSync(path.join(dir, a)))) {
        try {
          cachedRoot = fs.realpathSync(dir);
        } catch {
          cachedRoot = dir;
        }
        return cachedRoot;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  cachedRoot = process.cwd();
  return cachedRoot;
}

/**
 * Eval bootstrap avoids Next/Turbopack refusing to spawn a Worker from a
 * filesystem path. The eval script then requires the real worker file.
 */
function workerEvalSource(projectRoot: string): string {
  const workerFile = JSON.stringify(
    path.join(projectRoot, "workers/sqlite-worker.cjs"),
  );
  const root = JSON.stringify(projectRoot);
  return `
    const { workerData } = require('node:worker_threads');
    process.env.UP_PROJECT_ROOT = ${root};
    require(${workerFile});
  `;
}

function createWorker(): PooledWorker {
  const projectRoot = resolveProjectRoot();
  const worker = new Worker(workerEvalSource(projectRoot), {
    eval: true,
    workerData: { projectRoot },
    env: {
      ...process.env,
      UP_PROJECT_ROOT: projectRoot,
    },
  });
  const slot: PooledWorker = { worker, busy: false };

  worker.on("message", (msg: DbWorkerResponse) => {
    // Bootstrap / crash diagnostics from worker (id: -1)
    if (msg.id < 0 && !msg.ok) {
      console.error("[db-worker]", msg.error);
      failAllForWorker(new Error(msg.error));
      return;
    }
    slot.busy = false;
    pumpQueue();
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.ok) p.resolve(msg.result);
    else p.reject(new Error(msg.error));
  });

  worker.on("error", (err) => {
    console.error("[db-worker] worker error:", err);
    failAllForWorker(err);
  });

  worker.on("exit", (code) => {
    const idx = pool.indexOf(slot);
    if (idx >= 0) pool.splice(idx, 1);
    if (code !== 0) {
      failAllForWorker(new Error(`SQLite worker exited with code ${code}`));
    }
    // Avoid tight crash loops — delay respawn slightly
    if (started) {
      setTimeout(() => {
        if (pool.length < POOL_SIZE) pool.push(createWorker());
      }, 500);
    }
  });

  return slot;
}

function failAllForWorker(err: Error) {
  for (const [id, p] of pending) {
    pending.delete(id);
    p.reject(err);
  }
  for (const slot of pool) slot.busy = false;
  pumpQueue();
}

function ensurePool() {
  if (started) return;
  started = true;
  // Start with one worker; scale to POOL_SIZE on demand so first request
  // does not pay for two jiti bootstraps.
  pool.push(createWorker());
}

function pumpQueue() {
  while (waitQueue.length) {
    const free = pool.find((s) => !s.busy);
    if (!free) return;
    const next = waitQueue.shift();
    next?.();
  }
}

function acquire(): Promise<PooledWorker> {
  ensurePool();
  const free = pool.find((s) => !s.busy);
  if (free) {
    free.busy = true;
    return Promise.resolve(free);
  }
  if (pool.length < POOL_SIZE) {
    const slot = createWorker();
    pool.push(slot);
    slot.busy = true;
    return Promise.resolve(slot);
  }
  return new Promise((resolve) => {
    waitQueue.push(() => {
      const slot = pool.find((s) => !s.busy);
      if (!slot) {
        waitQueue.push(() => {
          const again = pool.find((s) => !s.busy)!;
          again.busy = true;
          resolve(again);
        });
        return;
      }
      slot.busy = true;
      resolve(slot);
    });
  });
}

/** Run a named DB operation on a worker thread (non-blocking for the Next.js event loop). */
export async function runDbOp<T>(payload: DbWorkerOp): Promise<T> {
  const slot = await acquire();
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
    });
    const request: DbWorkerRequest = { id, payload };
    try {
      slot.worker.postMessage(request);
    } catch (err) {
      pending.delete(id);
      slot.busy = false;
      pumpQueue();
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
