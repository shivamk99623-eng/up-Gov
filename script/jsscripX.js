const { Client } = require("pg");
const QueryStream = require("pg-query-stream");
const sqlite3 = require("sqlite3").verbose();
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

const LOG_FILE_PATH = path.join(__dirname, "scriptX.log");

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
    N."newsId",
    N."mediaId",
    N."headline" as "Heading",
    N."sentiment",
    N."handle",
    N."language",
    N."postedTime",
    N."createdAt",
    N."Summary" as summary,
    N."engagements" as "Engagements",
    N."ministries_scoring" AS "ministriesScoring",
    N."url" as "Link"
FROM "TwitterData" N
WHERE
    N."isDeleted" = false
    AND N."postedTime" BETWEEN '2026-05-31 18:30:00' AND '2026-06-22 18:29:59'
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
  INSERT INTO news_x (
    newsId,
    Heading,
    Summary,
    Sentiment,
    handles,
    Language,
    Engagements,
    PostedTime,
    CreatedAt,
    Link,
    District,
    Constituency
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

  await run(db, sql, [
    news.newsId,
    news.Heading,
    news.summary,
    news.sentiment,
    news.handle,
    news.language,
    news.Engagements,
    formatCreatedAt(news.postedTime),
    formatCreatedAt(news.createdAt),
    news.Link,
    JSON.stringify(districts),
    JSON.stringify(assemblies)
  ]);


  log(`Inserted newsId: ${news.newsId}`);
}

