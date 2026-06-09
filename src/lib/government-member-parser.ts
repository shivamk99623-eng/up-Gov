import "server-only";
import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";
import type { House } from "./types";

const DATA_FILE = path.join(
  process.cwd(),
  "data",
  "UP Government Member Data.xlsx",
);

export type GovernmentMemberKind = "mp" | "mla";

export interface GovernmentMemberRecord {
  name: string;
  currentEmployment: string | null;
  highestQualification: string | null;
  /** Set for rows from the MP List sheet. */
  house?: House | null;
}

interface SheetParseResult {
  lookup: Map<string, GovernmentMemberRecord>;
  members: GovernmentMemberRecord[];
}

interface GovCache {
  mtimeMs: number;
  mp: SheetParseResult;
  mla: SheetParseResult;
}

let cache: GovCache | null = null;

function cleanText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).replace(/\u00a0/g, " ").trim().replace(/\s+/g, " ");
  return text || null;
}

function parseNameParts(name: string): { title: string | null; core: string } {
  const trimmed = name.replace(/\u00a0/g, " ").trim().replace(/\s+/g, " ");
  const titleMatch = trimmed.match(/^(shri\.?|smt\.?|dr\.?\s*)/i);
  let title: string | null = null;
  let rest = trimmed;

  if (titleMatch) {
    const raw = titleMatch[1].toLowerCase().replace(/\./g, "").trim();
    if (raw.startsWith("shri")) title = "shri";
    else if (raw.startsWith("smt")) title = "smt";
    else if (raw.startsWith("dr")) title = "dr";
    rest = trimmed.slice(titleMatch[0].length).trim();
  }

  const core = rest.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  return { title, core };
}

/** Known spelling variants in UP government / media datasets. */
function coreVariants(core: string): string[] {
  const variants = new Set<string>([core]);
  if (core.includes("dharampal")) {
    variants.add(core.replace(/dharampal/g, "dharmpal"));
  }
  if (core.includes("dharmpal")) {
    variants.add(core.replace(/dharmpal/g, "dharampal"));
  }
  return [...variants];
}

function makeKey(title: string | null, core: string): string {
  return title ? `${title}|${core}` : core;
}

function personKey(name: string): string {
  const { title, core } = parseNameParts(name);
  return makeKey(title, core);
}

function recordRichness(record: GovernmentMemberRecord): number {
  return (
    (record.currentEmployment ? 2 : 0) +
    (record.highestQualification ? 1 : 0)
  );
}

/** Normalizes names for cross-source lookup (legacy / loose match). */
export function normalizeGovernmentMemberName(name: string): string {
  return parseNameParts(name).core;
}

function lookupKeys(name: string): string[] {
  const { title, core } = parseNameParts(name);
  const keys: string[] = [];

  if (title) {
    for (const variant of coreVariants(core)) {
      keys.push(makeKey(title, variant));
    }
  }
  for (const variant of coreVariants(core)) {
    keys.push(variant);
  }

  return [...new Set(keys)];
}

function setLookupKey(
  map: Map<string, GovernmentMemberRecord>,
  key: string,
  record: GovernmentMemberRecord,
): void {
  const existing = map.get(key);
  if (!existing || recordRichness(record) > recordRichness(existing)) {
    map.set(key, record);
  }
}

function indexRecord(
  map: Map<string, GovernmentMemberRecord>,
  record: GovernmentMemberRecord,
): void {
  const { title, core } = parseNameParts(record.name);

  if (title) {
    for (const variant of coreVariants(core)) {
      setLookupKey(map, makeKey(title, variant), record);
    }
  }

  for (const variant of coreVariants(core)) {
    setLookupKey(map, variant, record);
  }
}

function colIndex(row: unknown[], label: string): number {
  const target = label.toLowerCase();
  return row.findIndex(
    (cell) => cleanText(cell)?.toLowerCase() === target,
  );
}

/**
 * Sheets use a two-row header:
 * Row 0 — group headers: "Professional Experience", "Educational Background", …
 * Row 1 — sub-columns: "Current Employment", "Highest Qualification", …
 */
function parseHouse(value: unknown): House | null {
  const text = cleanText(value)?.toLowerCase() ?? "";
  if (text.includes("rajya")) return "Rajya Sabha";
  if (text.includes("lok")) return "Lok Sabha";
  return null;
}

function parseSheet(sheetName: "MP List" | "MLA List"): SheetParseResult {
  const lookup = new Map<string, GovernmentMemberRecord>();
  const unique = new Map<string, GovernmentMemberRecord>();

  if (!fs.existsSync(DATA_FILE)) {
    return { lookup, members: [] };
  }

  const buffer = fs.readFileSync(DATA_FILE);
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const ws = wb.Sheets[sheetName];
  if (!ws) return { lookup, members: [] };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
    raw: false,
  });

  if (rows.length < 3) return { lookup, members: [] };

  const groupHeader = rows[0] ?? [];
  const subHeader = rows[1] ?? [];

  const nameCol = colIndex(groupHeader, "Name");
  const houseCol =
    sheetName === "MP List"
      ? colIndex(groupHeader, "House (Rajya Sabha/Lok Sabha)")
      : -1;
  const currentEmploymentCol = colIndex(subHeader, "Current Employment");
  const highestQualificationCol = colIndex(subHeader, "Highest Qualification");

  if (nameCol < 0 || currentEmploymentCol < 0 || highestQualificationCol < 0) {
    return { lookup, members: [] };
  }

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const name = cleanText(row[nameCol]);
    if (!name) continue;

    const record: GovernmentMemberRecord = {
      name,
      currentEmployment: cleanText(row[currentEmploymentCol]),
      highestQualification: cleanText(row[highestQualificationCol]),
      house:
        sheetName === "MP List" && houseCol >= 0
          ? parseHouse(row[houseCol])
          : null,
    };

    const pk = personKey(name);
    const existing = unique.get(pk);
    if (!existing || recordRichness(record) > recordRichness(existing)) {
      unique.set(pk, record);
    }
  }

  const members = [...unique.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const record of members) {
    indexRecord(lookup, record);
  }

  return { lookup, members };
}

function ensureCache(): GovCache {
  const mtimeMs = fs.existsSync(DATA_FILE)
    ? fs.statSync(DATA_FILE).mtimeMs
    : 0;
  if (cache && cache.mtimeMs === mtimeMs) return cache;

  cache = {
    mtimeMs,
    mp: parseSheet("MP List"),
    mla: parseSheet("MLA List"),
  };
  return cache;
}

/** All unique members from the government MLA sheet. */
export function listGovernmentMlaMembers(): GovernmentMemberRecord[] {
  return [...ensureCache().mla.members];
}

/** All unique members from the government MP sheet. */
export function listGovernmentMpMembers(): GovernmentMemberRecord[] {
  return [...ensureCache().mp.members];
}

/** Looks up government member profile by name for MP or MLA sheets. */
export function lookupGovernmentMember(
  name: string,
  kind: GovernmentMemberKind,
): GovernmentMemberRecord | null {
  const map =
    kind === "mp" ? ensureCache().mp.lookup : ensureCache().mla.lookup;
  for (const key of lookupKeys(name)) {
    const hit = map.get(key);
    if (hit) return hit;
  }
  return null;
}
