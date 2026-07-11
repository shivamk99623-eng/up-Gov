import "server-only";
import { formatCalendarDate } from "@/lib/dates";
import { assembleDashboard } from "@/lib/dashboard-assemble";
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

const DASHBOARD_CACHE_MS = 120_000;
const dashboardCache = new Map<
  string,
  { at: number; data: DashboardResponse }
>();

function dashboardCacheKey(filters: GlobalFilters): string {
  return JSON.stringify(filters);
}

/** Counts / sentiment / daily trend — print-heavy half of the dashboard. */
export function getDashboardStats(filters: GlobalFilters = {}) {
  const printStats = tableStatsSql("Print", filters);
  const youtubeStats = tableStatsSql("YouTube", filters);
  const xStats = tableStatsSql("X", filters);
  const onlineStats = tableStatsSql("Online", filters);

  let positiveCount = printStats.sentiment.positive;
  let negativeCount = printStats.sentiment.negative;
  let neutralCount = printStats.sentiment.neutral;
  for (const stats of [youtubeStats, xStats, onlineStats]) {
    positiveCount += stats.sentiment.positive;
    negativeCount += stats.sentiment.negative;
    neutralCount += stats.sentiment.neutral;
  }

  return {
    printCount: printStats.total,
    youtubeCount: youtubeStats.total,
    xCount: xStats.total,
    onlineCount: onlineStats.total,
    positiveCount,
    negativeCount,
    neutralCount,
    printDaily: [...printStats.dailyTrend.entries()],
    youtubeDaily: [...youtubeStats.dailyTrend.entries()],
    xDaily: [...xStats.dailyTrend.entries()],
    onlineDaily: [...onlineStats.dailyTrend.entries()],
  };
}

/** District / tops / rollups — second half, safe to run in parallel with stats. */
export function getDashboardRollups(filters: GlobalFilters = {}) {
  const districtSummary = buildDashboardDistrictSummary(filters);
  const { min: minTs, max: maxTs } = queryDigitalTimestampBounds(filters);
  const topPositiveRecords = queryTopDigitalRecords(filters, "Positive", 10);
  const topNegativeRecords = queryTopDigitalRecords(filters, "Negative", 10);

  return {
    districtSummary,
    topDistricts: districtSummary
      .slice(0, 10)
      .map((d) => ({ name: d.district, count: d.total })),
    topPositiveNews: topNewsBySentiment(topPositiveRecords, "Positive", 10),
    topNegativeNews: topNewsBySentiment(topNegativeRecords, "Negative", 10),
    topProfiles: aggregateDashboardValueCounts(filters, "authors", 10),
    topChannels: aggregateDashboardValueCounts(filters, "source", 10),
    languageDistribution: aggregateDashboardValueCounts(filters, "language", 12),
    dateRange: {
      min: minTs ? formatCalendarDate(minTs) : null,
      max: maxTs ? formatCalendarDate(maxTs) : null,
    },
  };
}

function mergeDashboardParts(
  stats: ReturnType<typeof getDashboardStats>,
  rollups: ReturnType<typeof getDashboardRollups>,
): DashboardResponse {
  return assembleDashboard(stats, rollups);
}

function getDashboardUncached(filters: GlobalFilters = {}): DashboardResponse {
  return mergeDashboardParts(
    getDashboardStats(filters),
    getDashboardRollups(filters),
  );
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
