#!/usr/bin/env node
/**
 * Creates SQLite indexes on news and bio tables.
 * Run after (re)building the database: node create_indexes.js
 * Also invoked automatically at the end of create_db.js.
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_DB = path.join(__dirname, 'database', 'data.db');

/** Backup tables — not queried by the app; skip indexing. */
const EXCLUDED_NEWS_TABLES = new Set(['news_articles', 'news_articles_online']);

/** Index specs applied to every table whose name starts with news_ */
const NEWS_INDEX_SPECS = [
  { suffix: 'newsId', columns: ['newsId'] },
  { suffix: 'createdAt', columns: ['CreatedAt'] },
  { suffix: 'language', columns: ['Language'] },
  { suffix: 'sentiment', columns: ['Sentiment'] },
  { suffix: 'lang_sentiment_created', columns: ['Language', 'Sentiment', 'CreatedAt'] },
];

/** Person-name JSON columns used for MLA/MP entity lookups. */
const ENTITY_COLUMNS = ['MLA', 'Loksabha_MP', 'Rajyasabha_MP'];

const BIO_INDEX_SPECS = [
  { table: 'uttar_pradesh_MLA_members_bio', column: 'mpsno' },
  { table: 'uttar_pradesh_lok_sabha_members_bio', column: 'mpsno' },
  { table: 'uttar_pradesh_rajya_sabha_members_bio', column: 'mpsno' },
];

function tableColumns(db, table) {
  return new Set(
    db.prepare(`PRAGMA table_info("${table}")`).all().map((row) => row.name),
  );
}

function tableExists(db, table) {
  return !!db
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ analyze?: boolean }} [options]
 */
function createIndexes(db, options = {}) {
  const { analyze = true } = options;
  let created = 0;

  for (const table of EXCLUDED_NEWS_TABLES) {
    db.prepare(`DROP table if exists ${table}`).run();
  }
  
  const newsTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'news_%'")
    .all()
    .map((row) => row.name)
    .filter((name) => !EXCLUDED_NEWS_TABLES.has(name));

  for (const table of newsTables) {
    const cols = tableColumns(db, table);
    for (const spec of NEWS_INDEX_SPECS) {
      if (!spec.columns.every((c) => cols.has(c))) continue;
      const indexName = `idx_${table}_${spec.suffix}`;
      const columnSql = spec.columns.map((c) => `"${c}"`).join(', ');
      db.prepare(
        `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" (${columnSql})`,
      ).run();
      created += 1;
      console.log(`Index ready: ${indexName} (${table})`);
    }

    for (const column of ENTITY_COLUMNS) {
      if (!cols.has(column)) continue;
      const indexName = `idx_${table}_${column}`;
      db.prepare(
        `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" ("${column}")`,
      ).run();
      created += 1;
      console.log(`Index ready: ${indexName} (${table})`);
    }
  }

  for (const spec of BIO_INDEX_SPECS) {
    if (!tableExists(db, spec.table)) continue;
    const cols = tableColumns(db, spec.table);
    if (!cols.has(spec.column)) continue;
    const indexName = `idx_${spec.table}_${spec.column}`;
    db.prepare(
      `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${spec.table}" ("${spec.column}")`,
    ).run();
    created += 1;
    console.log(`Index ready: ${indexName}`);
  }

  if (analyze) {
    db.exec('ANALYZE');
    console.log('ANALYZE complete — query planner statistics updated');
  }

  return created;
}

function main() {
  const dbPath = process.argv[2] || DEFAULT_DB;
  if (!fs.existsSync(dbPath)) {
    console.error('Database not found:', dbPath);
    process.exit(1);
  }

  const db = new Database(dbPath);
  try {
    const count = createIndexes(db);
    console.log(`Done. ${count} index(es) ensured on ${dbPath}`);
  } finally {
    db.close();
  }
}

module.exports = { createIndexes };

if (require.main === module) {
  main();
}
