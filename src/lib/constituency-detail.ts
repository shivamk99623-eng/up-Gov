import "server-only";
import { getDb } from "./db";
import { parseJsonStringArray } from "./json-fields";
import type {
  ConstituencyCasteSegment,
  ConstituencyDetailResponse,
  ConstituencyElectionResult,
  ConstituencyInsight,
  ConstituencyPartyOrg,
} from "./types";

interface RawElection {
  winner_name?: string | null;
  winner_party?: string | null;
  total_candidates?: number | string | null;
  total_votes_polled?: number | string | null;
  exit_poll_results?: string | null;
}

interface RawCaste {
  most_populated?: string | null;
  second_majority?: string | null;
  rest?: string | null;
}

interface RawPartyOrg {
  jiladhyaksha?: string | null;
  mahanagar?: string | null;
  mandal?: string | null;
  jilapratinidhi?: string | null;
  boothadhyaksha?: string | null;
}

interface ConstituencyRow {
  sr_no: string | number | null;
  person_allotted_to: string | null;
  constituency_name: string;
  reservation_status: string | null;
  assembly_segments: string | null;
  total_population: number | string | null;
  caste: string | null;
  election_2024: string | null;
  election_2019: string | null;
  election_2014: string | null;
  election_2009: string | null;
  election_2004: string | null;
  party_organization: string | null;
}

const ELECTION_YEARS = [2024, 2019, 2014, 2009, 2004] as const;

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

/** Strip reservation suffix for matching — (SC)/(ST) is not a separate constituency. */
export function stripReservationSuffix(name: string): string {
  return name.replace(/\s*\((sc|st|general)\)\s*/gi, "").trim();
}

export function constituencyDedupeKey(name: string): string {
  return normalizeKey(stripReservationSuffix(name));
}

export function dedupeConstituencyNames(names: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const name of names) {
    const key = constituencyDedupeKey(name);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, name);
      continue;
    }
    const hasSuffix = /\((sc|st)\)/i.test(name);
    const existingHasSuffix = /\((sc|st)\)/i.test(existing);
    if (hasSuffix && !existingHasSuffix) {
      byKey.set(key, name);
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value?.trim()) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "" || value === "-") return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const cleaned = String(value).replace(/,/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

function cleanText(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s === "-" || s.toUpperCase() === "NA") return null;
  return s;
}

function parsePercentageValue(raw: string): number | null {
  const t = raw.replace(/%/g, "").trim();
  if (!t) return null;

  const rangeMatch = t.match(/^([\d.]+)\s*[-–—−]\s*([\d.]+)$/);
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      return Math.round(((a + b) / 2) * 100) / 100;
    }
  }

  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

function parseCasteSegment(raw: string | null | undefined): ConstituencyCasteSegment | null {
  if (!raw?.trim()) return null;
  const text = raw.trim().replace(/\s+/g, " ");

  const colonMatch = text.match(/^(.+?)\s*[:：]\s*(.+)$/);
  if (colonMatch) {
    const pct = parsePercentageValue(colonMatch[2]);
    if (pct != null) return { label: colonMatch[1].trim(), percentage: pct };
  }

  const attachedMatch = text.match(/^(.+?)\(([\d.]+\s*[-–—−]?\s*[\d.]*)\s*%?\)$/);
  if (attachedMatch) {
    const pct = parsePercentageValue(attachedMatch[2]);
    if (pct != null) return { label: attachedMatch[1].trim(), percentage: pct };
  }

  const trailingMatch = text.match(
    /^(.+?)\s+([\d.]+\s*[-–—−]\s*[\d.]+|[\d.]+)\s*%?\s*$/,
  );
  if (trailingMatch) {
    const pct = parsePercentageValue(trailingMatch[2]);
    if (pct != null && pct <= 100) {
      return { label: trailingMatch[1].trim(), percentage: pct };
    }
  }

  const parenEndMatch = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenEndMatch) {
    const pct = parsePercentageValue(parenEndMatch[2]);
    if (pct != null) {
      return { label: parenEndMatch[1].trim(), percentage: pct };
    }
  }

  return { label: text, percentage: null };
}

