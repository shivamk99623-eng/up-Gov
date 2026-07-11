/**
 * Worker entry (loaded via jiti from workers/sqlite-worker.cjs).
 * Runs better-sqlite3 off the Next.js main thread so HTTP stays responsive.
 */
import { parentPort } from "node:worker_threads";
import { getDb } from "@/lib/db";
import { dispatchDbOp } from "./handlers";
import type { DbWorkerRequest, DbWorkerResponse } from "./types";

if (!parentPort) {
  throw new Error("db-worker handlers must run inside a worker_thread");
}

// Open DB + signal ready so the first HTTP request does not pay jiti+open cost alone.
getDb();
parentPort.postMessage({ id: -2, ok: true, result: "ready" });

parentPort.on("message", (msg: DbWorkerRequest) => {
  let response: DbWorkerResponse;
  try {
    const result = dispatchDbOp(msg.payload);
    response = { id: msg.id, ok: true, result };
  } catch (err) {
    response = {
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  parentPort!.postMessage(response);
});
