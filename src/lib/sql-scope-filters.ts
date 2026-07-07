import "server-only";
import { resolveConstituencyFilter } from "./constituency-lookup";
import { resolveLegislativeAssemblyFilter } from "./legislative-lookup";
import { resolveDistrictName, toGeoName } from "./geo";
import { entitySearchLikePatterns, tokenizeSearch } from "./name-search";
import { MIN_SEARCH_TOKEN_LENGTH } from "./search-filter";
import type { ConstituencyScope, GlobalFilters } from "./types";

type EntityPersonColumn = "MLA" | "Loksabha_MP" | "Rajyasabha_MP";

export function entityColumnsForFilters(
  filters: GlobalFilters,
): EntityPersonColumn[] {
  if (filters.printSource === "mla") return ["MLA"];
  if (filters.printSource === "mp") return ["Loksabha_MP", "Rajyasabha_MP"];
  return ["MLA", "Loksabha_MP", "Rajyasabha_MP"];
}

export function buildEntitySqlPrefilter(
  entity: string,
  columns: EntityPersonColumn[],
): { sql: string; params: string[] } | null {
  const patterns = entitySearchLikePatterns(entity);
  if (!patterns.length || !columns.length) return null;

  const parts: string[] = [];
  const params: string[] = [];
  for (const col of columns) {
    for (const pat of patterns) {
      parts.push(`"${col}" LIKE ?`);
      params.push(pat);
    }
  }
  return { sql: `(${parts.join(" OR ")})`, params };
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
  const patterns = [
    `%"${resolved.replace(/"/g, "")}"%`,
    `%${resolved}%`,
  ];
  return {
    sql: `(${patterns.map(() => `"${column}" LIKE ?`).join(" OR ")})`,
    params: patterns,
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
