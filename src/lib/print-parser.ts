import "server-only";
import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";
import {
  endOfCalendarDay,
  formatCalendarDate,
  startOfCalendarDay,
} from "./dates";
import {
  toGeoName,
  isKnownDistrict,
  isKnownLanguage,
  resolveDistrictName,
} from "./excel-parser";
import {
  compactMpKey,
  resolveMpBioKey,
} from "./mp-name-matching";
import type { GlobalFilters, PrintRecord, PrintSourceType, Sentiment } from "./types";

const DATA_ROOT = path.join(process.cwd(), "data");

const SOURCES: { dir: string; sourceType: PrintSourceType; pattern: RegExp }[] = [
  {
    dir: path.join(DATA_ROOT, "Constituency Data"),
    sourceType: "constituency",
    pattern: /(?:Constituency|Consituency|constituency)_(.+?)_09-06-2026\.xlsx$/i,
  },
  {
    dir: path.join(DATA_ROOT, "District Data"),
    sourceType: "district",
    pattern: /District[-_](.+?)_09-06-2026(?:\s*\(\d+\))?\.xlsx$/i,
  },
  {
    dir: path.join(DATA_ROOT, "MP Data_News", "LokSabha MP Data"),
    sourceType: "mp",
    pattern: /^LokSabha MP_(.+?)_09-06-2026(?:\s*\(\d+\))?\.xlsx$/i,
  },
  {
    dir: path.join(DATA_ROOT, "MP Data_News", "RajyaSabha MP Data"),
    sourceType: "mp",
    pattern: /^RajyaSabha MP_(.+?)_09-06-2026(?:\s*\(\d+\))?\.xlsx$/i,
  },
  {
    dir: path.join(DATA_ROOT, "MLA Data_News"),
    sourceType: "mla",
    pattern: /^MLA_(.+?)_09-06-2026(?:\s*\(\d+\))?\.xlsx$/i,
  },
];

const SCOPE_ALIASES: Record<string, string> = {
  ambedkarnagar: "Ambedkarnagar",
  badaun: "Badaun",
  kushinagar: "kushinagar",
  "misrikh (sc)": "Misrikh (SC)",
  "sant kabir nagar": "Sant Kabir Nagar",
  "gautam buddha nagar": "Gautam Buddha Nagar",
  kanpur: "Kanpur",
};

interface PrintCache {
  mtimeMs: number;
  records: PrintRecord[];
  constituencies: string[];
  constituencyLookup: Map<string, string>;
  /** MP print rows keyed by bio key / compact name for O(1) lookup. */
  mpByKey: Map<string, PrintRecord[]>;
  /** MLA print rows keyed by normalized MLA name. */
  mlaByKey: Map<string, PrintRecord[]>;
}

let cache: PrintCache | null = null;

function normalizeSentiment(value: unknown): Sentiment {
  const s = String(value ?? "").trim().toLowerCase();
  if (s.startsWith("pos")) return "Positive";
  if (s.startsWith("neg")) return "Negative";
  return "Neutral";
}

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const INDIAN_DATE_RE =
  /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

function parseIndianDateString(value: string): string | null {
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
  return Number.isNaN(d.getTime()) ? null : formatCalendarDate(d.getTime());
}

function parseDate(value: unknown): string | null {
  if (typeof value === "string") return parseIndianDateString(value);
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
      return Number.isNaN(d.getTime())
        ? null
        : formatCalendarDate(d.getTime());
    }
  }
  return null;
}

function canonicalizeScope(name: string, sourceType?: PrintSourceType): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (sourceType === "district") {
    return resolveDistrictName(trimmed);
  }
  return SCOPE_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

