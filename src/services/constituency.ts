import "server-only";
import { resolveConstituencyFilter, listConstituencies } from "@/lib/constituency-lookup";
import { listLegislativeAssemblies, resolveLegislativeAssemblyFilter } from "@/lib/legislative-lookup";
import { listConstituencyDetailNames, dedupeConstituencyNames } from "@/lib/constituency-detail";
import {
  aggregateFilteredStats,
  queryDigitalMedia,
  type PaginationParams,
} from "@/lib/news-repository";
import {
  getOnlineNews,
  getPrintNews,
  getXNews,
  getYouTubeNews,
} from "@/services/media";
import type {
  ConstituencyAnalyticsResponse,
  ConstituencyPrintResponse,
  ConstituencyScope,
  GlobalFilters,
  MediaQueryResponse,
  MediaType,
  NameCount,
  TrendPoint,
} from "@/lib/types";

function mergeSentiment(
  acc: { positive: number; negative: number; neutral: number },
  s: { positive: number; negative: number; neutral: number },
) {
  acc.positive += s.positive;
  acc.negative += s.negative;
  acc.neutral += s.neutral;
}

function emptySentiment() {
  return { positive: 0, negative: 0, neutral: 0 };
}

function topCounts<T>(
  items: T[],
  key: (item: T) => string | null,
  limit: number,
): NameCount[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function resolveScopedConstituencyFilter(
  constituency: string | null | undefined,
  scope: ConstituencyScope,
) {
  if (scope === "legislative") {
    return resolveLegislativeAssemblyFilter(constituency);
  }
  return resolveConstituencyFilter(constituency, scope);
}

function resolveConstituencyFilterForAnalytics(
  constituency: string,
  scope: ConstituencyScope,
) {
  return resolveScopedConstituencyFilter(constituency, scope) ?? "All";
}

export function getConstituencyOptions(scope: ConstituencyScope = "parliamentary") {
  if (scope === "legislative") {
    return { constituencies: listLegislativeAssemblies() };
  }
  const fromNews = listConstituencies("parliamentary");
  const fromDb = listConstituencyDetailNames();
  return { constituencies: dedupeConstituencyNames([...fromDb, ...fromNews]) };
}

export function getConstituencyPrint(
  constituency?: string | null,
  filters: GlobalFilters = {},
  pagination?: PaginationParams,
): ConstituencyPrintResponse {
  const scope = filters.constituencyScope ?? "parliamentary";
  const resolved = resolveScopedConstituencyFilter(constituency, scope);
  const result = getPrintNews(
    {
      ...filters,
      constituency: resolved ?? filters.constituency ?? null,
      district: null,
    },
    pagination,
  );
  return {
    constituency: resolved,
    total: result.total,
    records: result.records,
    ...(pagination
      ? { page: result.page, limit: result.limit, totalPages: result.totalPages }
      : {}),
  };
}

export function getConstituencyAnalytics(
  constituency: string,
  filters: GlobalFilters = {},
): ConstituencyAnalyticsResponse {
  const scope = filters.constituencyScope ?? "parliamentary";
  const resolved = resolveConstituencyFilterForAnalytics(constituency, scope);
  const scoped = {
    ...filters,
    constituencyScope: scope,
    constituency: resolved === "All" ? null : resolved,
    district: null,
  };

  const sentiment = emptySentiment();
  const media = { print: 0, youtube: 0, x: 0, online: 0 };
  const mediaSentiment = {
    print: emptySentiment(),
    youtube: emptySentiment(),
    x: emptySentiment(),
    online: emptySentiment(),
  };
  const dailyTrendMap = new Map<string, TrendPoint>();

  for (const kind of ["YouTube", "X", "Online"] as const) {
    const agg = aggregateFilteredStats(kind, scoped, { skipDistrict: true });
    if (kind === "YouTube") {
      media.youtube = agg.total;
      mediaSentiment.youtube = agg.sentiment;
    } else if (kind === "X") {
      media.x = agg.total;
      mediaSentiment.x = agg.sentiment;
    } else {
      media.online = agg.total;
      mediaSentiment.online = agg.sentiment;
    }
    mergeSentiment(sentiment, agg.sentiment);
    for (const [date, count] of agg.dailyTrend) {
      let p = dailyTrendMap.get(date);
      if (!p) {
        p = { date, total: 0, print: 0, youtube: 0, x: 0, online: 0 };
        dailyTrendMap.set(date, p);
      }
      p.total += count;
      if (kind === "YouTube") p.youtube += count;
      else if (kind === "X") p.x += count;
      else p.online += count;
    }
  }

  const printAgg = aggregateFilteredStats("Print", scoped, { skipDistrict: true });
  media.print = printAgg.total;
  mediaSentiment.print = printAgg.sentiment;
  mergeSentiment(sentiment, printAgg.sentiment);
  for (const [date, count] of printAgg.dailyTrend) {
    let p = dailyTrendMap.get(date);
    if (!p) {
      p = { date, total: 0, print: 0, youtube: 0, x: 0, online: 0 };
      dailyTrendMap.set(date, p);
    }
    p.total += count;
    p.print += count;
  }

  const digitalTotal = media.youtube + media.x + media.online;
  const records =
    digitalTotal > 0
      ? queryDigitalMedia(scoped, { skipDistrict: true }).records
      : [];

  return {
    constituency: resolved,
    total: digitalTotal + media.print,
    printTotal: media.print,
    sentiment,
    media,
    mediaSentiment,
    dailyTrend: [...dailyTrendMap.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    topProfiles: topCounts(records, (r) => r.authors || null, 10),
    languageDistribution: topCounts(records, (r) => r.language, 10),
  };
}

export function getConstituencyMedia(
  filters: GlobalFilters & {
    constituency?: string | null;
    mediaType?: MediaType | "All" | null;
  },
  pagination?: PaginationParams,
): MediaQueryResponse {
  const scope = filters.constituencyScope ?? "parliamentary";
  const resolved = resolveScopedConstituencyFilter(filters.constituency, scope);
  const scoped = {
    ...filters,
    constituencyScope: scope,
    constituency: resolved,
    district: null,
  };
  const options = { skipDistrict: true as const, pagination };

  if (filters.mediaType === "YouTube") {
    return { ...getYouTubeNews(scoped, pagination, options), mediaType: "YouTube" };
  }
  if (filters.mediaType === "X") {
    return { ...getXNews(scoped, pagination, options), mediaType: "X" };
  }
  if (filters.mediaType === "Online") {
    return { ...getOnlineNews(scoped, pagination, options), mediaType: "Online" };
  }

  const result = queryDigitalMedia(scoped, options);
  return {
    district: null,
    constituency: resolved,
    mediaType: filters.mediaType ?? "All",
    total: result.total,
    records: result.records,
    ...(pagination
      ? { page: result.page, limit: result.limit, totalPages: result.totalPages }
      : {}),
  };
}
