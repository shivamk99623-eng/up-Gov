import "server-only";
import { endOfCalendarDay, startOfCalendarDay } from "./dates";
import { isKnownDistrict, listKnownDistricts, resolveDistrictName, toGeoName } from "./geo";
import {
  parseDistrictNames,
  parseJsonStringArray,
} from "./json-fields";
import { parseXEngagementsTotal } from "./engagement";
import {
  buildConstituencySqlFilter,
  buildDistrictSqlFilter,
  buildEntitySqlPrefilter,
  buildPrintSourceSqlFilter,
  buildSearchSqlPrefilter,
  entityColumnsForFilters,
} from "./sql-scope-filters";
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
  ConstituencyScope,
  DistrictSummary,
  GlobalFilters,
  MediaBreakdown,
  MediaRecord,
  MediaType,
  NameCount,
  OnlineRecord,
  PrintRecord,
  Sentiment,
  SentimentBreakdown,
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

/** Minimum token length for SQL text search (avoids full-table scans). */
export { MIN_SEARCH_TOKEN_LENGTH, normalizeSearchFilter } from "./search-filter";

/** YouTube stores real post timestamps in PostedTime; CreatedAt is often time-only. */
function timestampSqlColumn(kind: TableKind): string {
  return kind === "YouTube" ? '"PostedTime"' : '"CreatedAt"';
}

function buildIndexedWhere(filters: GlobalFilters): {
  clause: string;
  params: unknown[];
} {
  // Keep predicates index-friendly: avoid lower()/trim() on every row.
  // Language values in this DB are clean Title-Case names (no "unknown").
  const parts: string[] = [
    `"Language" IS NOT NULL`,
    `"Language" != ''`,
  ];
  const params: unknown[] = [];

  if (filters.language && filters.language !== "All") {
    parts.push(`"Language" = ?`);
    params.push(filters.language);
  }

  if (filters.sentiment && filters.sentiment !== "All") {
    const want = filters.sentiment.toLowerCase();
    if (want.startsWith("pos")) {
      parts.push(`"Sentiment" LIKE 'pos%' COLLATE NOCASE`);
    } else if (want.startsWith("neg")) {
      parts.push(`"Sentiment" LIKE 'neg%' COLLATE NOCASE`);
    } else {
      parts.push(
        `"Sentiment" NOT LIKE 'pos%' COLLATE NOCASE AND "Sentiment" NOT LIKE 'neg%' COLLATE NOCASE`,
      );
    }
  }

  return {
    clause: `WHERE ${parts.join(" AND ")}`,
    params,
  };
}

function emptySentimentBreakdown(): SentimentBreakdown {
  return { positive: 0, negative: 0, neutral: 0 };
}

function sentimentFromRow(value: unknown): Sentiment {
  const s = String(value ?? "").trim().toLowerCase();
  if (s.startsWith("pos")) return "Positive";
  if (s.startsWith("neg")) return "Negative";
  return "Neutral";
}

function filterScope(
  filters: GlobalFilters,
): ConstituencyScope {
  return filters.constituencyScope === "legislative" ? "legislative" : "parliamentary";
}

