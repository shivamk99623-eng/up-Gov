import "server-only";
import { loadRecords, filterRecords } from "@/lib/excel-parser";
import {
  listConstituenciesFromPrint as listConstituencies,
  loadConstituencyPrintRecords,
  resolveConstituencyToken,
} from "@/lib/print-parser";
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

function resolveConstituencyFilter(constituency: string | null | undefined) {
  if (!constituency || constituency === "All") return null;
  return resolveConstituencyToken(constituency) ?? constituency;
}

export function getConstituencyOptions() {
  return { constituencies: listConstituencies() };
}

export function getConstituencyPrint(
  constituency?: string | null,
): ConstituencyPrintResponse {
  const resolved = resolveConstituencyFilter(constituency);
  const records = loadConstituencyPrintRecords(resolved);
  return {
    constituency: resolved,
    total: records.length,
    records,
  };
}

export function getConstituencyAnalytics(
  constituency: string,
  filters: GlobalFilters = {},
): ConstituencyAnalyticsResponse {
  const resolved = resolveConstituencyFilter(constituency) ?? "All";
  const all = loadRecords();
  const records = filterRecords(all, {
    ...filters,
    constituency: resolved === "All" ? null : resolved,
    district: null,
  });
  const printRecords = loadConstituencyPrintRecords(
    resolved === "All" ? null : resolved,
  );

  const sentiment = emptySentiment();
  const media = {
    print: printRecords.length,
    youtube: 0,
    x: 0,
    online: 0,
  };
  const mediaSentiment = {
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

  return {
    constituency: resolved,
    total: records.length,
    printTotal: printRecords.length,
    sentiment,
    media,
    mediaSentiment,
    dailyTrend: buildDailyTrend(records),
    topProfiles: topCounts(records, (r) => r.profile, 10),
    languageDistribution: topCounts(records, (r) => r.language, 10),
  };
}

export function getConstituencyMedia(
  filters: GlobalFilters & {
    constituency?: string | null;
    mediaType?: MediaType | "All" | null;
  },
): MediaQueryResponse {
  const resolved = resolveConstituencyFilter(filters.constituency);
  const all = loadRecords();
  const records = filterRecords(all, {
    ...filters,
    constituency: resolved,
    district: null,
  });
  const sorted = records.sort(
    (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0),
  );
  return {
    district: null,
    constituency: resolved,
    mediaType: filters.mediaType ?? "All",
    total: sorted.length,
    records: sorted,
  };
}
