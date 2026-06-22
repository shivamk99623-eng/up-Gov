import "server-only";
import { resolveConstituencyFilter, listConstituencies } from "@/lib/constituency-lookup";
import { listConstituencyDetailNames, dedupeConstituencyNames } from "@/lib/constituency-detail";
import {
  queryDigitalMedia,
  queryPrintRecords,
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
  GlobalFilters,
  MediaQueryResponse,
  MediaType,
  NameCount,
  Sentiment,
  TrendPoint,
} from "@/lib/types";

function emptySentiment() {
  return { positive: 0, negative: 0, neutral: 0 };
}

function addSentiment(
  acc: { positive: number; negative: number; neutral: number },
  s: Sentiment,
) {
  if (s === "Positive") acc.positive += 1;
  else if (s === "Negative") acc.negative += 1;
  else acc.neutral += 1;
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

function buildDailyTrend(
  records: { date: string | null; mediaType: string }[],
): TrendPoint[] {
  const map = new Map<string, TrendPoint>();
  for (const r of records) {
    if (!r.date) continue;
    let p = map.get(r.date);
    if (!p) {
      p = { date: r.date, total: 0, print: 0, youtube: 0, x: 0, online: 0 };
      map.set(r.date, p);
    }
    p.total += 1;
    if (r.mediaType === "YouTube") p.youtube += 1;
    else if (r.mediaType === "X") p.x += 1;
    else p.online += 1;
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function resolveConstituencyFilterForAnalytics(constituency: string) {
  return resolveConstituencyFilter(constituency) ?? "All";
}

export function getConstituencyOptions() {
  const fromNews = listConstituencies();
  const fromDb = listConstituencyDetailNames();
  return { constituencies: dedupeConstituencyNames([...fromDb, ...fromNews]) };
}

export function getConstituencyPrint(
  constituency?: string | null,
  filters: GlobalFilters = {},
  pagination?: PaginationParams,
): ConstituencyPrintResponse {
  const resolved = resolveConstituencyFilter(constituency);
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
  const resolved = resolveConstituencyFilterForAnalytics(constituency);
  const records = queryDigitalMedia(
    {
      ...filters,
      constituency: resolved === "All" ? null : resolved,
      district: null,
    },
    { skipDistrict: true },
  ).records;
  const printRecords = queryPrintRecords({
    ...filters,
    constituency: resolved === "All" ? null : resolved,
    district: null,
  }).records;

  const sentiment = emptySentiment();
  const media = {
    print: printRecords.length,
    youtube: 0,
    x: 0,
    online: 0,
  };
  const mediaSentiment = {
    print: emptySentiment(),
    youtube: emptySentiment(),
    x: emptySentiment(),
    online: emptySentiment(),
  };

  for (const r of records) {
    addSentiment(sentiment, r.sentiment);
    if (r.mediaType === "YouTube") {
      media.youtube += 1;
      addSentiment(mediaSentiment.youtube, r.sentiment);
    } else if (r.mediaType === "X") {
      media.x += 1;
      addSentiment(mediaSentiment.x, r.sentiment);
    } else {
      media.online += 1;
      addSentiment(mediaSentiment.online, r.sentiment);
    }
  }

  for (const r of printRecords) {
    addSentiment(sentiment, r.sentiment);
    addSentiment(mediaSentiment.print, r.sentiment);
  }

  return {
    constituency: resolved,
    total: records.length + printRecords.length,
    printTotal: printRecords.length,
    sentiment,
    media,
    mediaSentiment,
    dailyTrend: buildDailyTrend(records),
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
  const resolved = resolveConstituencyFilter(filters.constituency);
  const scoped = {
    ...filters,
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
