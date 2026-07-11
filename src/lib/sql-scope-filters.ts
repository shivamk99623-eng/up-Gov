import "server-only";
import { getDb } from "./db";
import { resolveConstituencyFilter } from "./constituency-lookup";
import { resolveLegislativeAssemblyFilter } from "./legislative-lookup";
import { resolveDistrictName, toGeoName } from "./geo";
import {
  entitySearchLikePatterns,
  entitySearchTokenGroups,
  tokenizeSearch,
} from "./name-search";
import { MIN_SEARCH_TOKEN_LENGTH } from "./search-filter";
import type { ConstituencyScope, GlobalFilters } from "./types";
import type { TableKind } from "./news-mapper";

type EntityPersonColumn = "MLA" | "Loksabha_MP" | "Rajyasabha_MP";

let entityTokenIndexAvailable: boolean | null = null;

/** True when news_entity_token has been built (see create_entity_index.js). */
export function hasEntityTokenIndex(): boolean {
  if (entityTokenIndexAvailable != null) return entityTokenIndexAvailable;
  try {
    entityTokenIndexAvailable = !!getDb()
      .prepare(
        `SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'news_entity_token'`,
      )
      .get();
  } catch {
    entityTokenIndexAvailable = false;
  }
  return entityTokenIndexAvailable;
}

export function entityColumnsForFilters(
  filters: GlobalFilters,
): EntityPersonColumn[] {
  if (filters.printSource === "mla") return ["MLA"];
  if (filters.printSource === "mp") return ["Loksabha_MP", "Rajyasabha_MP"];
  return ["MLA", "Loksabha_MP", "Rajyasabha_MP"];
}

/**
 * Person-entity prefilter. Prefers the news_entity_token index (exact token
 * match) when available; falls back to LIKE on JSON columns.
 * Multi-token names require every token group to match (AND), so chart and
 * table counts stay aligned and avoid loose single-token hits.
 */
export function buildEntitySqlPrefilter(
  entity: string,
  columns: EntityPersonColumn[],
  kind: TableKind,
): { sql: string; params: string[] } | null {
  if (!columns.length) return null;

  const groups = entitySearchTokenGroups(entity);
  if (!groups.length) return null;

  if (hasEntityTokenIndex()) {
    const rolePlaceholders = columns.map(() => "?").join(", ");
    const params: string[] = [];
    const groupSql = groups.map((group) => {
      const tokenPlaceholders = group.map(() => "?").join(", ");
      params.push(kind, ...columns, ...group);
      return `"id" IN (
        SELECT "row_id" FROM "news_entity_token"
        WHERE "kind" = ?
          AND "role" IN (${rolePlaceholders})
          AND "token" IN (${tokenPlaceholders})
      )`;
    });
    return { sql: `(${groupSql.join(" AND ")})`, params };
  }

  // LIKE fallback: each token group must hit at least one person column.
  const params: string[] = [];
  const groupSql = groups.map((group) => {
    const parts: string[] = [];
    for (const col of columns) {
      for (const token of group) {
        parts.push(`"${col}" LIKE ?`);
        params.push(`%${token}%`);
      }
    }
    return `(${parts.join(" OR ")})`;
  });
  return { sql: `(${groupSql.join(" AND ")})`, params };
}

function districtLikePatterns(district: string): string[] {
  const canonical = resolveDistrictName(district);
  const geo = toGeoName(canonical);
  const names = new Set(
    [district.trim(), canonical, geo].filter(Boolean),
  );
  const patterns = new Set<string>();
  for (const name of names) {
    patterns.add(`%"${name.replace(/"/g, "")}"%`);
    patterns.add(`%${name}%`);
  }
  return [...patterns];
}

/** Matches rows whose JSON/text District column references the given district. */
export function buildDistrictSqlFilter(
  district: string,
): { sql: string; params: string[] } {
  const patterns = districtLikePatterns(district);
  return {
    sql: `(${patterns.map(() => `"District" LIKE ?`).join(" OR ")})`,
    params: patterns,
  };
}

