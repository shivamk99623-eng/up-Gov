import "server-only";
import { getDb } from "./db";
import { parseJsonStringArray } from "./json-fields";
import { constituencyDedupeKey } from "./constituency-detail";

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

let assemblyLookup: Map<string, string> | null = null;

function upLegislativeTableExists(): boolean {
  return !!getDb()
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Up_legislative'")
    .get();
}

/** Dropdown options: strictly from Up_legislative.assembly. */
export function listLegislativeAssemblies(): string[] {
  if (!upLegislativeTableExists()) return [];

  const rows = getDb()
    .prepare(
      `SELECT assembly FROM Up_legislative WHERE assembly IS NOT NULL AND trim(assembly) != '' ORDER BY assembly`,
    )
    .all() as { assembly: string }[];

  return rows.map((r) => r.assembly.trim()).filter(Boolean);
}

function buildAssemblyLookup(): Map<string, string> {
  if (assemblyLookup) return assemblyLookup;

  const lookup = new Map<string, string>();

  const addAlias = (name: string, canonical: string) => {
    const lower = name.toLowerCase();
    lookup.set(lower, canonical);
    lookup.set(lower.replace(/\s+/g, ""), canonical);
    lookup.set(normalizeKey(name), canonical);
    const stripped = name.replace(/\s*\((sc|st|general)\)\s*/gi, "").trim();
    lookup.set(stripped.toLowerCase(), canonical);
    lookup.set(normalizeKey(stripped), canonical);
  };

  const assemblies = listLegislativeAssemblies();
  for (const assembly of assemblies) {
    addAlias(assembly, assembly);
  }

  const newsTables = ["news_print", "news_online", "news_x", "news_youtube"];
  for (const table of newsTables) {
    const exists = getDb()
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table);
    if (!exists) continue;
    const rows = getDb()
      .prepare(`SELECT "Constituency" AS c FROM "${table}" WHERE "Constituency" IS NOT NULL`)
      .all() as { c: string }[];
    for (const { c } of rows) {
      for (const token of parseJsonStringArray(c)) {
        if (!token) continue;
        const resolved =
          assemblies.find((a) => normalizeKey(a) === normalizeKey(token)) ?? token;
        addAlias(token, resolved);
      }
    }
  }

  assemblyLookup = lookup;
  return lookup;
}

export function resolveLegislativeAssemblyToken(token: string): string | null {
  const t = token.trim();
  if (!t) return null;
  const lookup = buildAssemblyLookup();
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

export function resolveLegislativeAssemblyFilter(
  assembly: string | null | undefined,
): string | null {
  if (!assembly || assembly === "All") return null;
  return (
    resolveLegislativeAssemblyToken(assembly) ??
    resolveLegislativeAssemblyToken(
      assembly.replace(/\s*\((sc|st|general)\)\s*/gi, "").trim(),
    ) ??
    assembly
  );
}

export function legislativeAssemblyDedupeKey(name: string): string {
  return constituencyDedupeKey(name);
}
