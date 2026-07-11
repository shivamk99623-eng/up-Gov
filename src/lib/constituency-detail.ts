import "server-only";
import { getDb } from "./db";
import { parseJsonStringArray } from "./json-fields";
import {
  cleanText,
  parseDemographics,
  parseElection,
  parseJson,
  parsePartyOrganizationBundle,
  toNumber,
  type RawCaste,
  type RawElection,
} from "./political-profile-parse";
import type {
  ConstituencyDetailResponse,
  ConstituencyElectionResult,
  ConstituencyInsight,
} from "./types";

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
  const margin = latest?.winningMargin;

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
    ...(margin != null
      ? [
          {
            label: "Latest Winning Margin",
            value: new Intl.NumberFormat("en-IN").format(margin),
          },
        ]
      : []),
  ];
}

function rowToDetail(row: ConstituencyRow): ConstituencyDetailResponse {
  const caste = parseDemographics(parseJson<RawCaste>(row.caste));

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
    partyOrganization: parsePartyOrganizationBundle(row.party_organization),
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
