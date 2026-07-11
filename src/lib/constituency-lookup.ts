import "server-only";
import { getDb } from "./db";
import { parseJsonStringArray } from "./json-fields";
import {
  resolveConstituencyDetailName,
  stripReservationSuffix,
} from "./constituency-detail";
import type { ConstituencyScope } from "./types";

const CONSTITUENCY_ALIASES: Record<string, string> = {
  ambedkarnagar: "Ambedkarnagar",
  badaun: "Badaun",
  kushinagar: "kushinagar",
  "misrikh (sc)": "Misrikh (SC)",
  "sant kabir nagar": "Sant Kabir Nagar",
  "gautam buddha nagar": "Gautam Buddha Nagar",
  kanpur: "Kanpur",
};

let constituencyLookup: Map<string, string> | null = null;
let constituencyList: string[] | null = null;
let legislativeConstituencyLookup: Map<string, string> | null = null;
let legislativeConstituencyList: string[] | null = null;

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

function buildConstituencyLookup(scope: ConstituencyScope = "parliamentary"): Map<string, string> {
  if (scope === "parliamentary" && constituencyLookup) return constituencyLookup;
  if (scope === "legislative" && legislativeConstituencyLookup) return legislativeConstituencyLookup;

  const canonical = new Set<string>();
  const tables = ["news_print", "news_online", "news_x", "news_youtube"];
  const db = getDb();

  const column =
    scope === "legislative" ? '"Constituency"' : '"LK_Constituency"';
  for (const table of tables) {
    const exists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table);
    if (!exists) continue;
    const rows = db
      .prepare(`SELECT ${column} AS c FROM "${table}" WHERE ${column} IS NOT NULL`)
      .all() as { c: string }[];

    for (const { c } of rows) {
      for (const name of parseJsonStringArray(c)) {
        if (name) canonical.add(name);
      }
    }
  }

  const detailExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='constituency'")
    .get();
  if (detailExists && scope === "parliamentary") {
    const detailRows = db
      .prepare(`SELECT constituency_name FROM constituency`)
      .all() as { constituency_name: string }[];
    for (const { constituency_name } of detailRows) {
      if (constituency_name?.trim()) canonical.add(constituency_name.trim());
    }
  }

  const lookup = new Map<string, string>();

  const preferPlainName = (existing: string | undefined, name: string): string => {
    if (!existing) return name;
    const existingHasRes = /\((sc|st|general)\)/i.test(existing);
    const nameHasRes = /\((sc|st|general)\)/i.test(name);
    // Prefer news-style plain names ("Agra") over detail labels ("Agra (SC)")
    if (existingHasRes && !nameHasRes) return name;
    if (!existingHasRes && nameHasRes) return existing;
    return existing;
  };

  const setAlias = (key: string, name: string) => {
    lookup.set(key, preferPlainName(lookup.get(key), name));
  };

  for (const name of canonical) {
    const lower = name.toLowerCase();
    setAlias(lower, name);
    setAlias(lower.replace(/\s+/g, ""), name);
    setAlias(normalizeKey(name), name);
    const stripped = name.replace(/\s*\((sc|st|general)\)\s*/gi, "").trim();
    setAlias(stripped.toLowerCase(), name);
    setAlias(normalizeKey(stripped), name);
  }

  for (const [alias, resolved] of Object.entries(CONSTITUENCY_ALIASES)) {
    setAlias(alias, resolved);
    setAlias(alias.replace(/\s+/g, ""), resolved);
  }

  if (scope === "parliamentary") {
    constituencyLookup = lookup;
    constituencyList = [...canonical].sort();
  } else {
    legislativeConstituencyLookup = lookup;
    legislativeConstituencyList = [...canonical].sort();
  }
  return lookup;
}

export function listConstituencies(scope: ConstituencyScope = "parliamentary"): string[] {
  buildConstituencyLookup(scope);
  return scope === "legislative"
    ? [...(legislativeConstituencyList ?? [])]
    : [...(constituencyList ?? [])];
}

export function resolveConstituencyToken(
  token: string,
  scope: ConstituencyScope = "parliamentary",
): string | null {
  const t = token.trim();
  if (!t) return null;
  const lookup = buildConstituencyLookup(scope);
  const lower = t.toLowerCase();
  const stripped = t.replace(/\s*\((sc|st|general)\)\s*/gi, "").trim();
  return (
    lookup.get(lower) ??
    lookup.get(lower.replace(/\s+/g, "")) ??
    lookup.get(normalizeKey(t)) ??
    lookup.get(stripped.toLowerCase()) ??
    lookup.get(normalizeKey(stripped)) ??
    null
  );
}

export function isKnownConstituency(
  constituency: string | null | undefined,
  scope: ConstituencyScope = "parliamentary",
): boolean {
  if (!constituency?.trim()) return false;
  return resolveConstituencyFilter(constituency, scope) !== null;
}

/** Resolves UI / detail-table names to a news-table constituency token. */
export function resolveConstituencyFilter(
  constituency: string | null | undefined,
  scope: ConstituencyScope = "parliamentary",
): string | null {
  if (!constituency || constituency === "All") return null;

  const fromNews = resolveConstituencyToken(constituency, scope);
  if (fromNews) return fromNews;

  if (scope === "parliamentary") {
    const fromDetail = resolveConstituencyDetailName(constituency);
    if (fromDetail) {
      return (
        resolveConstituencyToken(fromDetail, scope) ??
        resolveConstituencyToken(stripReservationSuffix(fromDetail), scope) ??
        stripReservationSuffix(fromDetail)
      );
    }
  }

  return (
    resolveConstituencyToken(stripReservationSuffix(constituency), scope) ??
    constituency
  );
}
