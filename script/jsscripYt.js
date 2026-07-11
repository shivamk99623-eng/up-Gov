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

const SQLITE_DB_PATH = "../database/data.db";
const EXCEL_FILE_PATH = "./UP_Legislative Assembly.xlsx";

const CONSTITUENCY_NAME_FILE_PATH = "./2. Constituency Name (Lok Sabha).json";
const MLA_NAME_FILE_PATH = "./3. MLA Names.json";
const LKSABHA_MP_FILE_PATH = "./4. LokSabha MP's.json";
const RAJYASABHA_MP_FILE_PATH = "./5. Rajya Sabha MP's.json";
const DISTRICT_NAME_FILE_PATH = "./1. District Name.json";

const ENTITY_COLUMNS = [
  "District",
  "Constituency",
  "LK_Constituency",
  "MLA",
  "Loksabha_MP",
  "Rajyasabha_MP",
];

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
    AND N."postedTime" BETWEEN '2026-06-22 18:30:00'
                          AND '2026-07-10 18:29:59'
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
function loadConstituencyJson(filePath) {
  log(`Loading Excel file: ${filePath}`);

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];

  log(`Sheet found: ${sheetName}`);

  const rows = xlsx.utils.sheet_to_json(
    workbook.Sheets[sheetName]
  );

  log(`Loaded ${rows.length} assembly records`);
  return rows.map((row) => ({
    assembly: String(row.Assembly || "").trim(),
    district: String(row.Distrit || "").trim(),
  })).filter((row) => row.assembly);
}

function normalizePlaceName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findCanonicalDistrict(placeName, DistrictJson) {
  const normalized = normalizePlaceName(placeName);
  if (!normalized) return null;
  return DistrictJson.find(
    (district) => normalizePlaceName(district) === normalized
  ) || null;
}