/** Normalizes MP names from filenames (strips brackets, extra spaces). */
function canonicalizeMpName(name: string): string {
  const trimmed = name
    .trim()
    .replace(/^\[|\]$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return SCOPE_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

/** Normalizes MLA names from filenames (strips trailing commas, extra spaces). */
function canonicalizeMlaName(name: string): string {
  const trimmed = name
    .trim()
    .replace(/,\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return SCOPE_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

function normalizeMlaName(name: string): string {
  return name
    .trim()
    .replace(/,\s*$/g, "")
    .replace(/[\[\]]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^(?:shri|smt\.?)\s+/i, "")
    .replace(/^dr\.?\s*/i, "")
    .replace(/\./g, "")
    .trim();
}

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

function normalizePersonName(name: string): string {
  return name
    .trim()
    .replace(/[\[\]]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function matchesMlaScope(record: PrintRecord, mlaName: string): boolean {
  return (
    record.sourceType === "mla" &&
    normalizeMlaName(record.scope) === normalizeMlaName(mlaName)
  );
}

/** Cheap keys derived from a print row scope (no fuzzy bio scan). */
function mpIndexKeysFromScope(scope: string): string[] {
  return [compactMpKey(scope), normalizePersonName(scope)];
}

/** Keys for resolving a user/bio name to indexed print rows. */
function mpLookupKeys(name: string): string[] {
  const keys = new Set<string>();
  const bioKey = resolveMpBioKey(name);
  if (bioKey) keys.add(bioKey);
  keys.add(compactMpKey(name));
  keys.add(normalizePersonName(name));
  return [...keys];
}

function indexPrintRecords(records: PrintRecord[]): {
  mpByKey: Map<string, PrintRecord[]>;
  mlaByKey: Map<string, PrintRecord[]>;
} {
  const mpByKey = new Map<string, PrintRecord[]>();
  const mlaByKey = new Map<string, PrintRecord[]>();

  for (const record of records) {
    if (record.sourceType === "mp") {
      for (const key of mpIndexKeysFromScope(record.scope)) {
        const bucket = mpByKey.get(key);
        if (bucket) bucket.push(record);
        else mpByKey.set(key, [record]);
      }
    } else if (record.sourceType === "mla") {
      const key = normalizeMlaName(record.scope);
      const bucket = mlaByKey.get(key);
      if (bucket) bucket.push(record);
      else mlaByKey.set(key, [record]);
    }
  }

  return { mpByKey, mlaByKey };
}

function lookupMpPrint(
  mpByKey: Map<string, PrintRecord[]>,
  mpName: string,
): PrintRecord[] {
  for (const key of mpLookupKeys(mpName)) {
    const hit = mpByKey.get(key);
    if (hit?.length) return hit;
  }
  return [];
}

function lookupMlaPrint(
  mlaByKey: Map<string, PrintRecord[]>,
  mlaName: string,
): PrintRecord[] {
  return mlaByKey.get(normalizeMlaName(mlaName)) ?? [];
}

function matchesMpScope(record: PrintRecord, mpName: string): boolean {
  if (record.sourceType !== "mp") return false;
  const recordKeys = new Set(mpIndexKeysFromScope(record.scope));
  return mpLookupKeys(mpName).some((key) => recordKeys.has(key));
}

function matchesEntityPrintScope(
  record: PrintRecord,
  entityName: string,
): boolean {
  if (record.sourceType === "mp") return matchesMpScope(record, entityName);
  if (record.sourceType === "mla") return matchesMlaScope(record, entityName);
  return false;
}

function buildLookup(names: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const n of names) {
    const lower = n.toLowerCase();
    map.set(lower, n);
    map.set(lower.replace(/\s+/g, ""), n);
    map.set(normalizeKey(n), n);
  }
  for (const [alias, canonical] of Object.entries(SCOPE_ALIASES)) {
    map.set(alias, canonical);
    map.set(alias.replace(/\s+/g, ""), canonical);
  }
  return map;
}

function fileSlug(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath));
  return base
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function dirLatestMtime(dirs: string[]): number {
  let latest = 0;
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    latest = Math.max(latest, fs.statSync(dir).mtimeMs);
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".xlsx")) continue;
      latest = Math.max(latest, fs.statSync(path.join(dir, f)).mtimeMs);
    }
  }
  return latest;
}

function loadPrintFromFile(
  filePath: string,
  sourceType: PrintSourceType,
  scope: string,
): PrintRecord[] {
  const buffer = fs.readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === "print summary") ??
    wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: true,
  });

  const fileKey = fileSlug(filePath);
  return rows
    .map((row, idx) => {
      const headline = str(row["Headline"]);
      if (!headline) return null;
      const srNo = numOrNull(row["Sr. No."]);
      return {
        id: `${fileKey}-print-${srNo ?? idx + 1}`,
        sourceType,
        scope,
        srNo,
        headline,
        publication: str(row["Publication"]),
        author: str(row["Author"]),
        edition: str(row["Edition"]),
        pageNo:
          typeof row["Page No."] === "number" ||
          typeof row["Page No."] === "string"
            ? row["Page No."]
            : null,
        sentiment: normalizeSentiment(row["Sentiment"]),
        ccm: str(row["CCM"]) || null,
        language: str(row["Language"]) || "Unknown",
        date: parseDate(row["Date"]),
      } satisfies PrintRecord;
    })
    .filter(
      (r): r is PrintRecord => r !== null && isKnownLanguage(r.language),
    );
}

