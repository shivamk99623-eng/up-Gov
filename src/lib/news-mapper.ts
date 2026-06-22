import "server-only";
import { formatCalendarDate } from "./dates";
import {
  parseDistrictNames,
  parseJsonStringArray,
} from "./json-fields";
import { resolveDistrictName } from "./geo";
import type {
  NewsArrayFields,
  OnlineRecord,
  PrintRecord,
  PrintSourceType,
  Sentiment,
  XRecord,
  YouTubeRecord,
} from "./types";

export type DigitalMediaKind = "YouTube" | "X" | "Online";

export interface RawNewsRow {
  newsId: string;
  Heading: string | null;
  Summary: string | null;
  CreatedAt: string | null;
  CCM: string | null;
  Content: string | null;
  Language: string | null;
  Sentiment: string | null;
  Authors: string | null;
  District: string | null;
  Constituency: string | null;
  MLA: string | null;
  Loksabha_MP: string | null;
  Rajyasabha_MP: string | null;
  Publication?: string | null;
  Edition?: string | null;
  website?: string | null;
  handles?: string | null;
  channel?: string | null;
  duration?: string | null;
  link?: string | null;
}

function normalizeSentiment(value: unknown): Sentiment {
  const s = String(value ?? "").trim().toLowerCase();
  if (s.startsWith("pos")) return "Positive";
  if (s.startsWith("neg")) return "Negative";
  return "Neutral";
}

function parseTimestamp(value: string | null): {
  date: string | null;
  timestamp: number | null;
} {
  if (!value?.trim()) return { date: null, timestamp: null };
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return { date: null, timestamp: null };
  return { date: formatCalendarDate(ts), timestamp: ts };
}

/** Parses JSON array TEXT columns from news tables into structured arrays. */
export function extractNewsArrayFields(row: RawNewsRow): NewsArrayFields & {
  district: string;
  constituency: string;
} {
  const districts = parseDistrictNames(row.District).map(resolveDistrictName);
  const constituencies = parseJsonStringArray(row.Constituency);
  const mla = parseJsonStringArray(row.MLA);
  const loksabhaMp = parseJsonStringArray(row.Loksabha_MP);
  const rajyasabhaMp = parseJsonStringArray(row.Rajyasabha_MP);
  return {
    districts,
    constituencies,
    mla,
    loksabhaMp,
    rajyasabhaMp,
    district: districts[0] ?? "",
    constituency: constituencies[0] ?? "",
  };
}

function buildHeadline(row: RawNewsRow): string {
  return (
    row.Heading?.trim() ||
    row.Summary?.trim()?.slice(0, 120) ||
    row.Content?.trim()?.slice(0, 120) ||
    "(No headline)"
  );
}

function baseDigitalFields<K extends DigitalMediaKind>(row: RawNewsRow, kind: K) {
  const { date, timestamp } = parseTimestamp(row.CreatedAt);
  const arrays = extractNewsArrayFields(row);
  return {
    id: row.newsId,
    mediaType: kind,
    headline: buildHeadline(row),
    summary: row.Summary?.trim() || null,
    content: row.Content?.trim() ?? row.Summary?.trim() ?? "",
    ccm: row.CCM?.trim() || null,
    language: row.Language?.trim() || "Unknown",
    sentiment: normalizeSentiment(row.Sentiment),
    authors: row.Authors?.trim() ?? "",
    date,
    timestamp,
    link: row.link?.trim() || null,
    ...arrays,
  };
}

export function isKnownLanguage(language: string | null | undefined): boolean {
  const v = language?.trim();
  if (!v) return false;
  return v.toLowerCase() !== "unknown";
}

export function rowToYouTubeRecord(row: RawNewsRow): YouTubeRecord {
  return {
    ...baseDigitalFields(row, "YouTube"),
    channel: row.channel?.trim() || null,
    duration: row.duration?.trim() || null,
  };
}

export function rowToXRecord(row: RawNewsRow): XRecord {
  return {
    ...baseDigitalFields(row, "X"),
    handles: row.handles?.trim() || null,
  };
}

export function rowToOnlineRecord(row: RawNewsRow): OnlineRecord {
  return {
    ...baseDigitalFields(row, "Online"),
    website: row.website?.trim() || null,
  };
}

function inferPrintScope(row: RawNewsRow): {
  sourceType: PrintSourceType;
  scope: string;
} {
  const arrays = extractNewsArrayFields(row);
  if (arrays.mla.length) return { sourceType: "mla", scope: arrays.mla[0] };
  if (arrays.loksabhaMp.length || arrays.rajyasabhaMp.length) {
    return {
      sourceType: "mp",
      scope: arrays.loksabhaMp[0] ?? arrays.rajyasabhaMp[0],
    };
  }
  if (arrays.constituencies.length) {
    return { sourceType: "constituency", scope: arrays.constituencies[0] };
  }
  if (arrays.districts.length) {
    return { sourceType: "district", scope: arrays.districts[0] };
  }
  return { sourceType: "district", scope: "" };
}

export function rowToPrintRecord(row: RawNewsRow): PrintRecord {
  const { sourceType, scope } = inferPrintScope(row);
  const { date, timestamp } = parseTimestamp(row.CreatedAt);
  const arrays = extractNewsArrayFields(row);
  return {
    id: row.newsId,
    sourceType,
    scope,
    srNo: null,
    headline: buildHeadline(row),
    summary: row.Summary?.trim() || null,
    content: row.Content?.trim() ?? row.Summary?.trim() ?? "",
    publication: row.Publication?.trim() ?? "",
    author: row.Authors?.trim() ?? "",
    edition: row.Edition?.trim() ?? "",
    pageNo: null,
    sentiment: normalizeSentiment(row.Sentiment),
    ccm: row.CCM?.trim() || null,
    language: row.Language?.trim() || "Unknown",
    date,
    timestamp,
    ...arrays,
  };
}

export const DIGITAL_TABLES: Record<DigitalMediaKind, string> = {
  YouTube: "news_youtube",
  X: "news_x",
  Online: "news_online",
};

export const PRINT_TABLE = "news_print";

export const NEWS_ROW_COLUMNS = `
  "newsId", "Heading", "Summary", "CreatedAt", "CCM", "Content",
  "Language", "Sentiment", "Authors", "District", "Constituency",
  "MLA", "Loksabha_MP", "Rajyasabha_MP"
`;

export const PRINT_ROW_COLUMNS = `${NEWS_ROW_COLUMNS}, "Publication", "Edition"`;
export const YOUTUBE_ROW_COLUMNS = `${NEWS_ROW_COLUMNS}, "channel", "duration", "link"`;
export const ONLINE_ROW_COLUMNS = `${NEWS_ROW_COLUMNS}, "website", "link"`;
export const X_ROW_COLUMNS = `${NEWS_ROW_COLUMNS}, "handles", "link"`;

export const TABLE_COLUMNS: Record<DigitalMediaKind | "Print", string> = {
  YouTube: YOUTUBE_ROW_COLUMNS,
  X: X_ROW_COLUMNS,
  Online: ONLINE_ROW_COLUMNS,
  Print: PRINT_ROW_COLUMNS,
};

export function columnsForKind(kind: DigitalMediaKind): string {
  return TABLE_COLUMNS[kind];
}

export type TableKind = DigitalMediaKind | "Print";

export function tableForKind(kind: TableKind): string {
  if (kind === "Print") return PRINT_TABLE;
  return DIGITAL_TABLES[kind];
}