// =============================
// Update News
// =============================
async function updateNews(db, news, newDistricts, newAssemblies) {
  const existing = await get(
    db,
    `
    SELECT District, Constituency
    FROM news_x
    WHERE newsId = ?
    `,
    [news.newsId]
  );

  let existingDistricts = [];
  let existingAssemblies = [];

  try {
    existingDistricts = existing?.District
      ? JSON.parse(existing.District)
      : [];
  } catch { }

  try {
    existingAssemblies = existing?.Constituency
      ? JSON.parse(existing.Constituency)
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
    UPDATE news_x
    SET
      Heading = ?,
      Link = ?,
      District = ?,
      Constituency = ?
    WHERE newsId = ?
    `,
    [
      news.Heading,
      news.Link,
      JSON.stringify(mergedDistricts),
      JSON.stringify(mergedAssemblies),
      news.newsId,
    ]
  );

  log(`Updated newsId: ${news.newsId}`);
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
      `SELECT newsId FROM news_x WHERE newsId = ?`,
      [news.newsId]
    );
    log(`existingRow=${existingRow}`);
    if (existingRow) {
      await updateNews(
        sqliteDb,
        news,
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

  await ensureColumnExists(sqliteDb, "news_x", "Constituency");

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



///     loksabhamp 

// const { Client } = require("pg");
// const QueryStream = require("pg-query-stream");
// const sqlite3 = require("sqlite3").verbose();
// const xlsx = require("xlsx");
// const path = require("path");
// const fs = require("fs");

// const LOG_FILE_PATH = path.join(__dirname, "scriptX.log");

// let logChain = Promise.resolve();

// function escapeRegex(str) {
//   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// function writeLog(level, ...args) {
//   const message = args
//     .map((arg) =>
//       arg instanceof Error
//         ? arg.stack || arg.message
//         : typeof arg === "object"
//           ? JSON.stringify(arg)
//           : String(arg)
//     )
//     .join(" ");
//   const line = `[${new Date().toISOString()}] [${level}] ${message}\n`;

//   logChain = logChain
//     .then(() => fs.promises.appendFile(LOG_FILE_PATH, line, "utf8"))
//     .catch(() => { });
// }

// function log(...args) {
//   writeLog("INFO", ...args);
// }

// function logError(...args) {
//   writeLog("ERROR", ...args);
// }

// function flushLogs() {
//   return logChain;
// }

// // =============================
// // CONFIG
// // =============================
// const PG_CONFIG = {
//   host: "localhost",
//   port: 5432,
//   user: "jeet.vyas",
//   password: "19384fjdsjaAJSDHSBH",
//   database: "nmw-prod",
//   ssl: {
//     rejectUnauthorized: false
//   }
// };

// const SQLITE_DB_PATH = "./data.db";
// const EXCEL_FILE_PATH = "./UP_Legislative Assembly.xlsx";



// async function ensureColumnExists(db, tableName, columnName) {
//   try {
//     const columns = await new Promise((resolve, reject) => {
//       db.all(`PRAGMA table_info(${tableName})`, [], (err, rows) => {
//         if (err) return reject(err);
//         resolve(rows);
//       });
//     });

//     const exists = columns.some(col => col.name === columnName);

//     if (!exists) {
//       log(`Column '${columnName}' not found. Creating...`);

//       await run(
//         db,
//         `ALTER TABLE ${tableName} ADD COLUMN ${columnName} TEXT`
//       );

//       log(`✓ Column '${columnName}' created`);
//     } else {
//       log(`✓ Column '${columnName}' already exists`);
//     }
//   } catch (err) {
//     logError(`Error checking column ${columnName}:`, err);
//     throw err;
//   }
// }

// // =============================
// // PostgreSQL Query
// // =============================
// const NEWS_QUERY = `
// SELECT
//     N."newsId",
//     N."mediaId",
//     N."headline" as "Heading",
//     N."sentiment",
//     N."handle",
//     N."language",
//     N."postedTime",
//     N."createdAt",
//     N."Summary" as summary,
//     N."engagements" as "Engagements",
//     N."ministries_scoring" AS "ministriesScoring",
//     N."url" as "Link"
// FROM "TwitterData" N
// WHERE
//     N."isDeleted" = false
//     AND N."postedTime" BETWEEN '2026-06-15 18:30:00' AND '2026-06-22 18:29:59'
// `;

// // =============================
// // SQLite Helpers
// // =============================
// function run(db, sql, params = []) {
//   return new Promise((resolve, reject) => {
//     db.run(sql, params, function (err) {
//       if (err) reject(err);
//       else resolve(this);
//     });
//   });
// }

// function get(db, sql, params = []) {
//   return new Promise((resolve, reject) => {
//     db.get(sql, params, (err, row) => {
//       if (err) reject(err);
//       else resolve(row);
//     });
//   });
// }

// // =============================
// // Load Assembly Excel
// // =============================
// function loadAssemblyData(filePath) {
//   log(`Loading Excel file: ${filePath}`);

//   const workbook = xlsx.readFile(filePath);
//   const sheetName = workbook.SheetNames[0];

//   log(`Sheet found: ${sheetName}`);

//   const rows = xlsx.utils.sheet_to_json(
//     workbook.Sheets[sheetName]
//   );

//   log(`Loaded ${rows.length} assembly records`);
//   return rows.map((row) => ({
//     district: String(row.Distrit || "").trim(),
//     assembly: String(row.Assembly || "").trim(),
//   }));
// }

// // =============================
// // Find Matches
// // =============================
// function findAssemblyMatches(news, assemblyData) {

//   const searchText = [
//     news.heading || "",
//     news.summary || "",
//     news.content || ""
//   ]
//     .join(" ")
//     .toLowerCase()
//     .replace(/[^\w\s]/g, " ");

//   const matchedAssemblies = new Set();
//   const matchedDistricts = new Set();
//   const matchedLoksabha_MP = new Set();

//   for (const item of assemblyData) {

//     const regex = new RegExp(
//       `\\b${escapeRegex(item.loksabha_mp)}\\b`,
//       "i"
//     );

//     if (regex.test(searchText)) {
//       // matchedAssemblies.add(item.assembly);
//       // matchedDistricts.add(item.district);
//       matchedLoksabha_MP.add(item.loksabha_mp);
//     }
//   }

//   return {
//     // districts: [...matchedDistricts],
//     // assemblies: [...matchedAssemblies],
//     loksabha_mp: [...matchedLoksabha_MP],
//   };
// }

// // =============================
// // Merge Arrays
// // =============================
// function mergeUniqueArrays(existing = [], incoming = []) {
//   return [...new Set([...(existing || []), ...(incoming || [])])];
// }

// function formatCreatedAt(value) {
//   if (value == null) return null;
//   if (value instanceof Date) return value.toISOString();
//   const date = new Date(value);
//   if (!Number.isNaN(date.getTime())) return date.toISOString();
//   return String(value);
// }

// // =============================
// // Insert News
// // =============================
// async function insertNews(db, news, loksabha_mp) {

//   const sql = `
//   INSERT INTO news_x (
//     newsId,
//     Heading,
//     Summary,
//     Sentiment,
//     handles,
//     Language,
//     Engagements,
//     PostedTime,
//     CreatedAt,
//     Link,
//     Loksabha_MP
//   )
//   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// `;

//   await run(db, sql, [
//     news.newsId,
//     news.Heading,
//     news.summary,
//     news.sentiment,
//     news.handle,
//     news.language,
//     news.Engagements,
//     formatCreatedAt(news.postedTime),
//     formatCreatedAt(news.createdAt),
//     news.Link,
//     JSON.stringify(loksabha_mp)
//   ]);


//   log(`Inserted newsId: ${news.newsId}`);
// }

// // =============================
// // Update News
// // =============================
// async function updateNews(db, news, loksabha_mp) {
//   const existing = await get(
//     db,
//     `
//     SELECT Loksabha_MP
//     FROM news_x
//     WHERE newsId = ?
//     `,
//     [news.newsId]
//   );

//   let existingLoksabha_MP = [];

//   try {
//     existingLoksabha_MP = existing?.Loksabha_MP
//       ? JSON.parse(existing.Loksabha_MP)
//       : [];
//   } catch { }

//   // try {
//   //   existingAssemblies = existing?.Constituency
//   //     ? JSON.parse(existing.Constituency)
//   //     : [];
//   // } catch { }

//   const mergedLoksabha_MP = mergeUniqueArrays(
//     existingLoksabha_MP,
//     loksabha_mp
//   );

//   // const mergedAssemblies = mergeUniqueArrays(
//   //   existingAssemblies,
//   //   newAssemblies
//   // );

//   await run(
//     db,
//     `
//     UPDATE news_x
//     SET
//       Loksabha_MP = ?
//     WHERE newsId = ?
//     `,
//     [
//       JSON.stringify(mergedLoksabha_MP),
//       news.newsId,
//     ]
//   );

//   log(`Updated newsId: ${news.newsId}`);
// }

// // =============================
// // Stream & Process News Rows
// // =============================
// async function processNewsStream(pgClient, sqliteDb, assemblyData) {
//   const query = new QueryStream(NEWS_QUERY);
//   const stream = pgClient.query(query);

//   let rowCount = 0;

//   for await (const news of stream) {
//     rowCount++;

//     const { loksabha_mp } = findAssemblyMatches(
//       news,
//       assemblyData
//     );

//     if (loksabha_mp.length === 0) {
//       log(`Skipped newsId: ${news.newsId} (No loksabha_mp match)`);
//       continue;
//     }

//     log(
//       `newsId=${news.newsId} | loksabha_mp=${JSON.stringify(loksabha_mp)}}`
//     );

//     const existingRow = await get(
//       sqliteDb,
//       `SELECT newsId FROM news_x WHERE newsId = ?`,
//       [news.newsId]
//     );
//     if (existingRow) {
//       log(`existingRow=${JSON.stringify(existingRow)}`);
//       await updateNews(
//         sqliteDb,
//         news,
//         loksabha_mp,
//       );
//     } else {
//       await insertNews(
//         sqliteDb,
//         news,
//         loksabha_mp
//       );
//     }
//   }

//   log(`Fetched ${rowCount} news records`);
// }

// // =============================
// // Main Sync
// // =============================
// async function syncNews() {


//   const pgClient = new Client(PG_CONFIG);

//   const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);

//   sqliteDb.configure("busyTimeout", 30000);

//   // await ensureColumnExists(sqliteDb, "news_x", "LK_Constituency");

//   try {
//     log("Connecting to PostgreSQL...");
//     await pgClient.connect();
//     log("✓ PostgreSQL connected");


//     // const assemblyData = loadAssemblyData(EXCEL_FILE_PATH);
//     const assemblyData = [
//       {
//         loksabha_mp: "Narendra Modi",
//       }
//     ];

//     log("Querying PostgreSQL (streaming)...");
//     await processNewsStream(pgClient, sqliteDb, assemblyData);

//     log("News synchronization completed.");
//   } catch (error) {
//     logError("Synchronization failed:", error);
//   } finally {
//     await pgClient.end();
//     sqliteDb.close();
//     await flushLogs();
//   }
// }

// // =============================
// // Start
// // =============================
// syncNews();