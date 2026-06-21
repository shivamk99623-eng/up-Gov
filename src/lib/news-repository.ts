import "server-only";
import { endOfCalendarDay, startOfCalendarDay } from "./dates";
import { resolveConstituencyToken } from "./constituency-lookup";
import { isKnownDistrict, resolveDistrictName, toGeoName } from "./geo";
import {
  jsonArrayContains,
  parseDistrictNames,
  parseJsonStringArray,
} from "./json-fields";
import { mpNamesMatch } from "./mp-name-matching";
import { getDb } from "./db";
import {
  columnsForKind,
  isKnownLanguage,
  PRINT_ROW_COLUMNS,
  rowToOnlineRecord,
  rowToPrintRecord,
  rowToXRecord,
  rowToYouTubeRecord,
  tableForKind,
  type DigitalMediaKind,
  type RawNewsRow,
  type TableKind,
} from "./news-mapper";
import type {
  GlobalFilters,
  MediaRecord,
  MediaType,
  OnlineRecord,
  PrintRecord,
  SortDirection,
  XRecord,
  YouTubeRecord,
} from "./types";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface QueryListResult<T> {
  total: number;
  records: T[];
  page?: number;
  limit?: number;
  totalPages?: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export function normalizePagination(
  pageRaw?: string | null,
  limitRaw?: string | null,
): PaginationParams {
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(limitRaw ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );
  return { page, limit };
}

export function paginateMeta(
  total: number,
  pagination: PaginationParams,
): Pick<QueryListResult<never>, "page" | "limit" | "totalPages"> {
  return {
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
  };
}

function tableExists(name: string): boolean {
  return !!getDb()
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
}

function fetchRows(kind: TableKind): RawNewsRow[] {
  const table = tableForKind(kind);
  if (!tableExists(table)) return [];
  const columnSql =
    kind === "Print" ? PRINT_ROW_COLUMNS : columnsForKind(kind as DigitalMediaKind);
  return getDb()
    .prepare(`SELECT ${columnSql} FROM "${table}"`)
    .all() as RawNewsRow[];
}

function mapRow<T>(kind: TableKind, row: RawNewsRow): T {
  if (kind === "Print") return rowToPrintRecord(row) as T;
  if (kind === "YouTube") return rowToYouTubeRecord(row) as T;
  if (kind === "X") return rowToXRecord(row) as T;
  return rowToOnlineRecord(row) as T;
}

function rowMatchesDistrict(row: RawNewsRow, district: string): boolean {
  const canonical = resolveDistrictName(district);
  const geo = toGeoName(canonical);
  const names = parseDistrictNames(row.District).map(resolveDistrictName);
  return names.some(
    (d) => d === canonical || d === geo || toGeoName(d) === geo,
  );
}

function rowMatchesConstituency(row: RawNewsRow, constituency: string): boolean {
  const resolved = resolveConstituencyToken(constituency) ?? constituency;
  return parseJsonStringArray(row.Constituency).some(
    (c) => (resolveConstituencyToken(c) ?? c) === resolved,
  );
}

function rowMatchesEntity(row: RawNewsRow, entity: string): boolean {
  if (jsonArrayContains(row.MLA, entity)) return true;
  const lok = parseJsonStringArray(row.Loksabha_MP);
  const raj = parseJsonStringArray(row.Rajyasabha_MP);
  return (
    lok.some((n) => mpNamesMatch(n, entity)) ||
    raj.some((n) => mpNamesMatch(n, entity))
  );
}

function rowMatchesFilters(
  row: RawNewsRow,
  filters: GlobalFilters,
  options?: { skipDistrict?: boolean },
): boolean {
  const {
    district,
    constituency,
    sentiment,
    language,
    search,
    dateFrom,
    dateTo,
    entity,
  } = filters;

  if (entity && !rowMatchesEntity(row, entity)) return false;

  if (!options?.skipDistrict && district && district !== "All") {
    if (!rowMatchesDistrict(row, district)) return false;
  }

  if (constituency && constituency !== "All") {
    if (!rowMatchesConstituency(row, constituency)) return false;
  }

  if (sentiment && sentiment !== "All") {
    const s = String(row.Sentiment ?? "").trim().toLowerCase();
    const want = sentiment.toLowerCase();
    if (want.startsWith("pos") && !s.startsWith("pos")) return false;
    if (want.startsWith("neg") && !s.startsWith("neg")) return false;
    if (want === "neutral" && s.startsWith("pos")) return false;
    if (want === "neutral" && s.startsWith("neg")) return false;
  }

  if (language && language !== "All") {
    if ((row.Language ?? "").trim() !== language) return false;
  }

  if (dateFrom || dateTo) {
    const ts = row.CreatedAt ? Date.parse(row.CreatedAt) : NaN;
    if (Number.isNaN(ts)) return false;
    if (dateFrom && ts < startOfCalendarDay(dateFrom)) return false;
    if (dateTo && ts > endOfCalendarDay(dateTo)) return false;
  }

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    const hay = [
      row.Heading,
      row.Content,
      row.Summary,
      row.Authors,
      row.Publication,
      row.Edition,
      row.channel,
      row.website,
      row.handles,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

function rowMatchesPrintSource(
  row: RawNewsRow,
  printSource: GlobalFilters["printSource"],
  entity: string | null | undefined,
): boolean {
  if (!printSource) return true;
  if (printSource === "district") {
    return parseDistrictNames(row.District).length > 0;
  }
  if (printSource === "mla") {
    const mla = parseJsonStringArray(row.MLA);
    if (!mla.length) return false;
    if (entity) return mla.some((n) => n === entity);
    return true;
  }
  if (printSource === "mp") {
    const lok = parseJsonStringArray(row.Loksabha_MP);
    const raj = parseJsonStringArray(row.Rajyasabha_MP);
    if (!lok.length && !raj.length) return false;
    if (entity) {
      return (
        lok.some((n) => mpNamesMatch(n, entity)) ||
        raj.some((n) => mpNamesMatch(n, entity))
      );
    }
    return true;
  }
  return true;
}

type SortValue = string | number | null;

const PRINT_SORT: Record<string, (r: PrintRecord) => SortValue> = {
  headline: (r) => r.headline,
  publication: (r) => r.publication,
  edition: (r) => r.edition,
  date: (r) => r.date ?? "",
  pageNo: (r) => String(r.pageNo ?? ""),
  sentiment: (r) => r.sentiment,
  language: (r) => r.language,
  author: (r) => r.author,
  ccm: (r) => r.ccm ?? "",
};

const DIGITAL_SORT: Record<string, (r: MediaRecord) => SortValue> = {
  headline: (r) => r.headline,
  date: (r) => r.timestamp ?? 0,
  sentiment: (r) => r.sentiment,
  language: (r) => r.language,
  profile: (r) => r.profile ?? "",
  channel: (r) => r.rawChannel,
  publisher: (r) => r.profile ?? "",
  location: (r) => r.location ?? "",
  content: (r) => r.content,
  views: (r) => r.views,
  likes: (r) => r.likes,
  comments: (r) => r.comments,
  shares: (r) => r.shares,
  engagement: (r) => r.totalEngagement,
};

function compareSortValues(a: SortValue, b: SortValue, dir: number): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * dir;
  return String(a).localeCompare(String(b)) * dir;
}

function sortRecords<T extends { date?: string | null; timestamp?: number | null }>(
  kind: TableKind,
  records: T[],
  sortBy?: string | null,
  sortDir?: SortDirection | null,
): T[] {
  const map =
    kind === "Print"
      ? (PRINT_SORT as unknown as Record<string, (r: T) => SortValue>)
      : (DIGITAL_SORT as unknown as Record<string, (r: T) => SortValue>);
  const col = sortBy && map[sortBy] ? sortBy : "date";
  const dir = sortDir === "asc" ? 1 : -1;
  const getter = map[col] ?? map.date;
  return [...records].sort((a, b) => compareSortValues(getter(a), getter(b), dir));
}

function queryTableRecords<
  T extends { date?: string | null; timestamp?: number | null },
>(
  kind: TableKind,
  filters: GlobalFilters = {},
  options?: { skipDistrict?: boolean; pagination?: PaginationParams },
): QueryListResult<T> {
  const matched: T[] = [];

  for (const row of fetchRows(kind)) {
    if (!isKnownLanguage(row.Language)) continue;
    if (!rowMatchesFilters(row, filters, options)) continue;

    if (kind === "Print") {
      if (!rowMatchesPrintSource(row, filters.printSource, filters.entity)) {
        continue;
      }
      if (filters.printSource === "district" && filters.district) {
        const record = rowToPrintRecord(row);
        if (
          record.sourceType !== "district" &&
          record.sourceType !== "constituency" &&
          !rowMatchesDistrict(row, filters.district)
        ) {
          continue;
        }
      }
      if (filters.entity && filters.printSource === "mla") {
        if (!jsonArrayContains(row.MLA, filters.entity)) continue;
      }
    }

    matched.push(mapRow<T>(kind, row));
  }

  const sorted = sortRecords(
    kind,
    matched,
    filters.sortBy,
    filters.sortDir,
  );
  const total = sorted.length;

  if (options?.pagination) {
    const { page, limit } = options.pagination;
    const start = (page - 1) * limit;
    return {
      total,
      records: sorted.slice(start, start + limit),
      ...paginateMeta(total, options.pagination),
    };
  }

  return { total, records: sorted };
}

export function queryPrintRecords(
  filters: GlobalFilters = {},
  options?: { pagination?: PaginationParams },
): QueryListResult<PrintRecord> {
  return queryTableRecords<PrintRecord>("Print", filters, options);
}

export function queryYouTubeRecords(
  filters: GlobalFilters = {},
  options?: { skipDistrict?: boolean; pagination?: PaginationParams },
): QueryListResult<YouTubeRecord> {
  return queryTableRecords<YouTubeRecord>("YouTube", filters, options);
}

export function queryXRecords(
  filters: GlobalFilters = {},
  options?: { skipDistrict?: boolean; pagination?: PaginationParams },
): QueryListResult<XRecord> {
  return queryTableRecords<XRecord>("X", filters, options);
}

export function queryOnlineRecords(
  filters: GlobalFilters = {},
  options?: { skipDistrict?: boolean; pagination?: PaginationParams },
): QueryListResult<OnlineRecord> {
  return queryTableRecords<OnlineRecord>("Online", filters, options);
}

/** Legacy combined digital query — prefer explicit table queries. */
export function queryDigitalMedia(
  filters: GlobalFilters & { mediaType?: MediaType | "All" | null },
  options?: { skipDistrict?: boolean; pagination?: PaginationParams },
): QueryListResult<MediaRecord> {
  const kinds: DigitalMediaKind[] =
    !filters.mediaType || filters.mediaType === "All"
      ? ["YouTube", "X", "Online"]
      : [filters.mediaType as DigitalMediaKind];

  let matched: MediaRecord[] = [];
  for (const kind of kinds) {
    const result = queryTableRecords<MediaRecord>(kind, filters, {
      skipDistrict: options?.skipDistrict,
    });
    matched = matched.concat(result.records);
  }

  const sorted = sortRecords(
    "YouTube",
    matched,
    filters.sortBy,
    filters.sortDir,
  );
  const total = sorted.length;

  if (options?.pagination) {
    const { page, limit } = options.pagination;
    const start = (page - 1) * limit;
    return {
      total,
      records: sorted.slice(start, start + limit),
      ...paginateMeta(total, options.pagination),
    };
  }

  return { total, records: sorted };
}

export function printCountsByDistrict(): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of fetchRows("Print")) {
    const districts = parseDistrictNames(row.District).map(resolveDistrictName);
    for (const d of districts) {
      if (!isKnownDistrict(d)) continue;
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    const { sourceType, scope } = rowToPrintRecord(row);
    if (sourceType === "district" && isKnownDistrict(scope)) {
      map.set(scope, (map.get(scope) ?? 0) + 1);
    }
  }
  return map;
}

export function listDistrictNamesFromNews(): string[] {
  const set = new Set<string>();
  const tables = [tableForKind("Print"), "news_youtube", "news_x", "news_online"];
  for (const table of tables) {
    if (!tableExists(table)) continue;
    const rows = getDb()
      .prepare(`SELECT "District" AS d FROM "${table}" WHERE "District" IS NOT NULL`)
      .all() as { d: string }[];
    for (const { d } of rows) {
      for (const name of parseDistrictNames(d).map(resolveDistrictName)) {
        if (isKnownDistrict(name)) set.add(name);
      }
    }
  }
  return [...set].sort();
}

export function listLanguagesFromNews(): string[] {
  const set = new Set<string>();
  const tables = [tableForKind("Print"), "news_youtube", "news_x", "news_online"];
  for (const table of tables) {
    if (!tableExists(table)) continue;
    const rows = getDb()
      .prepare(
        `SELECT DISTINCT "Language" AS lang FROM "${table}" WHERE "Language" IS NOT NULL`,
      )
      .all() as { lang: string }[];
    for (const { lang } of rows) {
      if (isKnownLanguage(lang)) set.add(lang.trim());
    }
  }
  return [...set].sort();
}

export function buildPrintCountIndex(
  source: "mla" | "mp",
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of fetchRows("Print")) {
    if (source === "mla") {
      for (const name of parseJsonStringArray(row.MLA)) {
        map.set(name, (map.get(name) ?? 0) + 1);
      }
      continue;
    }
    for (const name of [
      ...parseJsonStringArray(row.Loksabha_MP),
      ...parseJsonStringArray(row.Rajyasabha_MP),
    ]) {
      map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return map;
}

export function loadAllDigitalRecords() {
  return queryDigitalMedia({ mediaType: "All" }).records;
}
