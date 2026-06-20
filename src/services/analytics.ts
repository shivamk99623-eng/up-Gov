import "server-only";
import {
  loadRecords,
  filterRecords,
  toGeoName,
  isKnownDistrict,
} from "@/lib/excel-parser";
import {
  loadDistrictPrintRecords,
  loadPrintRecords,
  listDistrictNamesFromPrint,
  printCountsByDistrict,
} from "@/lib/print-parser";
import { formatCalendarDate } from "@/lib/dates";
import type {
  DashboardResponse,
  DistrictAnalyticsResponse,
  DistrictSummary,
  GlobalFilters,
  MediaQueryResponse,
  MediaRecord,
  MediaType,
  NameCount,
  NewsItem,
  PrintQueryResponse,
  PrintRecord,
  Sentiment,
  TrendPoint,
} from "@/lib/types";

function emptySentiment() {
  return { positive: 0, negative: 0, neutral: 0 };
}

function addSentiment(acc: { positive: number; negative: number; neutral: number }, s: Sentiment) {
  if (s === "Positive") acc.positive += 1;
  else if (s === "Negative") acc.negative += 1;
  else acc.neutral += 1;
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

function buildDailyTrend(
  records: MediaRecord[],
  printRecords: PrintRecord[] = [],
): TrendPoint[] {
  const map = new Map<string, TrendPoint>();
  for (const r of records) {
    if (!r.date) continue;
    bumpTrend(map, r.date, r.mediaType);
  }
  for (const r of printRecords) {
    if (!r.date) continue;
    bumpTrend(map, r.date, "print");
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Engagement score used to rank individual news items. */
function engagementScore(r: MediaRecord): number {
  const interactions = r.likes + r.comments + r.shares;
  return Math.max(r.totalEngagement, interactions);
}

/** Top-N most engaging news items for a given sentiment, with a valid link. */
function topNewsBySentiment(
  records: MediaRecord[],
  sentiment: Sentiment,
  limit: number,
): NewsItem[] {
  return records
    .filter((r) => r.sentiment === sentiment && !!r.url)
    .map((r) => ({
      id: r.id,
      headline: r.headline,
      url: r.url,
      mediaType: r.mediaType,
      district: r.district,
      sentiment: r.sentiment,
      engagement: engagementScore(r),
      views: r.views,
      date: r.date,
    }))
    .sort(
      (a, b) =>
        b.engagement - a.engagement ||
        b.views - a.views ||
        (b.date ?? "").localeCompare(a.date ?? ""),
    )
    .slice(0, limit);
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
  const all = loadRecords();
  const records = filterRecords(all, filters);
  const printRecords = loadPrintRecords(filters);

  let youtubeCount = 0;
  let xCount = 0;
  let onlineCount = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
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

  for (const r of printRecords) {
    if (r.sentiment === "Positive") positiveCount += 1;
    else if (r.sentiment === "Negative") negativeCount += 1;
    else neutralCount += 1;
  }

  const printByDistrict = printCountsByDistrict();
  const districtSummary = buildDistrictSummary(records, printByDistrict);

  return {
    totalNews: records.length + printRecords.length,
    printCount: printRecords.length,
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
      print: printRecords.length,
      youtube: youtubeCount,
      x: xCount,
      online: onlineCount,
    },
    dailyTrend: buildDailyTrend(records, printRecords),
    topProfiles: topCounts(records, (r) => r.profile, 10),
    topChannels: topCounts(records, (r) => r.rawChannel, 10),
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
  const all = loadRecords();
  const records = filterRecords(all, { ...filters, district });
  const printRecords =
    district === "All"
      ? loadDistrictPrintRecords()
      : loadDistrictPrintRecords(district);

  const sentiment = emptySentiment();
  const media = { print: 0, youtube: 0, x: 0, online: 0 };
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
    media.print += 1;
    addSentiment(sentiment, r.sentiment);
    addSentiment(mediaSentiment.print, r.sentiment);
  }

  return {
    district,
    total: records.length + printRecords.length,
    sentiment,
    media,
    mediaSentiment,
    dailyTrend: buildDailyTrend(records),
    topProfiles: topCounts(records, (r) => r.profile, 10),
    languageDistribution: topCounts(records, (r) => r.language, 10),
  };
}

export function getMedia(
  filters: GlobalFilters & { mediaType?: MediaType | "All" | null },
): MediaQueryResponse {
  const all = loadRecords();
  const records = filterRecords(all, filters);
  const sorted = records.sort(
    (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0),
  );
  return {
    district: filters.district ?? null,
    constituency: filters.constituency ?? null,
    mediaType: filters.mediaType ?? "All",
    total: sorted.length,
    records: sorted,
  };
}

/** Distinct values for populating filter dropdowns. */
export function getPrint(
  filters: GlobalFilters = {},
): PrintQueryResponse {
  const records = loadPrintRecords(filters);
  const sorted = [...records].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );
  return {
    district: filters.district ?? null,
    constituency: filters.constituency ?? null,
    entity: filters.entity ?? null,
    total: sorted.length,
    records: sorted,
  };
}

export function getFilterOptions() {
  const records = loadRecords();
  const districts = new Set<string>();
  const languages = new Set<string>();
  for (const r of records) {
    if (isKnownDistrict(r.district)) districts.add(r.district);
    languages.add(r.language);
  }
  for (const name of listDistrictNamesFromPrint()) {
    districts.add(name);
  }
  return {
    districts: [...districts].sort(),
    languages: [...languages].sort(),
  };
}