function ensureCache(): PrintCache {
  const mtimeMs = dirLatestMtime(SOURCES.map((s) => s.dir));
  if (cache && cache.mtimeMs === mtimeMs) return cache;

  const records: PrintRecord[] = [];
  const constituencies: string[] = [];

  for (const { dir, sourceType, pattern } of SOURCES) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".xlsx"))) {
      const m = file.match(pattern);
      if (!m) continue;
      const scope =
        sourceType === "mp"
          ? canonicalizeMpName(m[1])
          : sourceType === "mla"
            ? canonicalizeMlaName(m[1])
            : canonicalizeScope(m[1], sourceType);
      if (sourceType === "constituency") constituencies.push(scope);
      records.push(...loadPrintFromFile(path.join(dir, file), sourceType, scope));
    }
  }

  constituencies.sort((a, b) => a.localeCompare(b));
  const { mpByKey, mlaByKey } = indexPrintRecords(records);

  cache = {
    mtimeMs,
    records,
    constituencies,
    constituencyLookup: buildLookup(constituencies),
    mpByKey,
    mlaByKey,
  };
  return cache;
}

export function listConstituenciesFromPrint(): string[] {
  return [...ensureCache().constituencies];
}

export function resolveConstituencyToken(token: string): string | null {
  const t = token.trim();
  if (!t) return null;
  const lookup = ensureCache().constituencyLookup;
  const lower = t.toLowerCase();
  return (
    lookup.get(lower) ??
    lookup.get(lower.replace(/\s+/g, "")) ??
    lookup.get(normalizeKey(t)) ??
    null
  );
}

export function isKnownConstituency(
  constituency: string | null | undefined,
): boolean {
  if (!constituency?.trim()) return false;
  return resolveConstituencyToken(constituency) !== null;
}

/** All print records from constituency, district, and MP folders. */
export function loadAllPrintRecords(): PrintRecord[] {
  return ensureCache().records;
}

function resolveDistrictScope(district: string): string {
  return toGeoName(district);
}

function districtMatchKeys(name: string): Set<string> {
  const canonical = resolveDistrictName(name);
  const geo = toGeoName(canonical);
  return new Set(
    [name, canonical, geo, toGeoName(geo)]
      .map((n) => normalizeKey(n))
      .filter(Boolean),
  );
}

function matchesDistrict(r: PrintRecord, district: string): boolean {
  const targets = districtMatchKeys(district);
  const scopeKey = normalizeKey(r.scope);
  if (r.sourceType === "district") {
    return targets.has(scopeKey);
  }
  if (r.sourceType === "constituency") {
    return targets.has(scopeKey);
  }
  return false;
}

