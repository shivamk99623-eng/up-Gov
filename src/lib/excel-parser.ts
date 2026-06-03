import "server-only";
import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import type {
  MediaRecord,
  MediaType,
  Sentiment,
  GlobalFilters,
} from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "media-data.xlsx");

/**
 * Maps the dataset's keyword-derived district names to the names used inside
 * the bundled UP GeoJSON (public/geo/up-districts.geojson).
 */
const DISTRICT_TO_GEO: Record<string, string> = {
  Kanpur: "Kanpur Nagar",
};

export function toGeoName(district: string): string {
  return DISTRICT_TO_GEO[district] ?? district;
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
 * Keyword column looks like: "Prayagraj +BJP,Bharatiya Janata Party,..."
 * The district is the leading token before the first "+".
 */
function extractDistrict(keyword: unknown): string {
  const raw = String(keyword ?? "").trim();
  if (!raw) return "Unknown";
  const beforePlus = raw.split("+")[0].trim();
  const cleaned = beforePlus.split(",")[0].trim();
  return cleaned || "Unknown";
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

/** Converts an xlsx cell (Date object or Excel serial) to ms timestamp. */
function parseDate(value: unknown): number | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial date -> JS Date (1900 date system).
    const parsed = XLSX.SSF?.parse_date_code?.(value);
    if (parsed) {
      const d = new Date(
        Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S),
      );
      return d.getTime();
    }
  }
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : t;
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

/* ------------------------------ Cache layer ------------------------------ */

interface ParsedCache {
  mtimeMs: number;
  records: MediaRecord[];
}

let cache: ParsedCache | null = null;

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
  if (cache && cache.mtimeMs === stat.mtimeMs) {
    return cache.records;
  }

  // Read the file ourselves (Node fs) and parse the buffer. This avoids the
  // bundled `xlsx` build failing to lazily require `fs` under Turbopack.
  const buffer = fs.readFileSync(DATA_PATH);
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  // Prefer a sheet named "mentions", otherwise use the first sheet.
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === "mentions") ??
    wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: true,
  });

  const records: MediaRecord[] = rows.map((row, idx) => {
    const ts = parseDate(row["Date"]);
    const district = extractDistrict(row["Keyword"]);
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
      date: ts ? format(new Date(ts), "yyyy-MM-dd") : null,
      timestamp: ts,
      sentiment: normalizeSentiment(row["Sentiment"]),
      headline: buildHeadline(row["Title"], row["Content"]),
      content: str(row["Content"]) ?? "",
      country: str(row["Country"]),
      location: str(row["Location"]),
      tracker: str(row["Tracker"]),
      district,
      keyword: str(row["Keyword"]) ?? "",
      url: str(row["Link"]) ?? "",
    };
  });

  cache = { mtimeMs: stat.mtimeMs, records };
  return records;
}

/* ------------------------------ Filtering -------------------------------- */

export function filterRecords(
  records: MediaRecord[],
  filters: GlobalFilters,
): MediaRecord[] {
  const {
    district,
    mediaType,
    sentiment,
    language,
    search,
    dateFrom,
    dateTo,
  } = filters;

  const fromTs = dateFrom ? Date.parse(dateFrom) : null;
  const toTs = dateTo ? Date.parse(dateTo) + 24 * 60 * 60 * 1000 - 1 : null;
  const q = search?.trim().toLowerCase() ?? "";

  return records.filter((r) => {
    if (district && district !== "All" && r.district !== district) return false;
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
