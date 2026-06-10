import "server-only";
import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import {
  endOfCalendarDay,
  formatCalendarDate,
  startOfCalendarDay,
} from "./dates";
import { resolveConstituencyToken } from "./print-parser";
import { mpNamesMatch, resolveMpBioRecord } from "./mp-name-matching";
import type {
  MediaRecord,
  MediaType,
  Sentiment,
  RepType,
  GlobalFilters,
} from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "media-data.xlsx");
const GEO_PATH = path.join(
  process.cwd(),
  "public",
  "geo",
  "up-districts.geojson",
);

/**
 * Maps the dataset's keyword-derived district names to the names used inside
 * the bundled UP GeoJSON (public/geo/up-districts.geojson).
 */
const DISTRICT_TO_GEO: Record<string, string> = {
  Kanpur: "Kanpur Nagar",
};

/** Common spellings in the Keyword column → canonical GeoJSON district name. */
const DISTRICT_ALIASES: Record<string, string> = {
  badaun: "Budaun",
  budaun: "Budaun",
  raebareli: "Rae Bareli",
  "rae bareli": "Rae Bareli",
  shravasti: "Shrawasti",
  kanpurdehat: "Kanpur Dehat",
  "kanpur dehat": "Kanpur Dehat",
  bagpat: "Baghpat",
  baghpat: "Baghpat",
  bulandshahar: "Bulandshahr",
  bulandshahr: "Bulandshahr",
  "gautam buddha nagar": "Gautam Buddha Nagar",
  "gautam buddhanagar": "Gautam Buddha Nagar",
  gbnagar: "Gautam Buddha Nagar",
  "sant kabir nagar": "Sant Kabir Nagar",
  "santkabir nagar": "Sant Kabir Nagar",
  sknagar: "Sant Kabir Nagar",
  ambedkarnagar: "Ambedkar Nagar",
  "ambedkar nagar": "Ambedkar Nagar",
  sidharthnagar: "Siddharthnagar",
  siddharthnagar: "Siddharthnagar",
  prayagraj: "Prayagraj",
  ayodhya: "Ayodhya",
  gorakhpur: "Gorakhpur",
  lucknow: "Lucknow",
  varanasi: "Varanasi",
  meerut: "Meerut",
  basti: "Basti",
  bahraich: "Bahraich",
  gonda: "Gonda",
  agra: "Agra",
  bijnor: "Bijnor",
  ballia: "Ballia",
  barabanki: "Barabanki",
  bareilly: "Bareilly",
  balrampur: "Balrampur",
  chandauli: "Chandauli",
  azamgarh: "Azamgarh",
  farrukhabad: "Farrukhabad",
  farukhabad: "Farrukhabad",
  farukkhabad: "Farrukhabad",
  kanpur: "Kanpur Nagar",
  firozabad: "Firozabad",
  firozabd: "Firozabad",
};

export function toGeoName(district: string): string {
  return DISTRICT_TO_GEO[district] ?? district;
}

/** True when `district` is a real UP district (not a person name or empty). */
export function isKnownDistrict(district: string | null | undefined): boolean {
  if (!district?.trim()) return false;
  const trimmed = district.trim();
  const lookup = getDistrictLookup();
  const lower = trimmed.toLowerCase();
  if (lookup.has(lower) || lookup.has(lower.replace(/\s+/g, ""))) return true;
  return knownDistrictNames?.has(trimmed) ?? false;
}

/**
 * Known UP district names (lowercase -> canonical), loaded once from the
 * bundled GeoJSON. Used to detect the district inside Keyword tags for
 * person-linked mentions (e.g. "Narendra Modi +Varanasi,Lok Sabha,...").
 */
let districtLookup: Map<string, string> | null = null;
/** Canonical UP district names (values from lookup), for `isKnownDistrict`. */
let knownDistrictNames: Set<string> | null = null;

