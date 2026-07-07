import "server-only";
import { formatCalendarDate } from "@/lib/dates";
import {
  aggregateDashboardValueCounts,
  buildDashboardDistrictSummary,
  tableStatsSql,
  listDistrictNamesFromNews,
  listLanguagesFromNews,
  queryDigitalTimestampBounds,
  queryTopDigitalRecords,
} from "@/lib/news-repository";
import type {
  DashboardResponse,
  DistrictAnalyticsResponse,
  GlobalFilters,
  MediaRecord,
  MediaType,
  NewsItem,
  Sentiment,
  TrendPoint,
} from "@/lib/types";

function emptySentiment() {
  return { positive: 0, negative: 0, neutral: 0 };
}

function mergeSentiment(
  acc: { positive: number; negative: number; neutral: number },
  s: { positive: number; negative: number; neutral: number },
) {
  acc.positive += s.positive;
  acc.negative += s.negative;
  acc.neutral += s.neutral;
}

function mergeKindDailyTrends(
  printDaily: Map<string, number>,
  youtubeDaily: Map<string, number>,
  xDaily: Map<string, number>,
  onlineDaily: Map<string, number>,
): TrendPoint[] {
  const map = new Map<string, TrendPoint>();

  const bump = (date: string, kind: "print" | MediaType, count: number) => {
    let p = map.get(date);
    if (!p) {
      p = { date, total: 0, print: 0, youtube: 0, x: 0, online: 0 };
      map.set(date, p);
    }
    p.total += count;
    if (kind === "print") p.print += count;
    else if (kind === "YouTube") p.youtube += count;
    else if (kind === "X") p.x += count;
    else p.online += count;
  };

  for (const [date, count] of printDaily) bump(date, "print", count);
  for (const [date, count] of youtubeDaily) bump(date, "YouTube", count);
  for (const [date, count] of xDaily) bump(date, "X", count);
  for (const [date, count] of onlineDaily) bump(date, "Online", count);

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function topNewsBySentiment(
  records: MediaRecord[],
  sentiment: Sentiment,
  limit: number,
): NewsItem[] {
  return records
    .filter((r) => r.sentiment === sentiment && !!r.link)
    .map((r) => ({
      id: r.id,
      headline: r.headline,
      link: r.link!,
      mediaType: r.mediaType,
      district: r.district,
      sentiment: r.sentiment,
      date: r.date,
    }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, limit);
}

const DASHBOARD_CACHE_MS = 45_000;
const dashboardCache = new Map<
  string,
  { at: number; data: DashboardResponse }
>();

function dashboardCacheKey(filters: GlobalFilters): string {
  return JSON.stringify(filters);
}

function getDashboardUncached(filters: GlobalFilters = {}): DashboardResponse {
  const digitalKinds = ["YouTube", "X", "Online"] as const;

  const printStats = tableStatsSql("Print", filters);
  let youtubeCount = 0;
  let xCount = 0;
  let onlineCount = 0;
  let youtubeDaily = new Map<string, number>();
  let xDaily = new Map<string, number>();
  let onlineDaily = new Map<string, number>();
  let positiveCount = printStats.sentiment.positive;
  let negativeCount = printStats.sentiment.negative;
  let neutralCount = printStats.sentiment.neutral;

  for (const kind of digitalKinds) {
    const stats = tableStatsSql(kind, filters);
    if (kind === "YouTube") {
      youtubeCount = stats.total;
      youtubeDaily = stats.dailyTrend;
    } else if (kind === "X") {
      xCount = stats.total;
      xDaily = stats.dailyTrend;
    } else {
      onlineCount = stats.total;
      onlineDaily = stats.dailyTrend;
    }
    positiveCount += stats.sentiment.positive;
    negativeCount += stats.sentiment.negative;
    neutralCount += stats.sentiment.neutral;
  }

  const districtSummary = buildDashboardDistrictSummary(filters);
  const { min: minTs, max: maxTs } = queryDigitalTimestampBounds(filters);
  const topPositiveRecords = queryTopDigitalRecords(filters, "Positive", 10);
  const topNegativeRecords = queryTopDigitalRecords(filters, "Negative", 10);

  return {
    totalNews: youtubeCount + xCount + onlineCount + printStats.total,
    printCount: printStats.total,
    youtubeCount,
    xCount,
    onlineCount,
    positiveCount,
    negativeCount,
    neutralCount,
    districtSummary,
    topDistricts: districtSummary
      .slice(0, 10)
      .map((d) => ({ name: d.district, count: d.total })),
    topPositiveNews: topNewsBySentiment(topPositiveRecords, "Positive", 10),
    topNegativeNews: topNewsBySentiment(topNegativeRecords, "Negative", 10),
    mediaDistribution: {
      print: printStats.total,
      youtube: youtubeCount,
      x: xCount,
      online: onlineCount,
    },
    dailyTrend: mergeKindDailyTrends(
      printStats.dailyTrend,
      youtubeDaily,
      xDaily,
      onlineDaily,
    ),
    topProfiles: aggregateDashboardValueCounts(filters, "authors", 10),
    topChannels: aggregateDashboardValueCounts(filters, "source", 10),
    languageDistribution: aggregateDashboardValueCounts(filters, "language", 12),
    dateRange: {
      min: minTs ? formatCalendarDate(minTs) : null,
      max: maxTs ? formatCalendarDate(maxTs) : null,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export function getDashboard(filters: GlobalFilters = {}): DashboardResponse {
  const key = dashboardCacheKey(filters);
  const hit = dashboardCache.get(key);
  if (hit && Date.now() - hit.at < DASHBOARD_CACHE_MS) {
    return hit.data;
  }
  const data = getDashboardUncached(filters);
  dashboardCache.set(key, { at: Date.now(), data });
  if (dashboardCache.size > 24) {
    const oldest = [...dashboardCache.entries()].sort(
      (a, b) => a[1].at - b[1].at,
    )[0]?.[0];
    if (oldest) dashboardCache.delete(oldest);
  }
  return data;
}

export function getDistrictAnalytics(
  district: string,
  filters: GlobalFilters = {},
): DistrictAnalyticsResponse {
  const scoped = { ...filters, district };
  const sentiment = emptySentiment();
  const media = { print: 0, youtube: 0, x: 0, online: 0 };
  const mediaSentiment = {
    print: emptySentiment(),
    youtube: emptySentiment(),
    x: emptySentiment(),
    online: emptySentiment(),
  };
  const dailyTrendMap = new Map<string, TrendPoint>();

  const bumpDailyCounts = (
    counts: Map<string, number>,
    kind: "print" | MediaType,
  ) => {
    for (const [date, count] of counts) {
      let p = dailyTrendMap.get(date);
      if (!p) {
        p = { date, total: 0, print: 0, youtube: 0, x: 0, online: 0 };
        dailyTrendMap.set(date, p);
      }
      p.total += count;
      if (kind === "print") p.print += count;
      else if (kind === "YouTube") p.youtube += count;
      else if (kind === "X") p.x += count;
      else p.online += count;
    }
  };

  for (const kind of ["YouTube", "X", "Online"] as const) {
    const stats = tableStatsSql(kind, scoped);
    if (kind === "YouTube") {
      media.youtube = stats.total;
      mediaSentiment.youtube = stats.sentiment;
    } else if (kind === "X") {
      media.x = stats.total;
      mediaSentiment.x = stats.sentiment;
    } else {
      media.online = stats.total;
      mediaSentiment.online = stats.sentiment;
    }
    mergeSentiment(sentiment, stats.sentiment);
    bumpDailyCounts(stats.dailyTrend, kind);
  }

  const printFilters =
    district === "All"
      ? { ...filters, printSource: "district" as const }
      : { ...scoped, printSource: "district" as const };
  const printStats = tableStatsSql("Print", printFilters);
  media.print = printStats.total;
  mediaSentiment.print = printStats.sentiment;
  mergeSentiment(sentiment, printStats.sentiment);
  bumpDailyCounts(printStats.dailyTrend, "print");

  const digitalTotal = media.youtube + media.x + media.online;

  return {
    district,
    total: digitalTotal + media.print,
    sentiment,
    media,
    mediaSentiment,
    dailyTrend: [...dailyTrendMap.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    topProfiles: aggregateDashboardValueCounts(scoped, "authors", 10),
    languageDistribution: aggregateDashboardValueCounts(scoped, "language", 10),
  };
}

export function getFilterOptions() {
  const districts = new Set(listDistrictNamesFromNews());
  const languages = new Set(listLanguagesFromNews());
  return {
    districts: [...districts].sort(),
    languages: [...languages].sort(),
  };
}
