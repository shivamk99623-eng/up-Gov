import "server-only";
import { getDb } from "./db";
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
import { stripReservationSuffix } from "./constituency-detail";
import type {
  ConstituencyElectionResult,
  ConstituencyInsight,
  LegislativeAssemblyDetailResponse,
} from "./types";

interface LegislativeRow {
  sr_no: string | number | null;
  person_allotted_to: string | null;
  assembly: string;
  reservation: string | null;
  district: string | null;
  assembly_code: string | number | null;
  total_population: number | string | null;
  religion: string | null;
  caste: string | null;
  election_2022: string | null;
  election_2017: string | null;
  election_2012: string | null;
  election_2007: string | null;
  election_2002: string | null;
  party_organization: string | null;
}

const ELECTION_YEARS = [2022, 2017, 2012, 2007, 2002] as const;

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

function buildInsights(
  row: LegislativeRow,
  elections: ConstituencyElectionResult[],
  caste: LegislativeAssemblyDetailResponse["caste"],
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
        ? `Shifted from ${parties[1]} (${elections[1]?.year ?? ""}) to ${parties[0]} (${latest?.year ?? ""})`
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
      value: row.reservation ?? "General",
    },
    {
      label: "District",
      value: row.district ?? "Not available",
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
      label: "Dominant Party (2002–2022)",
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

function rowToDetail(row: LegislativeRow): LegislativeAssemblyDetailResponse {
  const caste = parseDemographics(parseJson<RawCaste>(row.caste));
  const religion = parseDemographics(parseJson<RawCaste>(row.religion));

  const electionMap: Record<number, string | null> = {
    2022: row.election_2022,
    2017: row.election_2017,
    2012: row.election_2012,
    2007: row.election_2007,
    2002: row.election_2002,
  };

  const elections = ELECTION_YEARS.map((year) =>
    parseElection(year, parseJson<RawElection>(electionMap[year])),
  );

  return {
    srNo: toNumber(row.sr_no),
    assemblyName: row.assembly,
    personAllottedTo: cleanText(row.person_allotted_to),
    reservationStatus: cleanText(row.reservation),
    district: cleanText(row.district),
    assemblyCode: toNumber(row.assembly_code),
    totalPopulation: toNumber(row.total_population),
    religion,
    caste,
    elections,
    insights: buildInsights(row, elections, caste),
    partyOrganization: parsePartyOrganizationBundle(row.party_organization),
  };
}

let assemblyNameIndex: Map<string, string> | null = null;

function tableExists(): boolean {
  return !!getDb()
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Up_legislative'")
    .get();
}

function buildNameIndex(): Map<string, string> {
  if (assemblyNameIndex) return assemblyNameIndex;

  const index = new Map<string, string>();
  if (!tableExists()) {
    assemblyNameIndex = index;
    return index;
  }

  const rows = getDb()
    .prepare(
      `SELECT assembly FROM Up_legislative WHERE assembly IS NOT NULL AND trim(assembly) != '' ORDER BY assembly`,
    )
    .all() as { assembly: string }[];

  for (const { assembly } of rows) {
    const canonical = assembly.trim();
    index.set(normalizeKey(canonical), canonical);
    index.set(normalizeKey(stripReservationSuffix(canonical)), canonical);
    index.set(canonical.toLowerCase(), canonical);
  }
  assemblyNameIndex = index;
  return index;
}

export function resolveLegislativeDetailName(token: string): string | null {
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

export function getLegislativeAssemblyDetail(
  name: string,
): LegislativeAssemblyDetailResponse | null {
  if (!tableExists()) return null;

  const db = getDb();
  const resolved = resolveLegislativeDetailName(name);

  let row: LegislativeRow | undefined;
  if (resolved) {
    row = db
      .prepare(
        `SELECT * FROM Up_legislative WHERE lower(trim(assembly)) = lower(trim(?)) LIMIT 1`,
      )
      .get(resolved) as LegislativeRow | undefined;
  }

  if (!row) {
    const key = normalizeKey(stripReservationSuffix(name));
    const candidates = db.prepare(`SELECT * FROM Up_legislative`).all() as LegislativeRow[];
    row = candidates.find((c) => {
      const cn = normalizeKey(stripReservationSuffix(c.assembly));
      return cn === key || cn.startsWith(key) || key.startsWith(cn);
    });
  }

  if (!row) return null;
  return rowToDetail(row);
}