function buildSqlWhere(
  kind: TableKind,
  filters: GlobalFilters,
): { clause: string; params: unknown[] } {
  const { clause, params } = buildIndexedWhere(filters);
  const extras: string[] = [];
  const extraParams: unknown[] = [];
  const tsCol = timestampSqlColumn(kind);

  if (filters.dateFrom) {
    extras.push(`${tsCol} >= ?`);
    extraParams.push(new Date(startOfCalendarDay(filters.dateFrom)).toISOString());
  }

  if (filters.dateTo) {
    extras.push(`${tsCol} <= ?`);
    extraParams.push(new Date(endOfCalendarDay(filters.dateTo)).toISOString());
  }

  if (filters.district && filters.district !== "All") {
    const dist = buildDistrictSqlFilter(filters.district);
    extras.push(dist.sql);
    extraParams.push(...dist.params);
  }

  if (filters.constituency && filters.constituency !== "All") {
    const con = buildConstituencySqlFilter(filters.constituency, filterScope(filters));
    if (con) {
      extras.push(con.sql);
      extraParams.push(...con.params);
    } else {
      extras.push("1 = 0");
    }
  }

  if (kind === "Print") {
    const print = buildPrintSourceSqlFilter(filters);
    if (print) {
      extras.push(print.sql);
      extraParams.push(...print.params);
    }
  }

  if (filters.entity) {
    const pre = buildEntitySqlPrefilter(
      filters.entity,
      entityColumnsForFilters(filters),
      kind,
    );
    if (pre) {
      extras.push(pre.sql);
      extraParams.push(...pre.params);
    } else {
      extras.push("1 = 0");
    }
  }

  if (filters.search?.trim()) {
    const pre = buildSearchSqlPrefilter(filters.search, kind);
    if (pre) {
      extras.push(pre.sql);
      extraParams.push(...pre.params);
    } else {
      extras.push("1 = 0");
    }
  }

  if (!extras.length) return { clause, params };
  return {
    clause: `${clause} AND ${extras.join(" AND ")}`,
    params: [...params, ...extraParams],
  };
}

/** Constituency scope wins over district — matches analytics on the constituency page. */
export function applyConstituencyScope(filters: GlobalFilters): GlobalFilters {
  if (!filters.constituency || filters.constituency === "All") return filters;
  return { ...filters, district: null };
}

function mapRow<T>(kind: TableKind, row: RawNewsRow): T {
  if (kind === "Print") return rowToPrintRecord(row) as T;
  if (kind === "YouTube") return rowToYouTubeRecord(row) as T;
  if (kind === "X") return rowToXRecord(row) as T;
  return rowToOnlineRecord(row) as T;
}

const SORT_SQL_COLUMNS: Record<string, string> = {
  headline: '"Heading"',
  date: '"CreatedAt"',
  sentiment: '"Sentiment"',
  language: '"Language"',
  authors: '"Authors"',
  author: '"Authors"',
  publication: '"Publication"',
  edition: '"Edition"',
  channel: '"channel"',
  handles: '"handles"',
  website: '"website"',
  publisher: '"website"',
};

function queryTableRecordsSql<T extends { date?: string | null; timestamp?: number | null }>(
  kind: TableKind,
  filters: GlobalFilters,
  pagination: PaginationParams,
): QueryListResult<T> {
  const table = tableForKind(kind);
  if (!tableExists(table)) {
    return { total: 0, records: [], ...paginateMeta(0, pagination) };
  }
  const { clause, params } = buildSqlWhere(kind, filters);
  const db = getDb();
  const total = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM "${table}" ${clause}`)
      .get(...params) as { c: number }
  ).c;

  const sortCol =
    filters.sortBy === "date"
      ? timestampSqlColumn(kind)
      : filters.sortBy && SORT_SQL_COLUMNS[filters.sortBy]
        ? SORT_SQL_COLUMNS[filters.sortBy]
        : timestampSqlColumn(kind);
  const sortDir = filters.sortDir === "asc" ? "ASC" : "DESC";
  const columns =
    kind === "Print" ? PRINT_ROW_COLUMNS : columnsForKind(kind as DigitalMediaKind);
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const rows = db
    .prepare(
      `SELECT ${columns} FROM "${table}" ${clause} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as RawNewsRow[];

  return {
    total,
    records: rows.map((row) => mapRow<T>(kind, row)),
    ...paginateMeta(total, pagination),
  };
}