// =============================
// Find Matches
// =============================
function findAssemblyMatches(
  news,
  ConstituencyJson,
  LK_ConstituencyJson,
  MlaJson,
  DistrictJson,
  Loksabha_MPJson,
  Rajyasabha_MPJson
) {
  const searchText = [
    news.heading || news.Heading || "",
    news.summary || news.Summary || "",
    news.content || news.Content || ""
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ");

  const matchedconstituency = new Set();
  const matchedDistricts = new Set();
  const matchedLKConstituency = new Set();
  const matchedMLA = new Set();
  const matchedRajyasabhaMP = new Set();
  const matchedLKSabhaMP = new Set();

  function matchesInText(name) {
    if (!name) return false;
    const regex = new RegExp(
      `\\b${escapeRegex(name.toLowerCase())}\\b`,
      "i"
    );
    return regex.test(searchText);
  }

  function addDistrict(placeName) {
    const district = findCanonicalDistrict(placeName, DistrictJson);
    if (district) matchedDistricts.add(district);
  }

  for (const item of ConstituencyJson) {
    if (matchesInText(item.assembly)) {
      matchedconstituency.add(item.assembly);
      if (item.district) {
        matchedDistricts.add(item.district);
      }
    }
  }

  for (const name of MlaJson) {
    if (matchesInText(name)) matchedMLA.add(name);
  }

  for (const name of Rajyasabha_MPJson) {
    if (matchesInText(name)) matchedRajyasabhaMP.add(name);
  }

  for (const name of DistrictJson) {
    if (matchesInText(name)) matchedDistricts.add(name);
  }

  // Lok Sabha MP list is index-aligned with LK constituency list
  for (let i = 0; i < Loksabha_MPJson.length; i++) {
    const mpName = Loksabha_MPJson[i];
    const lkConstituency = LK_ConstituencyJson[i];

    if (matchesInText(mpName)) {
      matchedLKSabhaMP.add(mpName);
      if (lkConstituency) {
        matchedLKConstituency.add(lkConstituency);
        addDistrict(lkConstituency);
      }
    }
  }

  for (const name of LK_ConstituencyJson) {
    if (matchesInText(name)) {
      matchedLKConstituency.add(name);
      addDistrict(name);
    }
  }

  return {
    districts: [...matchedDistricts],
    constituency: [...matchedconstituency],
    lkConstituency: [...matchedLKConstituency],
    mla: [...matchedMLA],
    rajyasabhaMP: [...matchedRajyasabhaMP],
    loksabhaMP: [...matchedLKSabhaMP]
  };
}

function hasEntityMatch(matches) {
  return (
    matches.districts.length > 0 ||
    matches.constituency.length > 0 ||
    matches.lkConstituency.length > 0 ||
    matches.mla.length > 0 ||
    matches.loksabhaMP.length > 0 ||
    matches.rajyasabhaMP.length > 0
  );
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

function parseJsonArray(value) {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

// =============================
// Insert News
// =============================
async function insertNews(
  db,
  news,
  districts,
  constituency,
  lkConstituency,
  mla,
  loksabhaMP,
  rajyasabhaMP
) {
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
      Constituency,
      LK_Constituency,
      MLA,
      Loksabha_MP,
      Rajyasabha_MP
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await run(db, sql, [
    news.newsId,
    news.Heading,
    news.summary,
    news.Link,
    formatCreatedAt(news.createdAt),
    news.Content,
    news.language,
    news.sentiment,
    news.Channel,
    news.duration,
    formatCreatedAt(news.PostedTime),
    news.Comment_count,
    news.Like_count,
    JSON.stringify(districts),
    JSON.stringify(constituency),
    JSON.stringify(lkConstituency),
    JSON.stringify(mla),
    JSON.stringify(loksabhaMP),
    JSON.stringify(rajyasabhaMP),
  ]);

  log(`Inserted newsId: ${news.newsId}`);
}

// =============================
// Update News
// =============================
async function updateNews(
  db,
  newsId,
  newDistricts,
  newconstituency,
  newLKConstituency,
  newMLA,
  newLoksabhaMP,
  newRajyasabhaMP
) {
  const existing = await get(
    db,
    `
    SELECT District, Constituency, LK_Constituency, MLA, Loksabha_MP, Rajyasabha_MP
    FROM news_youtube
    WHERE newsId = ?
    `,
    [newsId]
  );

  const mergedDistricts = mergeUniqueArrays(parseJsonArray(existing?.District), newDistricts);
  const mergedconstituency = mergeUniqueArrays(parseJsonArray(existing?.Constituency), newconstituency);
  const mergedLKConstituency = mergeUniqueArrays(parseJsonArray(existing?.LK_Constituency), newLKConstituency);
  const mergedMLA = mergeUniqueArrays(parseJsonArray(existing?.MLA), newMLA);
  const mergedLoksabhaMP = mergeUniqueArrays(parseJsonArray(existing?.Loksabha_MP), newLoksabhaMP);
  const mergedRajyasabhaMP = mergeUniqueArrays(parseJsonArray(existing?.Rajyasabha_MP), newRajyasabhaMP);

  await run(
    db,
    `
    UPDATE news_youtube
    SET
      District = ?,
      Constituency = ?,
      LK_Constituency = ?,
      MLA = ?,
      Loksabha_MP = ?,
      Rajyasabha_MP = ?
    WHERE newsId = ?
    `,
    [
      JSON.stringify(mergedDistricts),
      JSON.stringify(mergedconstituency),
      JSON.stringify(mergedLKConstituency),
      JSON.stringify(mergedMLA),
      JSON.stringify(mergedLoksabhaMP),
      JSON.stringify(mergedRajyasabhaMP),
      newsId,
    ]
  );

  log(`Updated newsId: ${newsId}`);
}

// =============================
// Stream & Process News Rows
// =============================
async function processNewsStream(props = {}) {
  const query = new QueryStream(NEWS_QUERY);
  const stream = props.pgClient.query(query);

  let rowCount = 0;

  for await (const news of stream) {
    rowCount++;

    const matches = findAssemblyMatches(
      news,
      props.ConstituencyJson,
      props.LK_ConstituencyJson,
      props.MlaJson,
      props.DistrictJson,
      props.Loksabha_MPJson,
      props.Rajyasabha_MPJson
    );

    if (!hasEntityMatch(matches)) {
      log(`Skipped newsId: ${news.newsId} (No entity match)`);
      continue;
    }

    const {
      districts,
      constituency,
      lkConstituency,
      mla,
      rajyasabhaMP,
      loksabhaMP,
    } = matches;

    log(
      `newsId=${news.newsId} | districts=${JSON.stringify(districts)} | constituency=${JSON.stringify(constituency)} | lk=${JSON.stringify(lkConstituency)} | mla=${JSON.stringify(mla)} | loksabhaMP=${JSON.stringify(loksabhaMP)} | rajyasabhaMP=${JSON.stringify(rajyasabhaMP)}`
    );

    const existingRow = await get(
      props.sqliteDb,
      `SELECT newsId FROM news_youtube WHERE newsId = ?`,
      [news.newsId]
    );

    if (existingRow) {
      await updateNews(
        props.sqliteDb,
        news.newsId,
        districts,
        constituency,
        lkConstituency,
        mla,
        loksabhaMP,
        rajyasabhaMP
      );
    } else {
      await insertNews(
        props.sqliteDb,
        news,
        districts,
        constituency,
        lkConstituency,
        mla,
        loksabhaMP,
        rajyasabhaMP
      );
    }
  }

  log(`Fetched ${rowCount} news records`);
}

function loadJsonData(filePath) {
  log(`Loading JSON file: ${filePath}`);
  const data = fs.readFileSync(filePath, "utf8");
  const jsonData = JSON.parse(data);
  log(`Loaded ${jsonData.length} JSON records`);
  return jsonData;
}

// =============================
// Main Sync
// =============================
async function syncNews() {
  const pgClient = new Client(PG_CONFIG);
  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);

  sqliteDb.configure("busyTimeout", 30000);

  for (const column of ENTITY_COLUMNS) {
    await ensureColumnExists(sqliteDb, "news_youtube", column);
  }

  try {
    log("Connecting to PostgreSQL...");
    await pgClient.connect();
    log("✓ PostgreSQL connected");

    const ConstituencyJson = loadConstituencyJson(EXCEL_FILE_PATH);
    const DistrictJson = loadJsonData(DISTRICT_NAME_FILE_PATH);
    const LK_ConstituencyJson = loadJsonData(CONSTITUENCY_NAME_FILE_PATH);
    const MlaJson = loadJsonData(MLA_NAME_FILE_PATH);
    const Loksabha_MPJson = loadJsonData(LKSABHA_MP_FILE_PATH);
    const Rajyasabha_MPJson = loadJsonData(RAJYASABHA_MP_FILE_PATH);

    log("Querying PostgreSQL (streaming)...");
    await processNewsStream({
      pgClient,
      sqliteDb,
      ConstituencyJson,
      DistrictJson,
      LK_ConstituencyJson,
      MlaJson,
      Loksabha_MPJson,
      Rajyasabha_MPJson,
    });

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
