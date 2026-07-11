const { Client } = require("pg");
const QueryStream = require("pg-query-stream");
const sqlite3 = require("sqlite3").verbose();
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

const LOG_FILE_PATH = path.join(__dirname, "scriptOnline.log");

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
    N."newsId",
    N."mediaId",
    N."heading",
    N."sentiment",
    N."publicationName",
    N."editionName",
    N."authors",
    N."CCM",
    N."pageNumber",
    N."languageName",
    N."createdAt",
    N."content",
    N."summary",
    N."ministries_scoring" AS "ministriesScoring",
    N."originalClipUrls" as "Link"
FROM "News" N
WHERE
    N."mediaId" = 2
    AND N."isDeleted" = false
    AND N."createdAt" BETWEEN '2026-06-22 18:30:00' AND '2026-07-10 18:29:59'
    AND EXISTS (
        SELECT 1
        FROM unnest("ministries_scoring") AS elem_text
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

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
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

/** Normalize text/names the same way so "S.P." and "S. P." both become "s p". */
function normalizeForMatch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Expand MP/MLA name forms: initials, Urf/Alias halves, parenthetical aliases.
 * Keeps multi-token aliases only when short single-token aliases would be noisy.
 */
function personNameVariants(name) {
  const raw = String(name || "").trim();
  if (!raw) return [];

  const variants = new Set([raw]);
  const withoutParens = raw.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (withoutParens) variants.add(withoutParens);

  const paren = raw.match(/\(([^)]+)\)/);
  if (paren?.[1]?.trim()) variants.add(paren[1].trim());

  for (const part of raw.split(/\s+(?:urf|alias)\s+/i)) {
    const cleaned = part.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    const tokens = cleaned.split(/\s+/);
    if (tokens.length >= 2 || cleaned.length >= 8) {
      variants.add(cleaned);
    }
  }

  return [...variants]
    .map(normalizeForMatch)
    .filter((v) => v.length >= 2);
}

/** Nicknames / old list names that should tag the canonical JSON name. */
const PERSON_NAME_ALIASES = {
  "Yogi Adityanath": ["Adityanath", "CM Yogi", "Chief Minister Yogi"],
};

/** Rewrite stale tags left from older MLA/MP name lists. */
function canonicalizePersonName(name) {
  const normalized = normalizeForMatch(name);
  if (normalized === "adityanath") return "Yogi Adityanath";
  return name;
}

function mergePersonNames(existing = [], incoming = []) {
  return [
    ...new Set(
      [...(existing || []), ...(incoming || [])].map(canonicalizePersonName)
    ),
  ];
}

