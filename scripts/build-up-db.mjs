/**
 * Builds up.db from data/ — normalized SQLite schema for media + representatives.
 * Run: node scripts/build-up-db.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const DB_PATH = path.join(ROOT, "up.db");

const LOK_JSON = path.join(
  DATA,
  "uttar_pradesh_lok_sabha_members_bio copy.json",
);
const RAJ_JSON = path.join(DATA, "uttar_pradesh_rajya_sabha_members_bio.json");
const MLA_JSON = path.join(DATA, "uttar_pradesh_MLA_members_bio.json");
const MEDIA_XLSX = path.join(DATA, "media-data.xlsx");

const PRINT_SOURCES = [
  {
    dir: path.join(DATA, "Constituency Data"),
    sourceType: "constituency",
    pattern: /(?:Constituency|Consituency|constituency)_(.+?)_09-06-2026\.xlsx$/i,
  },
  {
    dir: path.join(DATA, "District Data"),
    sourceType: "district",
    pattern: /District[-_](.+?)_09-06-2026(?:\s*\(\d+\))?\.xlsx$/i,
  },
  {
    dir: path.join(DATA, "MP Data_News", "LokSabha MP Data"),
    sourceType: "mp",
    pattern: /^LokSabha MP_(.+?)_09-06-2026(?:\s*\(\d+\))?\.xlsx$/i,
    isRajyaSabha: false,
  },
  {
    dir: path.join(DATA, "MP Data_News", "RajyaSabha MP Data"),
    sourceType: "mp",
    pattern: /^RajyaSabha MP_(.+?)_09-06-2026(?:\s*\(\d+\))?\.xlsx$/i,
    isRajyaSabha: true,
  },
  {
    dir: path.join(DATA, "MLA Data_News"),
    sourceType: "mla",
    pattern: /^MLA_(.+?)_09-06-2026(?:\s*\(\d+\))?\.xlsx$/i,
  },
];

const TITLE_RE =
  /^(?:(?:shri|shrimati|smt|dr|prof|adv|mr|mrs|ms|miss)\.?\s*)+/i;

/* ----------------------------- helpers ----------------------------- */

function str(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function cleanText(value) {
  if (value == null) return null;
  const text = String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return text || null;
}

function normalizeSentiment(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (s.startsWith("pos")) return "Positive";
  if (s.startsWith("neg")) return "Negative";
  return "Neutral";
}

function normalizeMediaType(channel) {
  const c = String(channel ?? "").trim().toLowerCase();
  if (c.includes("youtube") || c.includes("you tube")) return "YouTube";
  if (c.includes("twitter") || c === "x") return "X";
  return "Online";
}

function num(value) {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const INDIAN_DATE_RE =
  /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

function formatCalendarDate(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIndianDateString(value) {
  const m = value.trim().match(INDIAN_DATE_RE);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const hour = m[4] !== undefined ? Number(m[4]) : 0;
  const minute = m[5] !== undefined ? Number(m[5]) : 0;
  const second = m[6] !== undefined ? Number(m[6]) : 0;
  const d = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function parseDate(value) {
  if (typeof value === "string") {
    const fromIndian = parseIndianDateString(value);
    if (fromIndian !== null) return formatCalendarDate(fromIndian);
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF?.parse_date_code?.(value);
    if (parsed) {
      const d = new Date(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H,
        parsed.M,
        parsed.S,
      );
      return Number.isNaN(d.getTime()) ? null : formatCalendarDate(d.getTime());
    }
  }
  return null;
}

function readFormattedDateColumn(ws, columnName) {
  const ref = ws["!ref"];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  let dateCol = -1;
  for (let c = range.s.c; c <= range.e.c; c++) {
    const header = ws[XLSX.utils.encode_cell({ r: range.s.r, c })];
    if (header && String(header.v).trim() === columnName) {
      dateCol = c;
      break;
    }
  }
  if (dateCol < 0) return [];
  const out = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: dateCol })];
    out.push(cell?.w ? String(cell.w) : "");
  }
  return out;
}

function stripTitles(name) {
  let s = name.trim().replace(/\u00a0/g, " ");
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(TITLE_RE, "").trim();
  }
  return s;
}