function getDistrictLookup(): Map<string, string> {
  if (districtLookup) return districtLookup;
  const map = new Map<string, string>();
  try {
    const geo = JSON.parse(fs.readFileSync(GEO_PATH, "utf8")) as {
      features: { properties: { district?: string } }[];
    };
    for (const f of geo.features) {
      const name = f.properties?.district;
      if (!name) continue;
      const lower = name.toLowerCase();
      map.set(lower, name);
      // "Kanpur Dehat" -> kanpurdehat, "Rae Bareli" -> raebareli
      map.set(lower.replace(/\s+/g, ""), name);
    }
  } catch {
    // GeoJSON missing — district-from-tags detection is simply skipped.
  }
  // Dataset / spelling aliases → canonical GeoJSON names.
  for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
    const key = alias.toLowerCase();
    map.set(key, canonical);
    map.set(key.replace(/\s+/g, ""), canonical);
    const canonLower = canonical.toLowerCase();
    map.set(canonLower, canonical);
    map.set(canonLower.replace(/\s+/g, ""), canonical);
  }
  districtLookup = map;
  knownDistrictNames = new Set(map.values());
  return districtLookup;
}

/* --------------------------- Field normalizers --------------------------- */

function normalizeMediaType(channel: unknown): MediaType {
  const c = String(channel ?? "").trim().toLowerCase();
  if (c.includes("youtube") || c.includes("you tube")) return "YouTube";
  if (c.includes("twitter") || c === "x") return "X";
  // Web, Reddit, news sites and anything else are treated as Online media.
  return "Online";
}

function normalizeSentiment(value: unknown): Sentiment {
  const s = String(value ?? "").trim().toLowerCase();
  if (s.startsWith("pos")) return "Positive";
  if (s.startsWith("neg")) return "Negative";
  return "Neutral";
}

/**
 * Splits a Keyword value into its leading token (before "+") and the list of
 * tag tokens that follow it (split on commas).
 *   "Narendra Modi +Varanasi,Lok Sabha,BJP" ->
 *     { lead: "Narendra Modi", tags: ["Varanasi", "Lok Sabha", "BJP"] }
 */
function splitKeyword(keyword: unknown): { lead: string; tags: string[] } {
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

/**
 * Classifies a Keyword value into a linked person.
 *
 * - "...MLA / Member of the Legislative Assembly..."  -> MLA
 * - "...Rajya Sabha..."                                -> Rajya Sabha MP
 * - "...Lok Sabha / Member of Lok Sabha..."            -> Lok Sabha MP
 * - anything else (only a district / state name)       -> not a person
 *
 * The person's name is the leading token before the first "+".
 */
function classifyEntity(keyword: unknown): {
  entityName: string | null;
  entityType: RepType | null;
} {
  const { lead, tags } = splitKeyword(keyword);
  if (!lead) return { entityName: null, entityType: null };
  const t = tags.join(",").toLowerCase();
  let entityType: RepType | null = null;
  if (/member of the legislative assembly|\bmla\b/.test(t)) entityType = "MLA";
  else if (/rajya sabha/.test(t)) entityType = "Rajya Sabha MP";
  else if (/lok sabha|member of lok sabha|member or parliament/.test(t))
    entityType = "Lok Sabha MP";
  return entityType
    ? { entityName: lead, entityType }
    : { entityName: null, entityType: null };
}

/** Resolves a raw district label to the canonical UP district name, if known. */
export function resolveDistrictName(token: string): string {
  const lookup = getDistrictLookup();
  const resolved = resolveDistrictToken(token.trim(), lookup);
  return resolved ?? token.trim().replace(/\s+/g, " ");
}

/** Resolves a token (lead or tag) to a canonical UP district name, if known. */
function resolveDistrictToken(token: string, lookup: Map<string, string>): string | null {
  const t = token.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  return lookup.get(lower) ?? lookup.get(lower.replace(/\s+/g, "")) ?? null;
}

/**
 * Resolves the UP district for a mention from its Keyword.
 *
 * - General news ("Prayagraj +BJP,...") -> the leading token is the district.
 * - Person-linked news ("Narendra Modi +Varanasi,...") -> district from tags only
 *   (never the person's name).
 * - Person-linked news without a district in tags -> empty (excluded from district views).
 */
/**
 * Resolves the Lok Sabha constituency for a mention.
 * Prefers an explicit `constituency` column; otherwise derives from Keyword tags.
 */
function constituencyFromTags(tags: string[]): string {
  for (const tag of tags) {
    const hit = resolveConstituencyToken(tag);
    if (hit) return hit;
  }
  return "";
}

function extractConstituency(
  keyword: unknown,
  explicit: unknown,
): string {
  const fromColumn = str(explicit);
  if (fromColumn) {
    return resolveConstituencyToken(fromColumn) ?? fromColumn;
  }

  const { lead, tags } = splitKeyword(keyword);
  if (!lead) return "";

  const entity = classifyEntity(keyword);
  if (entity.entityType === "Lok Sabha MP") {
    const fromTags = constituencyFromTags(tags);
    if (fromTags) return fromTags;
    return resolveMpBioRecord(entity.entityName)?.constituency ?? "";
  }

  const fromLead = resolveConstituencyToken(lead);
  if (fromLead) return fromLead;

  const fromTags = constituencyFromTags(tags);
  if (fromTags) return fromTags;

  // District-named leads/tags that share a Lok Sabha constituency name (e.g. Agra).
  const district = extractDistrict(keyword);
  if (district) {
    const hit = resolveConstituencyToken(district);
    if (hit) return hit;
  }

  return "";
}

function extractDistrict(keyword: unknown): string {
  const { lead, tags } = splitKeyword(keyword);
  if (!lead) return "";
  const lookup = getDistrictLookup();
  const entity = classifyEntity(keyword);

  const fromTags = (): string | null => {
    for (const tag of tags) {
      const hit = resolveDistrictToken(tag, lookup);
      if (hit) return hit;
    }
    return null;
  };

  if (entity.entityType) {
    return fromTags() ?? "";
  }

  return resolveDistrictToken(lead, lookup) ?? "";
}

function num(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

/**
 * Excel in this dataset displays dates as DD/MM/YYYY (often with time), but the
 * xlsx library can interpret stored values as MM/DD when `cellDates: true`.
 * Parse the formatted cell text instead.
 */
const INDIAN_DATE_RE =
  /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

function parseIndianDateString(value: string): number | null {
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

/** Reads Excel's displayed date strings (column `w`) in sheet row order. */
function readFormattedDateColumn(
  ws: XLSX.WorkSheet,
  columnName: string,
): string[] {
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

  const out: string[] = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: dateCol })];
    out.push(cell?.w ? String(cell.w) : "");
  }
  return out;
}