export function filterPrintRecords(
  records: PrintRecord[],
  filters: GlobalFilters & {
    constituency?: string | null;
    includeMp?: boolean;
  },
): PrintRecord[] {
  const {
    district,
    constituency,
    entity,
    printSource,
    sentiment,
    language,
    search,
    dateFrom,
    dateTo,
    includeMp = true,
  } = filters;

  const fromTs = dateFrom ? startOfCalendarDay(dateFrom) : null;
  const toTs = dateTo ? endOfCalendarDay(dateTo) : null;
  const q = search?.trim().toLowerCase() ?? "";
  const resolvedConstituency = constituency
    ? resolveConstituencyToken(constituency) ?? constituency
    : null;

  return records.filter((r) => {
    if (printSource === "district" && r.sourceType !== "district") return false;
    if (entity) {
      if (printSource === "mla" && r.sourceType !== "mla") return false;
      if (printSource === "mp" && r.sourceType !== "mp") return false;
      if (!matchesEntityPrintScope(r, entity)) return false;
    } else if (
      !includeMp &&
      (r.sourceType === "mp" || r.sourceType === "mla")
    ) {
      return false;
    }
    if (district && district !== "All" && !matchesDistrict(r, district))
      return false;
    if (resolvedConstituency && resolvedConstituency !== "All") {
      if (
        r.sourceType !== "constituency" ||
        r.scope !== resolvedConstituency
      )
        return false;
    }
    if (sentiment && sentiment !== "All" && r.sentiment !== sentiment)
      return false;
    if (language && language !== "All" && r.language !== language) return false;
    if (fromTs !== null || toTs !== null) {
      if (!r.date) return false;
      const ts = startOfCalendarDay(r.date);
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
    }
    if (q) {
      const hay = `${r.headline} ${r.publication} ${r.author} ${r.edition} ${r.scope}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function loadPrintRecords(filters: GlobalFilters = {}): PrintRecord[] {
  const all = loadAllPrintRecords();
  return filterPrintRecords(all, filters);
}

/** Unique MP names from Lok Sabha / Rajya Sabha print folders. */
export function listMpNamesByHouse(): {
  lokSabha: string[];
  rajyaSabha: string[];
} {
  const lokDir = path.join(DATA_ROOT, "MP Data_News", "LokSabha MP Data");
  const rajDir = path.join(DATA_ROOT, "MP Data_News", "RajyaSabha MP Data");
  const lokPattern = SOURCES.find(
    (s) => s.dir === lokDir,
  )!.pattern;
  const rajPattern = SOURCES.find(
    (s) => s.dir === rajDir,
  )!.pattern;

  function scan(dir: string, pattern: RegExp): string[] {
    if (!fs.existsSync(dir)) return [];
    const names = new Set<string>();
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".xlsx"))) {
      const m = file.match(pattern);
      if (m) names.add(canonicalizeMpName(m[1]));
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }

  return {
    lokSabha: scan(lokDir, lokPattern),
    rajyaSabha: scan(rajDir, rajPattern),
  };
}

/** Unique district names from `data/District Data` print files. */
export function listDistrictNamesFromPrint(): string[] {
  const dir = path.join(DATA_ROOT, "District Data");
  const pattern = SOURCES.find((s) => s.sourceType === "district")!.pattern;
  if (!fs.existsSync(dir)) return [];
  const names = new Set<string>();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".xlsx"))) {
    const m = file.match(pattern);
    if (m) names.add(canonicalizeScope(m[1], "district"));
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** Print records for a district from `data/District Data`. */
export function loadDistrictPrintRecords(
  district?: string | null,
): PrintRecord[] {
  const all = loadAllPrintRecords().filter((r) => r.sourceType === "district");
  if (!district || district === "All") return all;
  return all.filter((r) => matchesDistrict(r, district));
}

/** Unique MLA names from `data/MLA Data_News`. */
export function listMlaNames(): string[] {
  const dir = path.join(DATA_ROOT, "MLA Data_News");
  const pattern = SOURCES.find((s) => s.sourceType === "mla")!.pattern;
  if (!fs.existsSync(dir)) return [];
  const names = new Set<string>();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".xlsx"))) {
    const m = file.match(pattern);
    if (m) names.add(canonicalizeMlaName(m[1]));
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** Print records for a single MP from `data/MP Data_News`. */
export function loadMpPrintRecords(mpName?: string | null): PrintRecord[] {
  const { records, mpByKey } = ensureCache();
  if (!mpName) return records.filter((r) => r.sourceType === "mp");
  return lookupMpPrint(mpByKey, mpName);
}

/** Print records for a single MLA from `data/MLA Data_News`. */
export function loadMlaPrintRecords(mlaName?: string | null): PrintRecord[] {
  const { records, mlaByKey } = ensureCache();
  if (!mlaName) return records.filter((r) => r.sourceType === "mla");
  return lookupMlaPrint(mlaByKey, mlaName);
}

/** Constituency-only print (used by constituency page). */
export function loadConstituencyPrintRecords(
  constituency?: string | null,
): PrintRecord[] {
  const all = loadAllPrintRecords().filter((r) => r.sourceType === "constituency");
  if (!constituency || constituency === "All") return all;
  const resolved = resolveConstituencyToken(constituency) ?? constituency;
  return all.filter((r) => r.scope === resolved);
}

/** Print counts per known UP district (district + constituency sources). */
export function printCountsByDistrict(): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of loadAllPrintRecords()) {
    if (r.sourceType === "mp" || r.sourceType === "mla") continue;
    if (!isKnownDistrict(r.scope) && r.sourceType === "district") continue;
    const district =
      r.sourceType === "district" && isKnownDistrict(r.scope)
        ? r.scope
        : isKnownDistrict(r.scope)
          ? r.scope
          : null;
    if (!district) continue;
    map.set(district, (map.get(district) ?? 0) + 1);
  }
  return map;
}