/** One table scan for counts, sentiment, and daily trend. */
export function tableStatsSql(
  kind: TableKind,
  filters: GlobalFilters = {},
): { total: number; sentiment: SentimentBreakdown; dailyTrend: Map<string, number> } {
  const table = tableForKind(kind);
  if (!tableExists(table)) {
    return { total: 0, sentiment: emptySentimentBreakdown(), dailyTrend: new Map() };
  }
  const { clause, params } = buildSqlWhere(kind, applyConstituencyScope(filters));
  const tsCol = timestampSqlColumn(kind);
  const rows = getDb()
    .prepare(
      `SELECT "Sentiment" AS s, date(${tsCol}) AS d, COUNT(*) AS c
       FROM "${table}" ${clause}
       GROUP BY s, d`,
    )
    .all(...params) as { s: string; d: string | null; c: number }[];

  const sentiment = emptySentimentBreakdown();
  const dailyTrend = new Map<string, number>();
  let total = 0;
  for (const { s, d, c } of rows) {
    total += c;
    const bucket = sentimentFromRow(s);
    if (bucket === "Positive") sentiment.positive += c;
    else if (bucket === "Negative") sentiment.negative += c;
    else sentiment.neutral += c;
    if (d) dailyTrend.set(d, (dailyTrend.get(d) ?? 0) + c);
  }
  return { total, sentiment, dailyTrend };
}

/** SQL-only count + sentiment for the full filter set. */
export function countAndSentimentSql(
  kind: TableKind,
  filters: GlobalFilters = {},
): { total: number; sentiment: SentimentBreakdown } {
  const { total, sentiment } = tableStatsSql(kind, filters);
  return { total, sentiment };
}

/** SQL-only daily counts keyed by YYYY-MM-DD. */
export function dailyTrendCountsSql(
  kind: TableKind,
  filters: GlobalFilters = {},
): Map<string, number> {
  return tableStatsSql(kind, filters).dailyTrend;
}

export interface FilteredAggregateStats {
  total: number;
  sentiment: SentimentBreakdown;
  dailyTrend: Map<string, number>;
}

/** SQL-backed counts, sentiment, and daily trend for scoped filters. */
export function aggregateFilteredStats(
  kind: TableKind,
  filters: GlobalFilters = {},
): FilteredAggregateStats {
  const scoped = applyConstituencyScope(filters);
  const stats = tableStatsSql(kind, scoped);
  return {
    total: stats.total,
    sentiment: stats.sentiment,
    dailyTrend: stats.dailyTrend,
  };
}

function queryTableRecords<
  T extends { date?: string | null; timestamp?: number | null },
>(
  kind: TableKind,
  filters: GlobalFilters = {},
  options?: { pagination?: PaginationParams },
): QueryListResult<T> {
  const scopedFilters = applyConstituencyScope(filters);
  const pagination = options?.pagination ?? { page: 1, limit: MAX_LIMIT };
  return queryTableRecordsSql<T>(kind, scopedFilters, pagination);
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
  options?: { pagination?: PaginationParams },
): QueryListResult<MediaRecord> {
  const kinds: DigitalMediaKind[] =
    !filters.mediaType || filters.mediaType === "All"
      ? ["YouTube", "X", "Online"]
      : [filters.mediaType as DigitalMediaKind];

  if (kinds.length === 1) {
    return queryTableRecords<MediaRecord>(kinds[0]!, filters, options);
  }

  const scoped = applyConstituencyScope(filters);
  const pagination = options?.pagination ?? { page: 1, limit: DEFAULT_LIMIT };
  const fetchLimit = pagination.limit * pagination.page;
  let total = 0;
  let records: MediaRecord[] = [];

  for (const kind of kinds) {
    const result = queryTableRecordsSql<MediaRecord>(kind, scoped, {
      page: 1,
      limit: fetchLimit,
    });
    total += result.total;
    records = records.concat(result.records);
  }

  records.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  const start = (pagination.page - 1) * pagination.limit;
  return {
    total,
    records: records.slice(start, start + pagination.limit),
    ...paginateMeta(total, pagination),
  };
}

export interface EntityMediaStats {
  printTotal: number;
  digitalTotal: number;
  media: MediaBreakdown;
  sentiment: SentimentBreakdown;
  primaryDistrict: string | null;
  totalEngagement: number;
}

