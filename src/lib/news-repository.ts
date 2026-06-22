import "server-only";
import { endOfCalendarDay, startOfCalendarDay } from "./dates";
import { resolveConstituencyFilter, resolveConstituencyToken } from "./constituency-lookup";
import { constituencyDedupeKey } from "./constituency-detail";
import { isKnownDistrict, resolveDistrictName, toGeoName } from "./geo";
import {
  parseDistrictNames,
  parseJsonStringArray,
  parsePersonNameArray,
} from "./json-fields";
import { mpNamesMatch, mlaNamesMatch, personNamesMatch } from "./mp-name-matching";
import { entitySearchLikePatterns, matchesSemanticSearch } from "./name-search";
import { getDb } from "./db";
import {
  columnsForKind,
  isKnownLanguage,
  AGG_ROW_COLUMNS,
  ENTITY_STAT_ROW_COLUMNS,
  PRINT_DISTRICT_ONLY_COLUMNS,
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
  MediaBreakdown,
  MediaRecord,
  MediaType,
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

function buildIndexedWhere(filters: GlobalFilters): {
  clause: string;
  params: unknown[];
} {
  const parts: string[] = [
    `"Language" IS NOT NULL`,
    `trim("Language") != ''`,
    `lower(trim("Language")) != 'unknown'`,
  ];
  const params: unknown[] = [];

  if (filters.language && filters.language !== "All") {
    parts.push(`"Language" = ?`);
    params.push(filters.language);
  }

  if (filters.sentiment && filters.sentiment !== "All") {
    const want = filters.sentiment.toLowerCase();
    if (want.startsWith("pos")) {
      parts.push(`lower("Sentiment") LIKE 'pos%'`);
    } else if (want.startsWith("neg")) {
      parts.push(`lower("Sentiment") LIKE 'neg%'`);
    } else {
      parts.push(
        `lower("Sentiment") NOT LIKE 'pos%' AND lower("Sentiment") NOT LIKE 'neg%'`,
      );
    }
  }

  if (filters.dateFrom) {
    parts.push(`"CreatedAt" >= ?`);
    params.push(new Date(startOfCalendarDay(filters.dateFrom)).toISOString());
  }

  if (filters.dateTo) {
    parts.push(`"CreatedAt" <= ?`);
    params.push(new Date(endOfCalendarDay(filters.dateTo)).toISOString());
  }

  return {
    clause: `WHERE ${parts.join(" AND ")}`,
    params,
  };
}

type EntityPersonColumn = "MLA" | "Loksabha_MP" | "Rajyasabha_MP";

function entityColumnsForFilters(filters: GlobalFilters): EntityPersonColumn[] {
  if (filters.printSource === "mla") return ["MLA"];
  if (filters.printSource === "mp") return ["Loksabha_MP", "Rajyasabha_MP"];
  return ["MLA", "Loksabha_MP", "Rajyasabha_MP"];
}

function buildEntitySqlPrefilter(
  entity: string,
  columns: EntityPersonColumn[],
): { sql: string; params: string[] } | null {
  const patterns = entitySearchLikePatterns(entity);
  if (!patterns.length || !columns.length) return null;

  const parts: string[] = [];
  const params: string[] = [];
  for (const col of columns) {
    for (const pat of patterns) {
      parts.push(`"${col}" LIKE ?`);
      params.push(pat);
    }
  }
  return { sql: `(${parts.join(" OR ")})`, params };
}

function emptySentimentBreakdown(): SentimentBreakdown {
  return { positive: 0, negative: 0, neutral: 0 };
}

function addSentimentCount(
  acc: SentimentBreakdown,
  sentiment: Sentiment,
): void {
  if (sentiment === "Positive") acc.positive += 1;
  else if (sentiment === "Negative") acc.negative += 1;
  else acc.neutral += 1;
}

function sentimentFromRow(value: unknown): Sentiment {
  const s = String(value ?? "").trim().toLowerCase();
  if (s.startsWith("pos")) return "Positive";
  if (s.startsWith("neg")) return "Negative";
  return "Neutral";
}

function needsJsFiltering(
  filters: GlobalFilters,
  kind: TableKind,
): boolean {
  if (filters.search?.trim()) return true;
  if (filters.entity) return true;
  if (filters.district && filters.district !== "All") return true;
  if (filters.constituency && filters.constituency !== "All") return true;
  if (kind === "Print" && filters.printSource) return true;
  return false;
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
  const { clause, params } = buildIndexedWhere(filters);
  const db = getDb();
  const total = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM "${table}" ${clause}`)
      .get(...params) as { c: number }
  ).c;

  const sortCol =
    filters.sortBy && SORT_SQL_COLUMNS[filters.sortBy]
      ? SORT_SQL_COLUMNS[filters.sortBy]
      : '"CreatedAt"';
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

/** SQL-only count + sentiment — no full table scan in JS. */
export function countAndSentimentSql(
  kind: TableKind,
  filters: GlobalFilters = {},
): { total: number; sentiment: SentimentBreakdown } {
  const table = tableForKind(kind);
  if (!tableExists(table)) {
    return { total: 0, sentiment: emptySentimentBreakdown() };
  }
  const { clause, params } = buildIndexedWhere(filters);
  const rows = getDb()
    .prepare(
      `SELECT lower(trim("Sentiment")) AS s, COUNT(*) AS c FROM "${table}" ${clause} GROUP BY s`,
    )
    .all(...params) as { s: string; c: number }[];

  const sentiment = emptySentimentBreakdown();
  let total = 0;
  for (const { s, c } of rows) {
    total += c;
    if (s.startsWith("pos")) sentiment.positive += c;
    else if (s.startsWith("neg")) sentiment.negative += c;
    else sentiment.neutral += c;
  }
  return { total, sentiment };
}

/** SQL-only daily counts keyed by YYYY-MM-DD. */
export function dailyTrendCountsSql(
  kind: TableKind,
  filters: GlobalFilters = {},
): Map<string, number> {
  const table = tableForKind(kind);
  const map = new Map<string, number>();
  if (!tableExists(table)) return map;
  const { clause, params } = buildIndexedWhere(filters);
  const rows = getDb()
    .prepare(
      `SELECT date("CreatedAt") AS d, COUNT(*) AS c FROM "${table}" ${clause} AND "CreatedAt" IS NOT NULL GROUP BY d`,
    )
    .all(...params) as { d: string; c: number }[];
  for (const { d, c } of rows) {
    if (d) map.set(d, c);
  }
  return map;
}

export interface FilteredAggregateStats {
  total: number;
  sentiment: SentimentBreakdown;
  dailyTrend: Map<string, number>;
}

/** Aggregate with JS filters on light rows (no article bodies). */
export function aggregateFilteredStats(
  kind: TableKind,
  filters: GlobalFilters = {},
  options?: { skipDistrict?: boolean },
): FilteredAggregateStats {
  const scopedFilters = applyConstituencyScope(filters);
  const filterOptions = {
    ...options,
    skipDistrict:
      options?.skipDistrict ??
      !!(scopedFilters.constituency && scopedFilters.constituency !== "All"),
  };
  const sentiment = emptySentimentBreakdown();
  const dailyTrend = new Map<string, number>();
  let total = 0;

  for (const row of fetchRows(kind, scopedFilters, AGG_ROW_COLUMNS)) {
    if (!rowMatchesFilters(row, scopedFilters, filterOptions)) continue;

    if (kind === "Print") {
      if (
        !rowMatchesPrintSource(
          row,
          scopedFilters.printSource,
          scopedFilters.entity,
        )
      ) {
        continue;
      }
      if (scopedFilters.printSource === "district" && scopedFilters.district) {
        const { sourceType } = rowToPrintRecord(row);
        if (
          sourceType !== "district" &&
          sourceType !== "constituency" &&
          !rowMatchesDistrict(row, scopedFilters.district)
        ) {
          continue;
        }
      }
      if (scopedFilters.entity && scopedFilters.printSource === "mla") {
        if (
          !parsePersonNameArray(row.MLA).some((n) =>
            mlaNamesMatch(n, scopedFilters.entity!),
          )
        ) {
          continue;
        }
      }
    }

    total += 1;
    addSentimentCount(sentiment, sentimentFromRow(row.Sentiment));
    if (row.CreatedAt) {
      const d = row.CreatedAt.slice(0, 10);
      dailyTrend.set(d, (dailyTrend.get(d) ?? 0) + 1);
    }
  }

  return { total, sentiment, dailyTrend };
}

function fetchRows(
  kind: TableKind,
  filters: GlobalFilters = {},
  columnSql?: string,
): RawNewsRow[] {
  const table = tableForKind(kind);
  if (!tableExists(table)) return [];
  const columns =
    columnSql ??
    (kind === "Print" ? PRINT_ROW_COLUMNS : columnsForKind(kind as DigitalMediaKind));
  const { clause, params } = buildIndexedWhere(filters);

  let entityClause = "";
  const entityParams: unknown[] = [];
  if (filters.entity) {
    const pre = buildEntitySqlPrefilter(
      filters.entity,
      entityColumnsForFilters(filters),
    );
    if (pre) {
      entityClause = ` AND ${pre.sql}`;
      entityParams.push(...pre.params);
    }
  }

  return getDb()
    .prepare(`SELECT ${columns} FROM "${table}" ${clause}${entityClause}`)
    .all(...params, ...entityParams) as RawNewsRow[];
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
  const resolved = resolveConstituencyFilter(constituency) ?? constituency;
  const targetKey = constituencyDedupeKey(resolved);
  return parseJsonStringArray(row.Constituency).some((c) => {
    const token = resolveConstituencyToken(c) ?? c;
    return constituencyDedupeKey(token) === targetKey;
  });
}

/** Constituency scope wins over district — matches analytics on the constituency page. */
export function applyConstituencyScope(filters: GlobalFilters): GlobalFilters {
  if (!filters.constituency || filters.constituency === "All") return filters;
  return { ...filters, district: null };
}

function rowMatchesEntity(row: RawNewsRow, entity: string): boolean {
  if (parsePersonNameArray(row.MLA).some((n) => personNamesMatch(n, entity))) {
    return true;
  }
  const lok = parsePersonNameArray(row.Loksabha_MP);
  const raj = parsePersonNameArray(row.Rajyasabha_MP);
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
      row.link,
      ...parsePersonNameArray(row.MLA),
      ...parsePersonNameArray(row.Loksabha_MP),
      ...parsePersonNameArray(row.Rajyasabha_MP),
      ...parseDistrictNames(row.District),
      ...parseJsonStringArray(row.Constituency),
    ];
    if (!matchesSemanticSearch(search, ...hay)) return false;
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
    const mla = parsePersonNameArray(row.MLA);
    if (!mla.length) return false;
    if (entity) return mla.some((n) => mlaNamesMatch(n, entity));
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
  authors: (r) => r.authors,
  channel: (r) => ("channel" in r ? r.channel : null) ?? "",
  handles: (r) => ("handles" in r ? r.handles : null) ?? "",
  website: (r) => ("website" in r ? r.website : null) ?? "",
  publisher: (r) => ("website" in r ? r.website : null) ?? "",
  duration: (r) => ("duration" in r ? r.duration : null) ?? "",
  content: (r) => r.content,
  summary: (r) => r.summary ?? "",
  ccm: (r) => r.ccm ?? "",
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
  const scopedFilters = applyConstituencyScope(filters);
  if (
    options?.pagination &&
    !needsJsFiltering(scopedFilters, kind)
  ) {
    return queryTableRecordsSql<T>(kind, scopedFilters, options.pagination);
  }

  const filterOptions = {
    ...options,
    skipDistrict:
      options?.skipDistrict ??
      !!(scopedFilters.constituency && scopedFilters.constituency !== "All"),
  };
  const matched: T[] = [];

  for (const row of fetchRows(kind, scopedFilters)) {
    if (!rowMatchesFilters(row, scopedFilters, filterOptions)) continue;

    if (kind === "Print") {
      if (
        !rowMatchesPrintSource(
          row,
          scopedFilters.printSource,
          scopedFilters.entity,
        )
      ) {
        continue;
      }
      if (scopedFilters.printSource === "district" && scopedFilters.district) {
        const record = rowToPrintRecord(row);
        if (
          record.sourceType !== "district" &&
          record.sourceType !== "constituency" &&
          !rowMatchesDistrict(row, scopedFilters.district)
        ) {
          continue;
        }
      }
      if (scopedFilters.entity && scopedFilters.printSource === "mla") {
        if (
          !parsePersonNameArray(row.MLA).some((n) =>
            mlaNamesMatch(n, scopedFilters.entity!),
          )
        ) {
          continue;
        }
      }
    }

    matched.push(mapRow<T>(kind, row));
  }

  const sorted = sortRecords(
    kind,
    matched,
    scopedFilters.sortBy,
    scopedFilters.sortDir,
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

export interface EntityMediaStats {
  printTotal: number;
  digitalTotal: number;
  media: MediaBreakdown;
  sentiment: SentimentBreakdown;
  primaryDistrict: string | null;
}

function bumpEntityDistrictCounts(
  row: RawNewsRow,
  entityName: string,
  counts: Map<string, number>,
): void {
  for (const d of parseDistrictNames(row.District)) {
    const canonical = resolveDistrictName(d);
    if (!canonical || canonical === entityName) continue;
    counts.set(canonical, (counts.get(canonical) ?? 0) + 1);
  }
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

/** Aggregates linked print + digital coverage for an MLA/MP without loading full articles. */
export function queryEntityMediaStats(
  entity: string,
  printSource: "mla" | "mp",
): EntityMediaStats {
  const media: MediaBreakdown = { print: 0, youtube: 0, x: 0, online: 0 };
  const sentiment = emptySentimentBreakdown();
  const districtCounts = new Map<string, number>();

  for (const row of fetchRows(
    "Print",
    { entity, printSource },
    ENTITY_STAT_ROW_COLUMNS,
  )) {
    if (!rowMatchesEntity(row, entity)) continue;
    if (!rowMatchesPrintSource(row, printSource, entity)) continue;
    media.print += 1;
    addSentimentCount(sentiment, sentimentFromRow(row.Sentiment));
    bumpEntityDistrictCounts(row, entity, districtCounts);
  }

  const digitalKinds: DigitalMediaKind[] = ["YouTube", "X", "Online"];
  for (const kind of digitalKinds) {
    for (const row of fetchRows(kind, { entity }, ENTITY_STAT_ROW_COLUMNS)) {
      if (!rowMatchesEntity(row, entity)) continue;
      if (kind === "YouTube") media.youtube += 1;
      else if (kind === "X") media.x += 1;
      else media.online += 1;
      addSentimentCount(sentiment, sentimentFromRow(row.Sentiment));
      bumpEntityDistrictCounts(row, entity, districtCounts);
    }
  }

  return {
    printTotal: media.print,
    digitalTotal: media.youtube + media.x + media.online,
    media,
    sentiment,
    primaryDistrict: pickPrimaryDistrict(districtCounts),
  };
}

export function printCountsByDistrict(): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of fetchRows("Print", {}, AGG_ROW_COLUMNS)) {
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
