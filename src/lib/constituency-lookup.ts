import "server-only";
import { getDb } from "./db";
import { parseJsonStringArray } from "./json-fields";

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

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

function buildConstituencyLookup(): Map<string, string> {
  if (constituencyLookup) return constituencyLookup;

  const canonical = new Set<string>();
  const tables = ["news_print", "news_online", "news_x", "news_youtube"];
  const db = getDb();

  for (const table of tables) {
    const exists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table);
    if (!exists) continue;
    const rows = db
      .prepare(`SELECT "Constituency" AS c FROM "${table}" WHERE "Constituency" IS NOT NULL`)
      .all() as { c: string }[];

    for (const { c } of rows) {
      // console.log(c);
      for (const name of parseJsonStringArray(c)) {
        if (name) canonical.add(name);
      }
    }
  }

  const lookup = new Map<string, string>();
  for (const name of canonical) {
    const lower = name.toLowerCase();
    lookup.set(lower, name);
    lookup.set(lower.replace(/\s+/g, ""), name);
    lookup.set(normalizeKey(name), name);
    const stripped = name.replace(/\s*\((sc|st|general)\)\s*/gi, "").trim();
    lookup.set(stripped.toLowerCase(), name);
    lookup.set(normalizeKey(stripped), name);
  }

  for (const [alias, resolved] of Object.entries(CONSTITUENCY_ALIASES)) {
    lookup.set(alias, resolved);
    lookup.set(alias.replace(/\s+/g, ""), resolved);
  }

  constituencyLookup = lookup;
  constituencyList = [...canonical].sort();
  return lookup;
}

export function listConstituencies(): string[] {
  buildConstituencyLookup();
  return [...(constituencyList ?? [])];
}

export function resolveConstituencyToken(token: string): string | null {
  const t = token.trim();
  if (!t) return null;
  const lookup = buildConstituencyLookup();
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
): boolean {
  if (!constituency?.trim()) return false;
  return resolveConstituencyToken(constituency) !== null;
}