function pickPrimaryDistrict(counts: Map<string, number>): string | null {
  let best: string | null = null;
  let bestN = 0;
  for (const [d, n] of counts) {
    if (n > bestN) {
      best = d;
      bestN = n;
    }
  }
  return best;
}

function mergeSentimentBreakdown(
  target: SentimentBreakdown,
  source: SentimentBreakdown,
): void {
  target.positive += source.positive;
  target.negative += source.negative;
  target.neutral += source.neutral;
}

function queryPrimaryDistrictForEntity(
  filters: GlobalFilters,
): string | null {
  const { clause, params } = buildSqlWhere("Print", filters);
  const rows = getDb()
    .prepare(
      `SELECT "District" AS raw, COUNT(*) AS c
       FROM "${tableForKind("Print")}" ${clause}
       AND trim(coalesce("District", '')) NOT IN ('', '[]')
       GROUP BY raw ORDER BY c DESC LIMIT 25`,
    )
    .all(...params) as { raw: string; c: number }[];

  const counts = new Map<string, number>();
  for (const { raw, c } of rows) {
    for (const district of parseDistrictNames(raw).map(resolveDistrictName)) {
      if (!isKnownDistrict(district)) continue;
      counts.set(district, (counts.get(district) ?? 0) + c);
    }
  }
  return pickPrimaryDistrict(counts);
}

function queryEntityTotalEngagement(
  entity: string,
  extra: GlobalFilters = {},
): number {
  const filters = { ...extra, entity };
  const { clause: ytClause, params: ytParams } = buildSqlWhere("YouTube", filters);
  const ytRow = getDb()
    .prepare(
      `SELECT
         COALESCE(SUM(CAST(NULLIF(trim("Like_count"), '') AS INTEGER)), 0) AS likes,
         COALESCE(SUM(CAST(NULLIF(trim("Comment_count"), '') AS INTEGER)), 0) AS comments
       FROM "${tableForKind("YouTube")}" ${ytClause}`,
    )
    .get(...ytParams) as { likes: number; comments: number };

  const { clause: xClause, params: xParams } = buildSqlWhere("X", filters);
  const xRows = getDb()
    .prepare(
      `SELECT "Engagements" FROM "${tableForKind("X")}" ${xClause}
       AND trim(coalesce("Engagements", '')) != ''`,
    )
    .all(...xParams) as { Engagements: string }[];

  let xTotal = 0;
  for (const { Engagements } of xRows) {
    xTotal += parseXEngagementsTotal(Engagements);
  }

  return (ytRow.likes ?? 0) + (ytRow.comments ?? 0) + xTotal;
}

/** Aggregates linked print + digital coverage for an MLA/MP. */
export function queryEntityMediaStats(
  entity: string,
  printSource: "mla" | "mp",
  extra: GlobalFilters = {},
): EntityMediaStats {
  const filters = { ...extra, entity, printSource };
  const mt = extra.mediaType;
  const includeAll = !mt || mt === "All";
  const includePrint = includeAll || mt === "Print";
  const includeYouTube = includeAll || mt === "YouTube";
  const includeX = includeAll || mt === "X";
  const includeOnline = includeAll || mt === "Online";

  const printStats = includePrint
    ? countAndSentimentSql("Print", filters)
    : { total: 0, sentiment: emptySentimentBreakdown() };
  const youtubeStats = includeYouTube
    ? countAndSentimentSql("YouTube", filters)
    : { total: 0, sentiment: emptySentimentBreakdown() };
  const xStats = includeX
    ? countAndSentimentSql("X", filters)
    : { total: 0, sentiment: emptySentimentBreakdown() };
  const onlineStats = includeOnline
    ? countAndSentimentSql("Online", filters)
    : { total: 0, sentiment: emptySentimentBreakdown() };

  const media: MediaBreakdown = {
    print: printStats.total,
    youtube: youtubeStats.total,
    x: xStats.total,
    online: onlineStats.total,
  };
  const sentiment = emptySentimentBreakdown();
  mergeSentimentBreakdown(sentiment, printStats.sentiment);
  mergeSentimentBreakdown(sentiment, youtubeStats.sentiment);
  mergeSentimentBreakdown(sentiment, xStats.sentiment);
  mergeSentimentBreakdown(sentiment, onlineStats.sentiment);

  return {
    printTotal: media.print,
    digitalTotal: media.youtube + media.x + media.online,
    media,
    sentiment,
    primaryDistrict: includePrint
      ? queryPrimaryDistrictForEntity(filters)
      : null,
    totalEngagement: queryEntityTotalEngagement(entity, {
      ...extra,
      printSource,
    }),
  };
}