function searchPatternsForPerson(canonicalName) {
  return [canonicalName, ...(PERSON_NAME_ALIASES[canonicalName] || [])];
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
  const searchText = normalizeForMatch(
    [
      news.heading || news.Heading || "",
      news.summary || news.Summary || "",
      news.content || news.Content || "",
    ].join(" ")
  );

  const matchedconstituency = new Set();
  const matchedDistricts = new Set();
  const matchedLKConstituency = new Set();
  const matchedMLA = new Set();
  const matchedRajyasabhaMP = new Set();
  const matchedLKSabhaMP = new Set();

  function matchesInText(name) {
    for (const variant of personNameVariants(name)) {
      const regex = new RegExp(`\\b${escapeRegex(variant)}\\b`, "i");
      if (regex.test(searchText)) return true;
    }
    return false;
  }

  function matchesPerson(canonicalName) {
    return searchPatternsForPerson(canonicalName).some((pattern) =>
      matchesInText(pattern)
    );
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
    if (matchesPerson(name)) matchedMLA.add(name);
  }

  for (const name of Rajyasabha_MPJson) {
    if (matchesPerson(name)) matchedRajyasabhaMP.add(name);
  }

  for (const name of DistrictJson) {
    if (matchesInText(name)) matchedDistricts.add(name);
  }

  // Lok Sabha MP list is index-aligned with LK constituency list
  for (let i = 0; i < Loksabha_MPJson.length; i++) {
    const mpName = Loksabha_MPJson[i];
    const lkConstituency = LK_ConstituencyJson[i];

    if (matchesPerson(mpName)) {
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
    INSERT INTO news_online (
      newsId,
      Heading,
      Summary,
      CreatedAt,
      Content,
      Language,
      Website,
      Sentiment,
      Authors,
      District,
      Constituency,
      LK_Constituency,
      MLA,
      Loksabha_MP,
      Rajyasabha_MP,
      Link
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await run(db, sql, [
    news.newsId,
    news.heading,
    news.summary,
    formatCreatedAt(news.createdAt),
    news.content,
    news.languageName,
    news.publicationName,
    news.sentiment,
    news.authors?.join(", ") ?? "",
    JSON.stringify(districts),
    JSON.stringify(constituency),
    JSON.stringify(lkConstituency),
    JSON.stringify(mla),
    JSON.stringify(loksabhaMP),
    JSON.stringify(rajyasabhaMP),
    JSON.stringify(news.Link),
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
    FROM news_online
    WHERE newsId = ?
    `,
    [newsId]
  );

  const mergedDistricts = mergeUniqueArrays(parseJsonArray(existing?.District), newDistricts);
  const mergedconstituency = mergeUniqueArrays(parseJsonArray(existing?.Constituency), newconstituency);
  const mergedLKConstituency = mergeUniqueArrays(parseJsonArray(existing?.LK_Constituency), newLKConstituency);
  const mergedMLA = mergePersonNames(parseJsonArray(existing?.MLA), newMLA);
  const mergedLoksabhaMP = mergePersonNames(parseJsonArray(existing?.Loksabha_MP), newLoksabhaMP);
  const mergedRajyasabhaMP = mergePersonNames(parseJsonArray(existing?.Rajyasabha_MP), newRajyasabhaMP);

  await run(
    db,
    `
    UPDATE news_online
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
      `SELECT newsId FROM news_online WHERE newsId = ?`,
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

async function retagLocalNews(props = {}) {
  const rows = await all(
    props.sqliteDb,
    `
    SELECT newsId, Heading, Summary, Content, MLA
    FROM news_online
    WHERE
      MLA LIKE '%Adityanath%'
      OR Heading LIKE '%Yogi Adityanath%'
      OR Summary LIKE '%Yogi Adityanath%'
      OR Content LIKE '%Yogi Adityanath%'
      OR Heading LIKE '%CM Yogi%'
      OR Summary LIKE '%CM Yogi%'
      OR Content LIKE '%CM Yogi%'
      OR Heading LIKE '%Chief Minister Yogi%'
      OR Summary LIKE '%Chief Minister Yogi%'
      OR Content LIKE '%Chief Minister Yogi%'
    `
  );

  log(`Retagging ${rows.length} local news_online rows...`);
  let updated = 0;

  for (const row of rows) {
    const matches = findAssemblyMatches(
      {
        heading: row.Heading,
        summary: row.Summary,
        content: row.Content,
      },
      props.ConstituencyJson,
      props.LK_ConstituencyJson,
      props.MlaJson,
      props.DistrictJson,
      props.Loksabha_MPJson,
      props.Rajyasabha_MPJson
    );

    if (!hasEntityMatch(matches)) {
      continue;
    }

    await updateNews(
      props.sqliteDb,
      row.newsId,
      matches.districts,
      matches.constituency,
      matches.lkConstituency,
      matches.mla,
      matches.loksabhaMP,
      matches.rajyasabhaMP
    );
    updated++;
    if (updated % 500 === 0) log(`Retagged ${updated}/${rows.length}...`);
  }

  log(`✓ Retagged ${updated} news_online rows`);
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
const RETAG_ONLY = process.argv.includes("--retag");

async function syncNews() {
  const pgClient = RETAG_ONLY ? null : new Client(PG_CONFIG);
  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);

  sqliteDb.configure("busyTimeout", 30000);

  for (const column of ENTITY_COLUMNS) {
    await ensureColumnExists(sqliteDb, "news_online", column);
  }

  try {
    const ConstituencyJson = loadConstituencyJson(EXCEL_FILE_PATH);
    const DistrictJson = loadJsonData(DISTRICT_NAME_FILE_PATH);
    const LK_ConstituencyJson = loadJsonData(CONSTITUENCY_NAME_FILE_PATH);
    const MlaJson = loadJsonData(MLA_NAME_FILE_PATH);
    const Loksabha_MPJson = loadJsonData(LKSABHA_MP_FILE_PATH);
    const Rajyasabha_MPJson = loadJsonData(RAJYASABHA_MP_FILE_PATH);

    const shared = {
      sqliteDb,
      ConstituencyJson,
      DistrictJson,
      LK_ConstituencyJson,
      MlaJson,
      Loksabha_MPJson,
      Rajyasabha_MPJson,
    };

    if (RETAG_ONLY) {
      log("Running local retag only (no PostgreSQL)...");
      await retagLocalNews(shared);
      log("Local retag completed.");
      return;
    }

    log("Connecting to PostgreSQL...");
    await pgClient.connect();
    log("✓ PostgreSQL connected");

    log("Querying PostgreSQL (streaming)...");
    await processNewsStream({ pgClient, ...shared });

    log("Repairing stale MLA/MP tags on local rows...");
    await retagLocalNews(shared);

    log("News synchronization completed.");
  } catch (error) {
    logError("Synchronization failed:", error);
  } finally {
    if (pgClient) await pgClient.end();
    sqliteDb.close();
    await flushLogs();
  }
}

// =============================
// Start
// =============================
syncNews();