/** Converts a Date cell to ms; prefers DD/MM/YYYY formatted text from Excel. */
function parseDate(value: unknown): number | null {
  if (typeof value === "string") {
    const fromIndian = parseIndianDateString(value);
    if (fromIndian !== null) return fromIndian;
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
      return Number.isNaN(d.getTime()) ? null : d.getTime();
    }
  }
  return null;
}

function buildHeadline(title: unknown, content: unknown): string {
  const t = str(title);
  if (t) return t;
  const c = str(content) ?? "";
  if (!c) return "(No headline)";
  return c.length > 120 ? `${c.slice(0, 117)}…` : c;
}

/* ------------------------------ Language --------------------------------- */

/** Exclude rows with missing or placeholder language from all media views. */
export function isKnownLanguage(language: string | null | undefined): boolean {
  const v = language?.trim();
  if (!v) return false;
  return v.toLowerCase() !== "unknown";
}

/* ------------------------------ Cache layer ------------------------------ */

/** Bump when district parsing / lookup logic changes to invalidate stale cache. */
const PARSER_CACHE_VERSION = 8;

interface ParsedCache {
  mtimeMs: number;
  version: number;
  records: MediaRecord[];
}

let cache: ParsedCache | null = null;

/** Clears in-memory Excel parse cache (e.g. after data or parser updates). */
export function clearRecordsCache(): void {
  cache = null;
  districtLookup = null;
  knownDistrictNames = null;
}

export function dataFileExists(): boolean {
  return fs.existsSync(DATA_PATH);
}

/**
 * Reads & normalizes the Excel file. Results are cached and only re-parsed
 * when the underlying file changes (mtime), keeping API routes fast.
 */
