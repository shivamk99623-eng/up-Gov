import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(
  process.env.UP_PROJECT_ROOT || process.cwd(),
  "database",
  "data.db",
);

let db: Database.Database | null = null;

function applyReadPragmas(database: Database.Database) {
  database.pragma("busy_timeout = 10000");
  database.pragma("cache_size = -64000");
  database.pragma("mmap_size = 268435456");
  database.pragma("temp_store = MEMORY");
}

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(
        `SQLite database not found at ${DB_PATH}. Mount ./database (see docker-compose.yml) or set UP_PROJECT_ROOT.`,
      );
    }

    // Prefer a normal open so WAL can create -shm on the bind mount. If the
    // mount/permissions are read-only, fall back to readonly.
    try {
      db = new Database(DB_PATH, { fileMustExist: true });
      applyReadPragmas(db);
      // Must be LAST — query_only blocks later PRAGMA changes.
      db.pragma("query_only = ON");
    } catch {
      db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
      applyReadPragmas(db);
    }
  }
  return db;
}
