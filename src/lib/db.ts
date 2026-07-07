import "server-only";
import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "database", "data.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Read-only: do not set journal_mode/WAL here (those pragmas require writes).
    db = new Database(DB_PATH, { readonly: true });
    db.pragma("busy_timeout = 10000");
    db.pragma("cache_size = -64000");
    db.pragma("mmap_size = 268435456");
    db.pragma("temp_store = MEMORY");
  }
  return db;
}