export function loadRecords(): MediaRecord[] {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(
      `Data file not found at ${DATA_PATH}. Place your Excel file at /data/media-data.xlsx`,
    );
  }
  const stat = fs.statSync(DATA_PATH);
  if (
    cache &&
    cache.mtimeMs === stat.mtimeMs &&
    cache.version === PARSER_CACHE_VERSION
  ) {
    return cache.records;
  }

  // Read the file ourselves (Node fs) and parse the buffer. This avoids the
  // bundled `xlsx` build failing to lazily require `fs` under Turbopack.
  const buffer = fs.readFileSync(DATA_PATH);
  // Keep cellDates off — serial/Date values may be MM/DD while cells display DD/MM/YYYY.
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  // Prefer a sheet named "mentions", otherwise use the first sheet.
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === "mentions") ??
    wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const formattedDates = readFormattedDateColumn(ws, "Date");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: true,
  });

  const records: MediaRecord[] = rows
    .map((row, idx) => {
    const dateRaw = formattedDates[idx]?.trim() || row["Date"];
    const ts = parseDate(dateRaw);
    const district = extractDistrict(row["Keyword"]);
    const constituency = extractConstituency(
      row["Keyword"],
      row["constituency"] ?? row["Constituency"],
    );
    const { entityName, entityType } = classifyEntity(row["Keyword"]);
    const language = str(row["Language"]) ?? "Unknown";
    return {
      id: String(row["ID"] ?? `row-${idx}`),
      mediaType: normalizeMediaType(row["Channel"]),
      rawChannel: String(row["Channel"] ?? "").trim(),
      category: str(row["Category"]),
      profile: str(row["Profile"]),
      profileVisits: numOrNull(row["Profile Visits (Web only)"]),
      profileUsers: numOrNull(row["Profile Users (Web only)"]),
      language,
      followersRank: numOrNull(row["Followers/Rank"]),
      totalEngagement: num(row["Total Engagement"]),
      totalEngagementWithViews: num(row["Total Engagement with views"]),
      likes: num(row["Likes"]),
      comments: num(row["Comments"]),
      shares: num(row["Shares"]),
      views: num(row["Views"]),
      impressions: num(row["Impressions"]),
      date: ts ? formatCalendarDate(ts) : null,
      timestamp: ts,
      sentiment: normalizeSentiment(row["Sentiment"]),
      headline: buildHeadline(row["Title"], row["Content"]),
      content: str(row["Content"]) ?? "",
      country: str(row["Country"]),
      location: str(row["Location"]),
      tracker: str(row["Tracker"]),
      district,
      constituency,
      keyword: str(row["Keyword"]) ?? "",
      url: str(row["Link"]) ?? "",
      entityName,
      entityType,
    };
  })
    .filter((r) => isKnownLanguage(r.language));

  cache = { mtimeMs: stat.mtimeMs, version: PARSER_CACHE_VERSION, records };
  return records;
}

/* ------------------------------ Filtering -------------------------------- */

export function filterRecords(
  records: MediaRecord[],
  filters: GlobalFilters,
): MediaRecord[] {
  const {
    district,
    constituency,
    mediaType,
    sentiment,
    language,
    search,
    dateFrom,
    dateTo,
    entity,
  } = filters;

  const fromTs = dateFrom ? startOfCalendarDay(dateFrom) : null;
  const toTs = dateTo ? endOfCalendarDay(dateTo) : null;
  const q = search?.trim().toLowerCase() ?? "";

  return records.filter((r) => {
    if (entity) {
      const entityMatch =
        r.entityName === entity ||
        ((r.entityType === "Lok Sabha MP" || r.entityType === "Rajya Sabha MP") &&
          mpNamesMatch(r.entityName, entity));
      if (!entityMatch) return false;
    }
    if (district && district !== "All" && r.district !== district) return false;
    if (constituency && constituency !== "All") {
      const resolved =
        resolveConstituencyToken(constituency) ?? constituency;
      if (r.constituency !== resolved) return false;
    }
    if (mediaType && mediaType !== "All" && r.mediaType !== mediaType)
      return false;
    if (sentiment && sentiment !== "All" && r.sentiment !== sentiment)
      return false;
    if (language && language !== "All" && r.language !== language) return false;
    if (fromTs !== null && (r.timestamp === null || r.timestamp < fromTs))
      return false;
    if (toTs !== null && (r.timestamp === null || r.timestamp > toTs))
      return false;
    if (q) {
      const hay = `${r.headline} ${r.content} ${r.profile ?? ""} ${
        r.keyword
      }`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
