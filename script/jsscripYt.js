const { Client } = require("pg");
const QueryStream = require("pg-query-stream");
const sqlite3 = require("sqlite3").verbose();
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

const LOG_FILE_PATH = path.join(__dirname, "scriptYt.log");

let logChain = Promise.resolve();

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function writeLog(level, ...args) {
  const message = args
    .map((arg) =>
      arg instanceof Error
        ? arg.stack || arg.message
        : typeof arg === "object"
          ? JSON.stringify(arg)
          : String(arg)
    )
    .join(" ");
  const line = `[${new Date().toISOString()}] [${level}] ${message}\n`;

  logChain = logChain
    .then(() => fs.promises.appendFile(LOG_FILE_PATH, line, "utf8"))
    .catch(() => { });
}

function log(...args) {
  writeLog("INFO", ...args);
}

function logError(...args) {
  writeLog("ERROR", ...args);
}

function flushLogs() {
  return logChain;
}

// =============================
// CONFIG
// =============================
const PG_CONFIG = {
  host: "localhost",
  port: 5432,
  user: "jeet.vyas",
  password: "19384fjdsjaAJSDHSBH",
  database: "nmw-prod",
  ssl: {
    rejectUnauthorized: false
  }
};

const SQLITE_DB_PATH = "./data.db";
const EXCEL_FILE_PATH = "./UP_Legislative Assembly.xlsx";



async function ensureColumnExists(db, tableName, columnName) {
  try {
    const columns = await new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${tableName})`, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const exists = columns.some(col => col.name === columnName);

    if (!exists) {
      log(`Column '${columnName}' not found. Creating...`);

      await run(
        db,
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} TEXT`
      );

      log(`✓ Column '${columnName}' created`);
    } else {
      log(`✓ Column '${columnName}' already exists`);
    }
  } catch (err) {
    logError(`Error checking column ${columnName}:`, err);
    throw err;
  }
}

// =============================
// PostgreSQL Query
// =============================

const NEWS_QUERY = `
SELECT
    N."youtubeId" as "newsId",
    N."title_english" AS "Heading",
    N."sentiment",
    N."english_summary" AS summary,
    N."youtube_url" AS "Link",
    N."createdAt",
    N."language",
    N."transcription" AS "Content",
    N."channel_name" AS "Channel",
    N."duration",
    N."postedTime" AS "PostedTime",
    N."comment_count" AS "Comment_count",
    N."like_count" AS "Like_count",
    N."ministries_scoring" AS "ministriesScoring"
FROM "YouTubeData" N
WHERE
    N."isDeleted" = false
    AND N."createdAt" BETWEEN '2026-05-31 18:30:00'
                          AND '2026-06-22 18:29:59'
    AND EXISTS (
        SELECT 1
        FROM unnest(N."ministries_scoring") AS elem_text
        WHERE (elem_text::jsonb ->> 'is_approved')::boolean = true
    );
`;

// =============================
// SQLite Helpers
// =============================
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// =============================
// Load Assembly Excel
// =============================
function loadAssemblyData(filePath) {
  log(`Loading Excel file: ${filePath}`);

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];

  log(`Sheet found: ${sheetName}`);

  const rows = xlsx.utils.sheet_to_json(
    workbook.Sheets[sheetName]
  );

  log(`Loaded ${rows.length} assembly records`);
  return rows.map((row) => ({
    district: String(row.Distrit || "").trim(),
    assembly: String(row.Assembly || "").trim(),
  }));
}