function parseRestCommunities(raw: string | null | undefined): ConstituencyCasteSegment[] {
  if (!raw?.trim()) return [];
  const text = raw.trim();

  const whole = parseCasteSegment(text);
  if (whole?.percentage != null) {
    return [whole];
  }

  const parts = text
    .split(/[+/,;&]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const segments = parts
    .map((part) => parseCasteSegment(part))
    .filter((seg): seg is ConstituencyCasteSegment => !!seg);

  if (segments.some((s) => s.percentage != null)) {
    return segments;
  }

  return segments.length > 0 ? segments : [{ label: text, percentage: null }];
}

function parsePartyOrg(raw: RawPartyOrg | null | undefined): ConstituencyPartyOrg {
  return {
    jiladhyaksha: cleanText(raw?.jiladhyaksha),
    mahanagar: cleanText(raw?.mahanagar),
    mandal: cleanText(raw?.mandal),
    jilapratinidhi: cleanText(raw?.jilapratinidhi),
    boothadhyaksha: cleanText(raw?.boothadhyaksha),
  };
}

function parseElection(year: number, raw: RawElection | null): ConstituencyElectionResult {
  return {
    year,
    winnerName: cleanText(raw?.winner_name),
    winnerParty: cleanText(raw?.winner_party),
    totalCandidates: toNumber(raw?.total_candidates),
    totalVotesPolled: toNumber(raw?.total_votes_polled),
    exitPollResult: cleanText(raw?.exit_poll_results),
  };
}

function buildInsights(
  row: ConstituencyRow,
  elections: ConstituencyElectionResult[],
  caste: ConstituencyDetailResponse["caste"],
): ConstituencyInsight[] {
  const latest = elections[0];
  const parties = elections
    .map((e) => e.winnerParty)
    .filter((p): p is string => !!p);

  const partyCounts = new Map<string, number>();
  for (const p of parties) {
    partyCounts.set(p, (partyCounts.get(p) ?? 0) + 1);
  }
  const dominant = [...partyCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const trend =
    parties.length >= 2 && parties[0] === parties[1]
      ? `${parties[0]} won last 2 elections`
      : parties.length >= 2
        ? `Shifted from ${parties[1]} (${parties[1] ? elections[1].year : ""}) to ${parties[0]} (${latest?.year ?? ""})`
        : latest?.winnerParty
          ? `${latest.winnerParty} holds the seat`
          : "Insufficient election data";

  const communities = [
    caste.mostPopulated?.label,
    caste.secondMajority?.label,
    ...caste.rest.map((c) => c.label),
  ]
    .filter(Boolean)
    .slice(0, 4)
    .join(", ");

  const population = toNumber(row.total_population);

  return [
    {
      label: "Current Winning Party",
      value: latest?.winnerParty ?? "Not available",
    },
    { label: "Winning Trend", value: trend },
    {
      label: "Reservation Category",
      value: row.reservation_status ?? "General",
    },
    {
      label: "Population",
      value: population
        ? new Intl.NumberFormat("en-IN").format(population)
        : "Not available",
    },
    {
      label: "Major Communities",
      value: communities || "Not available",
    },
    {
      label: "Dominant Party (2004–2024)",
      value: dominant ? `${dominant[0]} (${dominant[1]} wins)` : "Not available",
    },
  ];
}

function rowToDetail(row: ConstituencyRow): ConstituencyDetailResponse {
  const casteRaw = parseJson<RawCaste>(row.caste);
  const caste = {
    mostPopulated: parseCasteSegment(casteRaw?.most_populated),
    secondMajority: parseCasteSegment(casteRaw?.second_majority),
    rest: parseRestCommunities(casteRaw?.rest),
  };

  const electionMap: Record<number, string | null> = {
    2024: row.election_2024,
    2019: row.election_2019,
    2014: row.election_2014,
    2009: row.election_2009,
    2004: row.election_2004,
  };

  const elections = ELECTION_YEARS.map((year) =>
    parseElection(year, parseJson<RawElection>(electionMap[year])),
  );

  const partyRaw = parseJson<{
    bjp?: RawPartyOrg;
    sp?: RawPartyOrg;
    bsp?: RawPartyOrg;
    inc?: RawPartyOrg;
  }>(row.party_organization);

  return {
    srNo: toNumber(row.sr_no),
    constituencyName: row.constituency_name,
    personAllottedTo: cleanText(row.person_allotted_to),
    reservationStatus: cleanText(row.reservation_status),
    assemblySegments: parseJsonStringArray(row.assembly_segments),
    totalPopulation: toNumber(row.total_population),
    caste,
    elections,
    insights: buildInsights(row, elections, caste),
    partyOrganization: {
      bjp: parsePartyOrg(partyRaw?.bjp),
      sp: parsePartyOrg(partyRaw?.sp),
      bsp: parsePartyOrg(partyRaw?.bsp),
      inc: parsePartyOrg(partyRaw?.inc),
    },
  };
}

let constituencyNameIndex: Map<string, string> | null = null;

function buildNameIndex(): Map<string, string> {
  if (constituencyNameIndex) return constituencyNameIndex;

  const db = getDb();
  const exists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='constituency'")
    .get();
  if (!exists) {
    constituencyNameIndex = new Map();
    return constituencyNameIndex;
  }

  const rows = db
    .prepare(`SELECT constituency_name FROM constituency ORDER BY constituency_name`)
    .all() as { constituency_name: string }[];

  const index = new Map<string, string>();
  for (const { constituency_name } of rows) {
    const canonical = constituency_name.trim();
    index.set(normalizeKey(canonical), canonical);
    index.set(normalizeKey(stripReservationSuffix(canonical)), canonical);
    index.set(canonical.toLowerCase(), canonical);
  }
  constituencyNameIndex = index;
  return index;
}

export function listConstituencyDetailNames(): string[] {
  const index = buildNameIndex();
  return dedupeConstituencyNames([...new Set(index.values())]);
}

export function resolveConstituencyDetailName(token: string): string | null {
  const t = token.trim();
  if (!t) return null;
  const index = buildNameIndex();
  return (
    index.get(normalizeKey(t)) ??
    index.get(normalizeKey(stripReservationSuffix(t))) ??
    index.get(t.toLowerCase()) ??
    null
  );
}

export function getConstituencyDetail(name: string): ConstituencyDetailResponse | null {
  const db = getDb();
  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='constituency'")
    .get();
  if (!tableExists) return null;

  const resolved = resolveConstituencyDetailName(name);

  let row: ConstituencyRow | undefined;
  if (resolved) {
    row = db
      .prepare(
        `SELECT * FROM constituency WHERE lower(trim(constituency_name)) = lower(trim(?)) LIMIT 1`,
      )
      .get(resolved) as ConstituencyRow | undefined;
  }

  if (!row) {
    const key = normalizeKey(stripReservationSuffix(name));
    const candidates = db
      .prepare(`SELECT * FROM constituency`)
      .all() as ConstituencyRow[];
    row = candidates.find((c) => {
      const cn = normalizeKey(stripReservationSuffix(c.constituency_name));
      return cn === key || cn.startsWith(key) || key.startsWith(cn);
    });
  }

  if (!row) return null;
  return rowToDetail(row);
}
