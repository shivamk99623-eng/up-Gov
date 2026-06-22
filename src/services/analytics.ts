import "server-only";
import { formatCalendarDate } from "@/lib/dates";
import { isKnownDistrict, toGeoName } from "@/lib/geo";
import {
  countAndSentimentSql,
  dailyTrendCountsSql,
  aggregateFilteredStats,
  listDistrictNamesFromNews,
  listLanguagesFromNews,
  printCountsByDistrict,
  queryDigitalMedia,
} from "@/lib/news-repository";
import type {
  DashboardResponse,
  DistrictAnalyticsResponse,
  DistrictSummary,
  GlobalFilters,
  MediaRecord,
  MediaType,
  NameCount,
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

function hasJsScopeFilters(filters: GlobalFilters): boolean {
  return !!(
    filters.district ||
    filters.constituency ||
    filters.search?.trim() ||
    filters.entity
  );
}

function mergeDailyTrendMaps(
  digitalRecords: MediaRecord[],
  printByDate: Map<string, number>,
): TrendPoint[] {
  const map = new Map<string, TrendPoint>();
  for (const r of digitalRecords) {
    if (!r.date) continue;
    bumpTrend(map, r.date, r.mediaType);
  }
  for (const [date, count] of printByDate) {
    let p = map.get(date);
    if (!p) {
      p = { date, total: 0, print: 0, youtube: 0, x: 0, online: 0 };
      map.set(date, p);
    }
    p.total += count;
    p.print += count;
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function topCounts(
  records: MediaRecord[],
  key: (r: MediaRecord) => string | null,
  limit: number,
): NameCount[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = key(r);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function bumpTrend(
  map: Map<string, TrendPoint>,
  date: string,
  kind: "print" | MediaType,
) {
  let p = map.get(date);
  if (!p) {
    p = { date, total: 0, print: 0, youtube: 0, x: 0, online: 0 };
    map.set(date, p);
  }
  p.total += 1;
  if (kind === "print") p.print += 1;
  else if (kind === "YouTube") p.youtube += 1;
  else if (kind === "X") p.x += 1;
  else p.online += 1;
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

function digitalSourceName(r: MediaRecord): string | null {
  if (r.mediaType === "YouTube") return r.channel;
  if (r.mediaType === "X") return r.handles;
  return r.website;
}

function buildDistrictSummary(
  records: MediaRecord[],
  printByDistrict: Map<string, number>,
): DistrictSummary[] {
  const map = new Map<string, DistrictSummary>();
  for (const r of records) {
    if (!isKnownDistrict(r.district)) continue;
    let d = map.get(r.district);
    if (!d) {
      d = {
        district: r.district,
        dt_name: r.district.slice(0, 3),
        geoName: toGeoName(r.district),
        total: 0,
        print: printByDistrict.get(r.district) ?? 0,
        youtube: 0,
        x: 0,
        online: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
      };
      map.set(r.district, d);
    }
    d.total += 1;
    if (r.mediaType === "YouTube") d.youtube += 1;
    else if (r.mediaType === "X") d.x += 1;
    else d.online += 1;
    if (r.sentiment === "Positive") d.positive += 1;
    else if (r.sentiment === "Negative") d.negative += 1;
    else d.neutral += 1;
  }
  for (const [district, printCount] of printByDistrict) {
    if (!map.has(district)) {
      map.set(district, {
        district,
        dt_name: district.slice(0, 3),
        geoName: toGeoName(district),
        total: printCount,
        print: printCount,
        youtube: 0,
        x: 0,
        online: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
      });
    } else {
      const d = map.get(district)!;
      d.print = printCount;
      d.total += printCount;
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}


export function getDashboard(filters: GlobalFilters = {}): DashboardResponse {
  const records = queryDigitalMedia(filters).records;

  let printCount: number;
  let printSentiment: ReturnType<typeof emptySentiment>;
  let printDaily: Map<string, number>;

  if (hasJsScopeFilters(filters)) {
    const agg = aggregateFilteredStats("Print", filters);
    printCount = agg.total;
    printSentiment = agg.sentiment;
    printDaily = agg.dailyTrend;
  } else {
    const stats = countAndSentimentSql("Print", filters);
    printCount = stats.total;
    printSentiment = stats.sentiment;
    printDaily = dailyTrendCountsSql("Print", filters);
  }

  let youtubeCount = 0;
  let xCount = 0;
  let onlineCount = 0;
  let positiveCount = printSentiment.positive;
  let negativeCount = printSentiment.negative;
  let neutralCount = printSentiment.neutral;
  let minTs: number | null = null;
  let maxTs: number | null = null;

  for (const r of records) {
    if (r.mediaType === "YouTube") youtubeCount += 1;
    else if (r.mediaType === "X") xCount += 1;
    else onlineCount += 1;
    if (r.sentiment === "Positive") positiveCount += 1;
    else if (r.sentiment === "Negative") negativeCount += 1;
    else neutralCount += 1;
    if (r.timestamp !== null) {
      if (minTs === null || r.timestamp < minTs) minTs = r.timestamp;
      if (maxTs === null || r.timestamp > maxTs) maxTs = r.timestamp;
    }
  }

  const printByDistrict = printCountsByDistrict();
  const districtSummary = buildDistrictSummary(records, printByDistrict);

  return {
    totalNews: records.length + printCount,
    printCount,
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
    topPositiveNews: topNewsBySentiment(records, "Positive", 10),
    topNegativeNews: topNewsBySentiment(records, "Negative", 10),
    mediaDistribution: {
      print: printCount,
      youtube: youtubeCount,
      x: xCount,
      online: onlineCount,
    },
    dailyTrend: mergeDailyTrendMaps(records, printDaily),
    topProfiles: topCounts(records, (r) => r.authors || null, 10),
    topChannels: topCounts(records, digitalSourceName, 10),
    languageDistribution: topCounts(records, (r) => r.language, 12),
    dateRange: {
      min: minTs ? formatCalendarDate(minTs) : null,
      max: maxTs ? formatCalendarDate(maxTs) : null,
    },
    lastUpdated: new Date().toISOString(),
  };
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
    const agg = aggregateFilteredStats(kind, scoped);
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
    bumpDailyCounts(agg.dailyTrend, kind);
  }

  const printFilters =
    district === "All"
      ? { ...filters, printSource: "district" as const }
      : { ...scoped, printSource: "district" as const };
  const printAgg = aggregateFilteredStats("Print", printFilters);
  media.print = printAgg.total;
  mediaSentiment.print = printAgg.sentiment;
  mergeSentiment(sentiment, printAgg.sentiment);
  bumpDailyCounts(printAgg.dailyTrend, "print");

  const digitalTotal = media.youtube + media.x + media.online;
  const records =
    digitalTotal > 0 ? queryDigitalMedia(scoped).records : [];

  return {
    district,
    total: digitalTotal + media.print,
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

export function getFilterOptions() {
  const districts = new Set(listDistrictNamesFromNews());
  const languages = new Set(listLanguagesFromNews());
  return {
    districts: [...districts].sort(),
    languages: [...languages].sort(),
  };
}