// =============================
// Find Matches
// =============================
function findAssemblyMatches(news, assemblyData) {

  const searchText = [
    news.heading || "",
    news.summary || "",
    news.content || ""
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ");

  const matchedAssemblies = new Set();
  const matchedDistricts = new Set();

  for (const item of assemblyData) {

    const regex = new RegExp(
      `\\b${escapeRegex(item.assembly.toLowerCase())}\\b`,
      "i"
    );

    if (regex.test(searchText)) {
      matchedAssemblies.add(item.assembly);
      matchedDistricts.add(item.district);
    }
  }

  return {
    districts: [...matchedDistricts],
    assemblies: [...matchedAssemblies]
  };
}

// =============================
// Merge Arrays
// =============================
function mergeUniqueArrays(existing = [], incoming = []) {
  return [...new Set([...(existing || []), ...(incoming || [])])];
}

function formatCreatedAt(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.toISOString();
  return String(value);
}

// =============================
// Insert News
// =============================
async function insertNews(db, news, districts, assemblies) {

  const sql = `
  INSERT INTO news_youtube (
    newsId,
    Heading,
    Summary,
    Link,
    CreatedAt,
    Content,
    Language,
    Sentiment,
    Channel,
    Duration,
    PostedTime,
    Comment_count,
    Like_count,
    District,
    ls_constituency
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

await run(db, sql, [
  news.newsId,
  news.Heading,          // title_english
  news.summary,          // english_summary
  news.Link,             // youtube_url
  formatCreatedAt(news.createdAt),
  news.Content,          // transcription
  news.language,
  news.sentiment,
  news.Channel,          // channel_name
  news.duration,
  formatCreatedAt(news.PostedTime),
  news.Comment_count,
  news.Like_count,
  JSON.stringify(districts),
  JSON.stringify(assemblies)
]);

  log(`Inserted newsId: ${news.newsId}`);
}

// =============================
// Update News
// =============================
async function updateNews(db, newsId, newDistricts, newAssemblies) {
  const existing = await get(
    db,
    `
    SELECT District, ls_constituency
    FROM news_youtube
    WHERE newsId = ?
    `,
    [newsId]
  );

  let existingDistricts = [];
  let existingAssemblies = [];

  try {
    existingDistricts = existing?.District
      ? JSON.parse(existing.District)
      : [];
  } catch { }

  try {
    existingAssemblies = existing?.ls_constituency
      ? JSON.parse(existing.ls_constituency)
      : [];
  } catch { }

  const mergedDistricts = mergeUniqueArrays(
    existingDistricts,
    newDistricts
  );

  const mergedAssemblies = mergeUniqueArrays(
    existingAssemblies,
    newAssemblies
  );

  await run(
    db,
    `
    UPDATE news_youtube
    SET
      District = ?,
      ls_constituency = ?
    WHERE newsId = ?
    `,
    [
      JSON.stringify(mergedDistricts),
      JSON.stringify(mergedAssemblies),
      newsId,
    ]
  );

  log(`Updated newsId: ${newsId}`);
}

// =============================
// Stream & Process News Rows
// =============================
async function processNewsStream(pgClient, sqliteDb, assemblyData) {
  const query = new QueryStream(NEWS_QUERY);
  const stream = pgClient.query(query);

  let rowCount = 0;

  for await (const news of stream) {
    rowCount++;

    const { districts, assemblies } = findAssemblyMatches(
      news,
      assemblyData
    );

    if (assemblies.length === 0) {
      log(`Skipped newsId: ${news.newsId} (No assembly match)`);
      continue;
    }

    log(
      `newsId=${news.newsId} | districts=${JSON.stringify(districts)} | assemblies=${JSON.stringify(assemblies)}`
    );

    const existingRow = await get(
      sqliteDb,
      `SELECT newsId FROM news_youtube WHERE newsId = ?`,
      [news.newsId]
    );
    log(`existingRow=${existingRow}`);
    if (existingRow) {
      await updateNews(
        sqliteDb,
        news.newsId,
        districts,
        assemblies
      );
    } else {
      await insertNews(
        sqliteDb,
        news,
        districts,
        assemblies
      );
    }
  }

  log(`Fetched ${rowCount} news records`);
}

// =============================
// Main Sync
// =============================
async function syncNews() {


  const pgClient = new Client(PG_CONFIG);

  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);

  sqliteDb.configure("busyTimeout", 30000);

  await ensureColumnExists(sqliteDb, "news_youtube", "ls_constituency");

  try {
    log("Connecting to PostgreSQL...");
    await pgClient.connect();
    log("✓ PostgreSQL connected");


    const assemblyData = loadAssemblyData(EXCEL_FILE_PATH);

    log("Querying PostgreSQL (streaming)...");
    await processNewsStream(pgClient, sqliteDb, assemblyData);

    log("News synchronization completed.");
  } catch (error) {
    logError("Synchronization failed:", error);
  } finally {
    await pgClient.end();
    sqliteDb.close();
    await flushLogs();
  }
}

// =============================
// Start
// =============================
syncNews();