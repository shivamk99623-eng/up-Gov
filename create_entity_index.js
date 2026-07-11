#!/usr/bin/env node
/**
 * Builds news_entity_token — a normalized person-name token index for fast
 * MLA/MP detail lookups. Leading-wildcard LIKE on JSON name columns cannot use
 * B-tree indexes; exact token equality on this table can.
 *
 * Run: node create_entity_index.js
 * Also invoked from create_indexes.js after regular indexes.
 */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DEFAULT_DB = path.join(__dirname, "database", "data.db");

const NEWS_KIND_TABLES = [
  { kind: "Print", table: "news_print" },
  { kind: "YouTube", table: "news_youtube" },
  { kind: "X", table: "news_x" },
  { kind: "Online", table: "news_online" },
];

const ENTITY_ROLES = ["MLA", "Loksabha_MP", "Rajyasabha_MP"];

const HONORIFIC_RE =
  /^(?:(?:shri|shrimati|smt|smt\.|dr|dr\.|prof|prof\.|adv|adv\.|mr|mr\.|mrs|mrs\.|ms|ms\.|miss|hon(?:'ble)?|late|pt|pandit|ku|kumari|ml|ml\.)\s*)+/i;

function stripHonorifics(name) {
  let s = String(name).trim().replace(/\u00a0/g, " ");
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(HONORIFIC_RE, "").trim();
  }
  return s;
}

function normalizePersonName(name) {
  return stripHonorifics(name)
    .toLowerCase()
    .replace(/[\[\]]/g, "")
    .replace(/,/g, " ")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeName(name) {
  const normalized = normalizePersonName(name);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter((t) => t.length >= 3);
}

function parsePersonNames(value) {
  if (value == null || value === "") return [];
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed || trimmed === "[]") return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
        .filter(Boolean);
    }
  } catch {
    /* fall through */
  }
  const quoted = [...trimmed.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim()).filter(Boolean);
  if (quoted.length) return quoted;
  return [trimmed];
}

function tableExists(db, table) {
  return !!db
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);
}

function tableColumns(db, table) {
  return new Set(
    db.prepare(`PRAGMA table_info("${table}")`).all().map((row) => row.name),
  );
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ force?: boolean }} [options]
 */
function createEntityTokenIndex(db, options = {}) {
  const { force = false } = options;

  if (!force && tableExists(db, "news_entity_token")) {
    const count = db.prepare("SELECT COUNT(*) AS c FROM news_entity_token").get().c;
    if (count > 0) {
      console.log(`Entity token index already present (${count.toLocaleString()} rows) — skip rebuild (pass --force to rebuild)`);
      return count;
    }
  }

  console.log("Building news_entity_token index…");
  const t0 = Date.now();

  db.exec(`
    DROP TABLE IF EXISTS news_entity_token;
    CREATE TABLE news_entity_token (
      kind TEXT NOT NULL,
      row_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      token TEXT NOT NULL
    );
  `);

  const insert = db.prepare(
    `INSERT INTO news_entity_token (kind, row_id, role, token) VALUES (?, ?, ?, ?)`,
  );

  let inserted = 0;

  const build = db.transaction(() => {
    for (const { kind, table } of NEWS_KIND_TABLES) {
      if (!tableExists(db, table)) continue;
      const cols = tableColumns(db, table);
      const roles = ENTITY_ROLES.filter((r) => cols.has(r));
      if (!roles.length || !cols.has("id")) continue;

      const selectCols = ["id", ...roles.map((r) => `"${r}"`)].join(", ");
      const rows = db.prepare(`SELECT ${selectCols} FROM "${table}"`).all();
      console.log(`  ${kind}: scanning ${rows.length.toLocaleString()} rows…`);

      for (const row of rows) {
        for (const role of roles) {
          const names = parsePersonNames(row[role]);
          if (!names.length) continue;
          const tokens = new Set();
          for (const name of names) {
            for (const token of tokenizeName(name)) tokens.add(token);
          }
          for (const token of tokens) {
            insert.run(kind, row.id, role, token);
            inserted += 1;
          }
        }
      }
    }
  });

  build();

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_entity_token_lookup
      ON news_entity_token (token, kind, role, row_id);
    CREATE INDEX IF NOT EXISTS idx_news_entity_token_row
      ON news_entity_token (kind, row_id);
  `);

  db.exec("ANALYZE news_entity_token");

  console.log(
    `Entity token index ready: ${inserted.toLocaleString()} rows in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
  return inserted;
}

function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const dbPath = args.find((a) => !a.startsWith("--")) || DEFAULT_DB;

  if (!fs.existsSync(dbPath)) {
    console.error("Database not found:", dbPath);
    process.exit(1);
  }

  const db = new Database(dbPath);
  try {
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("temp_store = MEMORY");
    createEntityTokenIndex(db, { force });
  } finally {
    db.close();
  }
}

module.exports = { createEntityTokenIndex };

if (require.main === module) {
  main();
}
