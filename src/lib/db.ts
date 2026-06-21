import "server-only";
import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "database", "data.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Read-only: do not set journal_mode/WAL here (those pragmas require writes).
    db = new Database(DB_PATH, { readonly: true });
  }
  return db;
}