function normalizePersonCore(name) {
  return stripTitles(name)
    .toLowerCase()
    .replace(/[\[\]]/g, "")
    .replace(/,/g, " ")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactPersonKey(name) {
  return normalizePersonCore(name).replace(/\s+/g, "");
}

function canonicalizeMpName(name) {
  return name
    .trim()
    .replace(/^\[|\]$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeMlaName(name) {
  return name
    .trim()
    .replace(/,\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitKeyword(keyword) {
  const raw = String(keyword ?? "").trim();
  if (!raw) return { lead: "", tags: [] };
  const [before, after = ""] = raw.split("+");
  const lead = before.split(",")[0].trim();
  const tags = after
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return { lead, tags };
}

function classifyEntity(keyword) {
  const { lead, tags } = splitKeyword(keyword);
  if (!lead) return { entityName: null, entityType: null };
  const t = tags.join(",").toLowerCase();
  let entityType = null;
  if (/member of the legislative assembly|\bmla\b/.test(t)) entityType = "MLA";
  else if (/rajya sabha/.test(t)) entityType = "Rajya Sabha MP";
  else if (/lok sabha|member of lok sabha|member or parliament/.test(t))
    entityType = "Lok Sabha MP";
  return entityType
    ? { entityName: lead, entityType }
    : { entityName: null, entityType: null };
}

function buildHeadline(title, content) {
  const t = str(title);
  if (t) return t;
  const c = str(content) ?? "";
  if (!c) return "(No headline)";
  return c.length > 120 ? `${c.slice(0, 117)}…` : c;
}

function isKnownLanguage(language) {
  const v = language?.trim();
  if (!v) return false;
  return v.toLowerCase() !== "unknown";
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

function fileSlug(filePath) {
  return path
    .basename(filePath, path.extname(filePath))
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

function openDb(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) =>
      err ? reject(err) : resolve(db),
    );
  });
}

function closeDb(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
}

/* ----------------------------- schema ----------------------------- */

const SCHEMA = `
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS youtube_media;
DROP TABLE IF EXISTS x_media;
DROP TABLE IF EXISTS online_media;
DROP TABLE IF EXISTS print_media;
DROP TABLE IF EXISTS mp_position;
DROP TABLE IF EXISTS mla_position;
DROP TABLE IF EXISTS mp;
DROP TABLE IF EXISTS mla;

CREATE TABLE mp (
  id INTEGER PRIMARY KEY,
  isRajyaSabhaMember INTEGER NOT NULL DEFAULT 0 CHECK (isRajyaSabhaMember IN (0, 1)),
  mpsno INTEGER,
  fullName TEXT NOT NULL,
  constituency TEXT,
  partyFname TEXT,
  partySname TEXT,
  dateOfBirth TEXT,
  qualificationName TEXT,
  education TEXT,
  ProfessionName TEXT,
  UNIQUE (mpsno),
  UNIQUE (fullName, isRajyaSabhaMember)
);

CREATE TABLE mp_position (
  id INTEGER PRIMARY KEY,
  mp_id INTEGER NOT NULL REFERENCES mp(id) ON DELETE CASCADE,
  period TEXT,
  position TEXT NOT NULL,
  UNIQUE (mp_id, period, position)
);

CREATE TABLE mla (
  id INTEGER PRIMARY KEY,
  mpsno INTEGER,
  fullName TEXT NOT NULL,
  constituency TEXT,
  partyFname TEXT,
  partySname TEXT,
  dateOfBirth TEXT,
  qualificationName TEXT,
  education TEXT,
  ProfessionName TEXT,
  UNIQUE (fullName),
  UNIQUE (mpsno)
);

CREATE TABLE mla_position (
  id INTEGER PRIMARY KEY,
  mla_id INTEGER NOT NULL REFERENCES mla(id) ON DELETE CASCADE,
  period TEXT,
  position TEXT NOT NULL,
  UNIQUE (mla_id, period, position)
);

CREATE TABLE print_media (
  id INTEGER PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('constituency', 'district', 'mp', 'mla')),
  scope TEXT NOT NULL,
  sr_no INTEGER,
  headline TEXT NOT NULL,
  publication TEXT,
  author TEXT,
  edition TEXT,
  page_no TEXT,
  sentiment TEXT NOT NULL,
  ccm TEXT,
  language TEXT NOT NULL,
  date TEXT,
  source_file TEXT NOT NULL,
  mp_id INTEGER REFERENCES mp(id),
  mla_id INTEGER REFERENCES mla(id),
  UNIQUE (source_type, scope, sr_no, headline, publication, date, source_file)
);

CREATE TABLE youtube_media (
  id INTEGER PRIMARY KEY,
  source_id TEXT NOT NULL UNIQUE,
  category TEXT,
  profile TEXT,
  language TEXT NOT NULL,
  followers_rank REAL,
  total_engagement REAL NOT NULL DEFAULT 0,
  total_engagement_with_views REAL NOT NULL DEFAULT 0,
  likes REAL NOT NULL DEFAULT 0,
  comments REAL NOT NULL DEFAULT 0,
  shares REAL NOT NULL DEFAULT 0,
  views REAL NOT NULL DEFAULT 0,
  impressions REAL NOT NULL DEFAULT 0,
  date TEXT,
  timestamp_ms INTEGER,
  sentiment TEXT NOT NULL,
  headline TEXT NOT NULL,
  content TEXT,
  country TEXT,
  location TEXT,
  tracker TEXT,
  district TEXT,
  constituency TEXT,
  keyword TEXT,
  url TEXT,
  entity_name TEXT,
  entity_type TEXT,
  mp_id INTEGER REFERENCES mp(id),
  mla_id INTEGER REFERENCES mla(id)
);

CREATE TABLE x_media (
  id INTEGER PRIMARY KEY,
  source_id TEXT NOT NULL UNIQUE,
  category TEXT,
  profile TEXT,
  language TEXT NOT NULL,
  followers_rank REAL,
  total_engagement REAL NOT NULL DEFAULT 0,
  total_engagement_with_views REAL NOT NULL DEFAULT 0,
  likes REAL NOT NULL DEFAULT 0,
  comments REAL NOT NULL DEFAULT 0,
  shares REAL NOT NULL DEFAULT 0,
  views REAL NOT NULL DEFAULT 0,
  impressions REAL NOT NULL DEFAULT 0,
  date TEXT,
  timestamp_ms INTEGER,
  sentiment TEXT NOT NULL,
  headline TEXT NOT NULL,
  content TEXT,
  country TEXT,
  location TEXT,
  tracker TEXT,
  district TEXT,
  constituency TEXT,
  keyword TEXT,
  url TEXT,
  entity_name TEXT,
  entity_type TEXT,
  mp_id INTEGER REFERENCES mp(id),
  mla_id INTEGER REFERENCES mla(id)
);

CREATE TABLE online_media (
  id INTEGER PRIMARY KEY,
  source_id TEXT NOT NULL UNIQUE,
  category TEXT,
  profile TEXT,
  profile_visits REAL,
  profile_users REAL,
  language TEXT NOT NULL,
  followers_rank REAL,
  total_engagement REAL NOT NULL DEFAULT 0,
  total_engagement_with_views REAL NOT NULL DEFAULT 0,
  likes REAL NOT NULL DEFAULT 0,
  comments REAL NOT NULL DEFAULT 0,
  shares REAL NOT NULL DEFAULT 0,
  views REAL NOT NULL DEFAULT 0,
  impressions REAL NOT NULL DEFAULT 0,
  date TEXT,
  timestamp_ms INTEGER,
  sentiment TEXT NOT NULL,
  headline TEXT NOT NULL,
  content TEXT,
  country TEXT,
  location TEXT,
  tracker TEXT,
  district TEXT,
  constituency TEXT,
  keyword TEXT,
  url TEXT,
  entity_name TEXT,
  entity_type TEXT,
  mp_id INTEGER REFERENCES mp(id),
  mla_id INTEGER REFERENCES mla(id)
);

CREATE INDEX idx_print_media_mp ON print_media(mp_id);
CREATE INDEX idx_print_media_mla ON print_media(mla_id);
CREATE INDEX idx_youtube_media_mp ON youtube_media(mp_id);
CREATE INDEX idx_x_media_mp ON x_media(mp_id);
CREATE INDEX idx_online_media_mp ON online_media(mp_id);
CREATE INDEX idx_youtube_media_mla ON youtube_media(mla_id);
CREATE INDEX idx_x_media_mla ON x_media(mla_id);
CREATE INDEX idx_online_media_mla ON online_media(mla_id);
`;

/* ----------------------------- loaders ----------------------------- */

function buildMpRecords() {
  const seen = new Set();
  const records = [];

  function add(raw, isRajyaSabhaMember, positionsKey, positionField) {
    const fullName = cleanText(raw.fullName);
    if (!fullName) return;

    const dedupeKey = `${isRajyaSabhaMember}:${raw.mpsno ?? ""}:${fullName}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const positions = (raw[positionsKey] ?? [])
      .map((item) => ({
        period: cleanText(item.period) ?? "",
        position: cleanText(item[positionField]),
      }))
      .filter((p) => p.position);

    records.push({
      isRajyaSabhaMember,
      mpsno: numOrNull(raw.mpsno),
      fullName,
      constituency: cleanText(raw.constituency),
      partyFname: cleanText(raw.partyFname),
      partySname: cleanText(raw.partySname),
      dateOfBirth: cleanText(raw.dateOfBirth),
      qualificationName: cleanText(raw.qualificationName),
      education: cleanText(raw.education),
      ProfessionName: cleanText(raw.ProfessionName),
      positions,
    });
  }

  for (const raw of loadJson(LOK_JSON)) {
    add(raw, 0, "positionHeld", "positionHeld");
  }
  for (const raw of loadJson(RAJ_JSON)) {
    add(raw, 1, "positionHelds", "position");
  }

  return records;
}

function buildMlaRecords() {
  const seen = new Set();
  const records = [];

  for (const raw of loadJson(MLA_JSON)) {
    const fullName = cleanText(raw.fullName);
    if (!fullName) continue;
    const key = `${raw.mpsno ?? ""}:${fullName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const positions = (raw.positionHeld ?? [])
      .map((item) => ({
        period: cleanText(item.period) ?? "",
        position: cleanText(item.positionHeld),
      }))
      .filter((p) => p.position);

    records.push({
      mpsno: numOrNull(raw.mpsno),
      fullName,
      constituency: cleanText(raw.constituency),
      partyFname: cleanText(raw.partyFname),
      partySname: cleanText(raw.partySname),
      dateOfBirth: cleanText(raw.dateOfBirth),
      qualificationName: cleanText(raw.qualificationName),
      education: cleanText(raw.education),
      ProfessionName: cleanText(raw.ProfessionName),
      positions,
    });
  }

  return records;
}

function buildNameIndex(records, isMp = true) {
  const byKey = new Map();
  for (const record of records) {
    const id = record.id;
    const keys = new Set([
      compactPersonKey(record.fullName),
      normalizePersonCore(record.fullName),
    ]);
    if (isMp) {
      keys.add(compactPersonKey(canonicalizeMpName(record.fullName)));
    } else {
      keys.add(
        normalizePersonCore(canonicalizeMlaName(record.fullName)).replace(
          /\s+/g,
          "",
        ),
      );
    }
    for (const key of keys) {
      if (key && !byKey.has(key)) byKey.set(key, id);
    }
  }
  return byKey;
}

function resolvePersonId(nameIndex, name) {
  if (!name) return null;
  const keys = [
    compactPersonKey(name),
    normalizePersonCore(name),
    compactPersonKey(canonicalizeMpName(name)),
    compactPersonKey(canonicalizeMlaName(name)),
  ];
  for (const key of keys) {
    const hit = nameIndex.get(key);
    if (hit) return hit;
  }
  return null;
}

function loadPrintRecords(mpIndex, mlaIndex) {
  const seen = new Set();
  const records = [];

  for (const { dir, sourceType, pattern, isRajyaSabha } of PRINT_SOURCES) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".xlsx"))) {
      const m = file.match(pattern);
      if (!m) continue;

      const scope =
        sourceType === "mp"
          ? canonicalizeMpName(m[1])
          : sourceType === "mla"
            ? canonicalizeMlaName(m[1])
            : m[1].trim().replace(/\s+/g, " ");

      const filePath = path.join(dir, file);
      const buffer = fs.readFileSync(filePath);
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
      const sheetName =
        wb.SheetNames.find((n) => n.toLowerCase() === "print summary") ??
        wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) continue;

      const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
      const fileKey = fileSlug(filePath);

      for (const [idx, row] of rows.entries()) {
        const headline = str(row["Headline"]);
        if (!headline) continue;
        const language = str(row["Language"]) || "Unknown";
        if (!isKnownLanguage(language)) continue;

        const srNo = numOrNull(row["Sr. No."]);
        const date = parseDate(row["Date"]);
        const dedupeKey = `${sourceType}|${scope}|${srNo}|${headline}|${str(row["Publication"])}|${date}|${fileKey}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        let mpId = null;
        let mlaId = null;
        if (sourceType === "mp") {
          mpId = resolvePersonId(mpIndex, scope);
        } else if (sourceType === "mla") {
          mlaId = resolvePersonId(mlaIndex, scope);
        }

        records.push({
          source_type: sourceType,
          scope,
          sr_no: srNo,
          headline,
          publication: str(row["Publication"]),
          author: str(row["Author"]),
          edition: str(row["Edition"]),
          page_no:
            row["Page No."] == null || row["Page No."] === ""
              ? null
              : String(row["Page No."]),
          sentiment: normalizeSentiment(row["Sentiment"]),
          ccm: str(row["CCM"]),
          language,
          date,
          source_file: fileKey,
          mp_id: mpId,
          mla_id: mlaId,
          isRajyaSabha,
        });
      }
    }
  }

  return records;
}

function loadDigitalRecords(mpIndex, mlaIndex) {
  if (!fs.existsSync(MEDIA_XLSX)) return { youtube: [], x: [], online: [] };

  const buffer = fs.readFileSync(MEDIA_XLSX);
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === "mentions") ??
    wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const formattedDates = readFormattedDateColumn(ws, "Date");
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });

  const seen = new Set();
  const buckets = { youtube: [], x: [], online: [] };

  for (const [idx, row] of rows.entries()) {
    const language = str(row["Language"]) ?? "Unknown";
    if (!isKnownLanguage(language)) continue;

    const sourceId = String(row["ID"] ?? `row-${idx}`);
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);

    const mediaType = normalizeMediaType(row["Channel"]);
    const dateRaw = formattedDates[idx]?.trim() || row["Date"];
    const ts =
      typeof dateRaw === "string"
        ? parseIndianDateString(dateRaw)
        : typeof dateRaw === "number"
          ? parseIndianDateString(String(dateRaw))
          : null;
    const date = ts ? formatCalendarDate(ts) : null;
    const { entityName, entityType } = classifyEntity(row["Keyword"]);

    let mpId = null;
    let mlaId = null;
    if (entityType === "MLA") {
      mlaId = resolvePersonId(mlaIndex, entityName);
    } else if (
      entityType === "Lok Sabha MP" ||
      entityType === "Rajya Sabha MP"
    ) {
      mpId = resolvePersonId(mpIndex, entityName);
    }

    const record = {
      source_id: sourceId,
      category: str(row["Category"]),
      profile: str(row["Profile"]),
      profile_visits: numOrNull(row["Profile Visits (Web only)"]),
      profile_users: numOrNull(row["Profile Users (Web only)"]),
      language,
      followers_rank: numOrNull(row["Followers/Rank"]),
      total_engagement: num(row["Total Engagement"]),
      total_engagement_with_views: num(row["Total Engagement with views"]),
      likes: num(row["Likes"]),
      comments: num(row["Comments"]),
      shares: num(row["Shares"]),
      views: num(row["Views"]),
      impressions: num(row["Impressions"]),
      date,
      timestamp_ms: ts,
      sentiment: normalizeSentiment(row["Sentiment"]),
      headline: buildHeadline(row["Title"], row["Content"]),
      content: str(row["Content"]),
      country: str(row["Country"]),
      location: str(row["Location"]),
      tracker: str(row["Tracker"]),
      district: "",
      constituency: "",
      keyword: str(row["Keyword"]) ?? "",
      url: str(row["Link"]) ?? "",
      entity_name: entityName,
      entity_type: entityType,
      mp_id: mpId,
      mla_id: mlaId,
    };

    if (mediaType === "YouTube") buckets.youtube.push(record);
    else if (mediaType === "X") buckets.x.push(record);
    else buckets.online.push(record);
  }

  return buckets;
}

/* ----------------------------- main ----------------------------- */

async function main() {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const mpRecords = buildMpRecords();
  const mlaRecords = buildMlaRecords();

  const db = await openDb(DB_PATH);
  await exec(db, SCHEMA);

  const mpIdByMpsno = new Map();
  for (const record of mpRecords) {
    const result = await run(
      db,
      `INSERT INTO mp (
        isRajyaSabhaMember, mpsno, fullName, constituency, partyFname, partySname,
        dateOfBirth, qualificationName, education, ProfessionName
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.isRajyaSabhaMember,
        record.mpsno,
        record.fullName,
        record.constituency,
        record.partyFname,
        record.partySname,
        record.dateOfBirth,
        record.qualificationName,
        record.education,
        record.ProfessionName,
      ],
    );
    record.id = result.lastID;
    if (record.mpsno != null) mpIdByMpsno.set(record.mpsno, record.id);

    for (const pos of record.positions) {
      await run(
        db,
        `INSERT OR IGNORE INTO mp_position (mp_id, period, position) VALUES (?, ?, ?)`,
        [record.id, pos.period, pos.position],
      );
    }
  }

  for (const record of mlaRecords) {
    const result = await run(
      db,
      `INSERT INTO mla (
        mpsno, fullName, constituency, partyFname, partySname,
        dateOfBirth, qualificationName, education, ProfessionName
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.mpsno,
        record.fullName,
        record.constituency,
        record.partyFname,
        record.partySname,
        record.dateOfBirth,
        record.qualificationName,
        record.education,
        record.ProfessionName,
      ],
    );
    record.id = result.lastID;

    for (const pos of record.positions) {
      await run(
        db,
        `INSERT OR IGNORE INTO mla_position (mla_id, period, position) VALUES (?, ?, ?)`,
        [record.id, pos.period, pos.position],
      );
    }
  }

  const mpIndex = buildNameIndex(mpRecords, true);
  const mlaIndex = buildNameIndex(mlaRecords, false);

  const printRecords = loadPrintRecords(mpIndex, mlaIndex);
  for (const row of printRecords) {
    await run(
      db,
      `INSERT OR IGNORE INTO print_media (
        source_type, scope, sr_no, headline, publication, author, edition, page_no,
        sentiment, ccm, language, date, source_file, mp_id, mla_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.source_type,
        row.scope,
        row.sr_no,
        row.headline,
        row.publication,
        row.author,
        row.edition,
        row.page_no,
        row.sentiment,
        row.ccm,
        row.language,
        row.date,
        row.source_file,
        row.mp_id,
        row.mla_id,
      ],
    );
  }

  const digital = loadDigitalRecords(mpIndex, mlaIndex);

  async function insertDigital(table, rows, includeWebCols) {
    for (const row of rows) {
      const cols = [
        "source_id",
        "category",
        "profile",
        ...(includeWebCols ? ["profile_visits", "profile_users"] : []),
        "language",
        "followers_rank",
        "total_engagement",
        "total_engagement_with_views",
        "likes",
        "comments",
        "shares",
        "views",
        "impressions",
        "date",
        "timestamp_ms",
        "sentiment",
        "headline",
        "content",
        "country",
        "location",
        "tracker",
        "district",
        "constituency",
        "keyword",
        "url",
        "entity_name",
        "entity_type",
        "mp_id",
        "mla_id",
      ];
      const values = [
        row.source_id,
        row.category,
        row.profile,
        ...(includeWebCols ? [row.profile_visits, row.profile_users] : []),
        row.language,
        row.followers_rank,
        row.total_engagement,
        row.total_engagement_with_views,
        row.likes,
        row.comments,
        row.shares,
        row.views,
        row.impressions,
        row.date,
        row.timestamp_ms,
        row.sentiment,
        row.headline,
        row.content,
        row.country,
        row.location,
        row.tracker,
        row.district,
        row.constituency,
        row.keyword,
        row.url,
        row.entity_name,
        row.entity_type,
        row.mp_id,
        row.mla_id,
      ];
      const placeholders = cols.map(() => "?").join(", ");
      await run(
        db,
        `INSERT OR IGNORE INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`,
        values,
      );
    }
  }

  await insertDigital("youtube_media", digital.youtube, false);
  await insertDigital("x_media", digital.x, false);
  await insertDigital("online_media", digital.online, true);

  const counts = await new Promise((resolve, reject) => {
    db.all(
      `SELECT 'mp' AS tbl, COUNT(*) AS n FROM mp
       UNION ALL SELECT 'mla', COUNT(*) FROM mla
       UNION ALL SELECT 'mp_position', COUNT(*) FROM mp_position
       UNION ALL SELECT 'mla_position', COUNT(*) FROM mla_position
       UNION ALL SELECT 'print_media', COUNT(*) FROM print_media
       UNION ALL SELECT 'youtube_media', COUNT(*) FROM youtube_media
       UNION ALL SELECT 'x_media', COUNT(*) FROM x_media
       UNION ALL SELECT 'online_media', COUNT(*) FROM online_media`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows)),
    );
  });

  await closeDb(db);

  console.log(`Created ${DB_PATH}`);
  for (const { tbl, n } of counts) {
    console.log(`  ${tbl}: ${n}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