export function printCountsByDistrict(): Map<string, number> {
  const map = new Map<string, number>();
  const { clause, params } = buildSqlWhere("Print", {});
  const rows = getDb()
    .prepare(
      `SELECT "District" AS raw, COUNT(*) AS c
       FROM "${tableForKind("Print")}" ${clause}
       AND trim(coalesce("District", '')) NOT IN ('', '[]')
       GROUP BY raw`,
    )
    .all(...params) as { raw: string; c: number }[];

  for (const { raw, c } of rows) {
    for (const district of parseDistrictNames(raw).map(resolveDistrictName)) {
      if (!isKnownDistrict(district)) continue;
      map.set(district, (map.get(district) ?? 0) + c);
    }
  }
  return map;
}

export function listDistrictNamesFromNews(): string[] {
  return listKnownDistricts();
}

export type DashboardValueRollupMode = "authors" | "source" | "language";

function valueColumnForKind(
  kind: TableKind,
  mode: DashboardValueRollupMode,
): string | null {
  if (mode === "language") return '"Language"';
  if (mode === "source") {
    if (kind === "YouTube") return '"Channel"';
    if (kind === "X") return '"handles"';
    if (kind === "Online") return '"Website"';
    return null;
  }
  if (kind === "YouTube") return '"Channel"';
  if (kind === "X") return '"handles"';
  if (kind === "Online" || kind === "Print") return '"Authors"';
  return null;
}