export function buildConstituencySqlFilter(
  constituency: string,
  scope: ConstituencyScope,
): { sql: string; params: string[] } | null {
  const resolved =
    scope === "legislative"
      ? (resolveLegislativeAssemblyFilter(constituency) ?? constituency)
      : (resolveConstituencyFilter(constituency, scope) ?? constituency);
  if (!resolved?.trim()) return null;

  const column = scope === "legislative" ? "Constituency" : "LK_Constituency";
  const stripped = resolved.replace(/\s*\((sc|st|general)\)\s*/gi, "").trim();
  const names = [...new Set([resolved, stripped].filter(Boolean))];
  const patterns: string[] = [];
  const params: string[] = [];
  for (const name of names) {
    patterns.push(`"${column}" LIKE ?`);
    params.push(`%"${name.replace(/"/g, "")}"%`);
    patterns.push(`"${column}" LIKE ?`);
    params.push(`%${name}%`);
  }
  return {
    sql: `(${patterns.join(" OR ")})`,
    params,
  };
}

export function buildPrintSourceSqlFilter(
  filters: GlobalFilters,
): { sql: string; params: string[] } | null {
  const { printSource, district } = filters;
  if (!printSource) return null;

  if (printSource === "district") {
    if (district && district !== "All") {
      const dist = buildDistrictSqlFilter(district);
      return {
        sql: `(
          (${dist.sql})
          OR (trim(coalesce("Constituency", '')) NOT IN ('', '[]'))
          OR (trim(coalesce("LK_Constituency", '')) NOT IN ('', '[]'))
          OR (
            (trim(coalesce("MLA", '')) IN ('', '[]') OR "MLA" IS NULL)
            AND (trim(coalesce("Loksabha_MP", '')) IN ('', '[]') OR "Loksabha_MP" IS NULL)
            AND (trim(coalesce("Rajyasabha_MP", '')) IN ('', '[]') OR "Rajyasabha_MP" IS NULL)
            AND (${dist.sql})
          )
        )`,
        params: [...dist.params, ...dist.params],
      };
    }
    return {
      sql: `(trim(coalesce("District", '')) NOT IN ('', '[]') AND "District" IS NOT NULL)`,
      params: [],
    };
  }

  if (printSource === "mla") {
    return {
      sql: `(trim(coalesce("MLA", '')) NOT IN ('', '[]') AND "MLA" IS NOT NULL)`,
      params: [],
    };
  }

  if (printSource === "mp") {
    return {
      sql: `(
        (trim(coalesce("Loksabha_MP", '')) NOT IN ('', '[]') AND "Loksabha_MP" IS NOT NULL)
        OR (trim(coalesce("Rajyasabha_MP", '')) NOT IN ('', '[]') AND "Rajyasabha_MP" IS NOT NULL)
      )`,
      params: [],
    };
  }

  return null;
}

/** Per-table text columns used for SQL search (must match actual SQLite schema). */
export const SEARCH_TEXT_COLUMNS: Record<
  "Print" | "YouTube" | "X" | "Online",
  string[]
> = {
  Print: [
    '"Heading"',
    '"Summary"',
    '"Authors"',
    '"Publication"',
    '"Edition"',
  ],
  YouTube: ['"Heading"', '"Summary"', '"Content"', '"Channel"'],
  X: ['"Heading"', '"Summary"', '"handles"'],
  Online: [
    '"Heading"',
    '"Summary"',
    '"Content"',
    '"Authors"',
    '"Website"',
  ],
};

const SEARCH_SCOPE_COLUMNS = [
  '"District"',
  '"Constituency"',
  '"LK_Constituency"',
  '"MLA"',
  '"Loksabha_MP"',
  '"Rajyasabha_MP"',
];

export function buildSearchSqlPrefilter(
  search: string,
  kind: keyof typeof SEARCH_TEXT_COLUMNS,
): { sql: string; params: string[] } | null {
  const tokens = tokenizeSearch(search).filter(
    (t) => t.length >= MIN_SEARCH_TOKEN_LENGTH,
  );
  if (!tokens.length) return null;

  const columns = [...SEARCH_TEXT_COLUMNS[kind], ...SEARCH_SCOPE_COLUMNS];
  const parts: string[] = [];
  const params: string[] = [];

  for (const token of tokens) {
    const pattern = `%${token}%`;
    const checks = columns
      .map((col) => `lower(coalesce(${col}, '')) LIKE ?`)
      .join(" OR ");
    parts.push(`(${checks})`);
    params.push(...columns.map(() => pattern));
  }

  return { sql: parts.join(" AND "), params };
}