/** SQL GROUP BY for dashboard profile/channel/language rollups. */
export function aggregateDashboardValueCounts(
  filters: GlobalFilters,
  mode: DashboardValueRollupMode,
  limit: number,
): NameCount[] {
  const scoped = applyConstituencyScope(filters);
  const map = new Map<string, number>();
  const kinds: TableKind[] =
    mode === "language"
      ? ["YouTube", "X", "Online", "Print"]
      : ["YouTube", "X", "Online"];

  for (const kind of kinds) {
    const table = tableForKind(kind);
    if (!tableExists(table)) continue;
    const column = valueColumnForKind(kind, mode);
    if (!column) continue;
    const { clause, params } = buildSqlWhere(kind, scoped);
    const rows = getDb()
      .prepare(
        `SELECT trim(${column}) AS name, COUNT(*) AS c
         FROM "${table}" ${clause}
         AND trim(coalesce(${column}, '')) != ''
         GROUP BY name
         ORDER BY c DESC
         LIMIT ?`,
      )
      .all(...params, limit * 2) as { name: string; c: number }[];

    for (const { name, c } of rows) {
      if (!name) continue;
      if (mode === "language" && !isKnownLanguage(name)) continue;
      map.set(name, (map.get(name) ?? 0) + c);
    }
  }

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function bumpDistrictSummary(
  map: Map<string, DistrictSummary>,
  district: string,
  kind: "print" | MediaType,
  sentiment: Sentiment,
  count: number,
): void {
  if (!isKnownDistrict(district) || count <= 0) return;
  let d = map.get(district);
  if (!d) {
    d = {
      district,
      dt_name: district.slice(0, 3),
      geoName: toGeoName(district),
      total: 0,
      print: 0,
      youtube: 0,
      x: 0,
      online: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
    };
    map.set(district, d);
  }
  d.total += count;
  if (kind === "print") d.print += count;
  else if (kind === "YouTube") d.youtube += count;
  else if (kind === "X") d.x += count;
  else d.online += count;
  if (sentiment === "Positive") d.positive += count;
  else if (sentiment === "Negative") d.negative += count;
  else d.neutral += count;
}

const DISTRICT_SUMMARY_CACHE_MS = 5 * 60_000;
const districtSummaryCache = new Map<
  string,
  { at: number; data: DistrictSummary[] }
>();

/** District rollup via SQL GROUP BY on raw District JSON (small grouped set). */
export function buildDashboardDistrictSummary(
  filters: GlobalFilters = {},
): DistrictSummary[] {
  const scoped = applyConstituencyScope(filters);
  const cacheKey = JSON.stringify(scoped);
  const hit = districtSummaryCache.get(cacheKey);
  if (hit && Date.now() - hit.at < DISTRICT_SUMMARY_CACHE_MS) {
    return hit.data;
  }

  const map = new Map<string, DistrictSummary>();

  for (const kind of ["YouTube", "X", "Online", "Print"] as const) {
    const table = tableForKind(kind);
    if (!tableExists(table)) continue;
    const { clause, params } = buildSqlWhere(kind, scoped);
    const rows = getDb()
      .prepare(
        `SELECT "District" AS raw, "Sentiment" AS s, COUNT(*) AS c
         FROM "${table}" ${clause}
         AND coalesce("District", '') NOT IN ('', '[]')
         GROUP BY raw, s`,
      )
      .all(...params) as { raw: string; s: string; c: number }[];

    for (const { raw, s, c } of rows) {
      const sentiment = sentimentFromRow(s);
      const mediaKind = kind === "Print" ? "print" : kind;
      for (const district of parseDistrictNames(raw).map(resolveDistrictName)) {
        bumpDistrictSummary(map, district, mediaKind, sentiment, c);
      }
    }
  }

  const result = [...map.values()].sort((a, b) => b.total - a.total);
  districtSummaryCache.set(cacheKey, { at: Date.now(), data: result });
  if (districtSummaryCache.size > 32) {
    const oldest = [...districtSummaryCache.entries()].sort(
      (a, b) => a[1].at - b[1].at,
    )[0]?.[0];
    if (oldest) districtSummaryCache.delete(oldest);
  }
  return result;
}

export function queryDigitalTimestampBounds(
  filters: GlobalFilters = {},
): { min: number | null; max: number | null } {
  const scoped = applyConstituencyScope(filters);
  let minTs: number | null = null;
  let maxTs: number | null = null;

  for (const kind of ["YouTube", "X", "Online"] as const) {
    const table = tableForKind(kind);
    if (!tableExists(table)) continue;
    const { clause, params } = buildSqlWhere(kind, scoped);
    const tsCol = timestampSqlColumn(kind);
    const row = getDb()
      .prepare(
        `SELECT MIN(${tsCol}) AS mn, MAX(${tsCol}) AS mx
         FROM "${table}" ${clause} AND ${tsCol} IS NOT NULL`,
      )
      .get(...params) as { mn: string | null; mx: string | null };

    for (const value of [row.mn, row.mx]) {
      if (!value) continue;
      const ts = Date.parse(value);
      if (Number.isNaN(ts)) continue;
      if (minTs === null || ts < minTs) minTs = ts;
      if (maxTs === null || ts > maxTs) maxTs = ts;
    }
  }

  return { min: minTs, max: maxTs };
}

/** Fetches a small page per digital table for dashboard top-news charts. */
export function queryTopDigitalRecords(
  filters: GlobalFilters,
  sentiment: Sentiment,
  limit: number,
): MediaRecord[] {
  const scoped = applyConstituencyScope({ ...filters, sentiment });
  const perKind = Math.max(limit, 20);
  const merged: MediaRecord[] = [];

  for (const kind of ["YouTube", "X", "Online"] as const) {
    const { records } = queryTableRecords<MediaRecord>(kind, scoped, {
      pagination: { page: 1, limit: perKind },
    });
    merged.push(...records);
  }

  return merged
    .filter((r) => r.sentiment === sentiment && !!r.link)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    .slice(0, limit);
}

export function buildPrintCountIndex(
  source: "mla" | "mp",
): Map<string, number> {
  const column = source === "mla" ? "MLA" : "Loksabha_MP";
  const map = new Map<string, number>();
  const { clause, params } = buildSqlWhere("Print", { printSource: source });
  const rows = getDb()
    .prepare(
      `SELECT "${column}" AS raw, COUNT(*) AS c
       FROM "${tableForKind("Print")}" ${clause}
       AND trim(coalesce("${column}", '')) NOT IN ('', '[]')
       GROUP BY raw`,
    )
    .all(...params) as { raw: string; c: number }[];

  for (const { raw, c } of rows) {
    for (const name of parseJsonStringArray(raw)) {
      map.set(name, (map.get(name) ?? 0) + c);
    }
  }

  if (source === "mp") {
    const rajRows = getDb()
      .prepare(
        `SELECT "Rajyasabha_MP" AS raw, COUNT(*) AS c
         FROM "${tableForKind("Print")}" ${clause}
         AND trim(coalesce("Rajyasabha_MP", '')) NOT IN ('', '[]')
         GROUP BY raw`,
      )
      .all(...params) as { raw: string; c: number }[];
    for (const { raw, c } of rajRows) {
      for (const name of parseJsonStringArray(raw)) {
        map.set(name, (map.get(name) ?? 0) + c);
      }
    }
  }

  return map;
}

export function loadAllDigitalRecords() {
  return queryDigitalMedia({ mediaType: "All" }, { pagination: { page: 1, limit: MAX_LIMIT } })
    .records;
}

export function listLanguagesFromNews(): string[] {
  // const set = new Set<string>();
  // const tables = [tableForKind("Print"), "news_youtube", "news_x", "news_online"];
  // for (const table of tables) {
  //   if (!tableExists(table)) continue;
  //   const rows = getDb()
  //     .prepare(
  //       `SELECT DISTINCT "Language" AS lang FROM "${table}" WHERE "Language" IS NOT NULL`,
  //     )
  //     .all() as { lang: string }[];
  //   for (const { lang } of rows) {
  //     if (isKnownLanguage(lang)) set.add(lang.trim());
  //   }
  // }
 let languages = [
    {
        "value": "assamese",
        "label": "Assamese",
        "count": 1363
    },
    {
        "value": "bengali",
        "label": "Bengali",
        "count": 3571
    },
    {
        "value": "english",
        "label": "English",
        "count": 68191
    },
    {
        "value": "gujarati",
        "label": "Gujarati",
        "count": 10273
    },
    {
        "value": "hindi",
        "label": "Hindi",
        "count": 110292
    },
    {
        "value": "kannada",
        "label": "Kannada",
        "count": 6038
    },
    {
        "value": "khasi",
        "label": "Khasi",
        "count": 179
    },
    {
        "value": "konkani",
        "label": "Konkani",
        "count": 80
    },
    {
        "value": "malayalam",
        "label": "Malayalam",
        "count": 1971
    },
    {
        "value": "marathi",
        "label": "Marathi",
        "count": 10169
    },
    {
        "value": "meitei",
        "label": "Meitei",
        "count": 587
    },
    {
        "value": "nepali",
        "label": "Nepali",
        "count": 695
    },
    {
        "value": "odia",
        "label": "Odia",
        "count": 6146
    },
    {
        "value": "punjabi",
        "label": "Punjabi",
        "count": 3644
    },
    {
        "value": "tamil",
        "label": "Tamil",
        "count": 2814
    },
    {
        "value": "telugu",
        "label": "Telugu",
        "count": 9421
    },
    {
        "value": "urdu",
        "label": "Urdu",
        "count": 2022
    }
]
  return languages.map(l => l.label).sort();
}
