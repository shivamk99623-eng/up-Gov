import "server-only";
import { getDb } from "./db";
import {
  compactPersonKey,
  compactPersonKeyWithTitle,
  expandPersonNameVariants,
  normalizePersonName,
} from "./name-search";
import { cleanText, parseJson, toNumber } from "./political-profile-parse";
import type { PersonElectionHistory, PersonElectionResult } from "./types";

interface RawPersonElection {
  party?: string | null;
  win_lose?: string | null;
  margin?: number | string | null;
}

interface MlaDataRow {
  mla_name: string;
  caste: string | null;
  election_2022: string | null;
  election_2017: string | null;
  election_2012: string | null;
  election_2007: string | null;
  election_2002: string | null;
}

interface MpDataRow {
  mp_name: string;
  caste: string | null;
  election_2024: string | null;
  election_2019: string | null;
  election_2014: string | null;
  election_2009: string | null;
  election_2004: string | null;
}

function tableExists(name: string): boolean {
  return !!getDb()
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
}

function parsePersonElection(
  year: number,
  raw: string | null,
): PersonElectionResult | null {
  const parsed = parseJson<RawPersonElection>(raw);
  if (!parsed) return null;
  const party = cleanText(parsed.party);
  const winLose = cleanText(parsed.win_lose);
  const margin = toNumber(parsed.margin);
  if (!party && !winLose && margin == null) return null;
  return { year, party, winLose, margin };
}

function keySet(name: string, withTitle: boolean): Set<string> {
  const keys = new Set<string>();
  const base = withTitle
    ? compactPersonKeyWithTitle(name)
    : compactPersonKey(name);
  for (const variant of expandPersonNameVariants(base)) {
    if (variant) keys.add(variant);
  }

  if (!withTitle) {
    const normalized = normalizePersonName(name);
    for (const part of normalized.split(/\balias\b|\ba\/?k\/?a\b/i)) {
      for (const variant of expandPersonNameVariants(compactPersonKey(part))) {
        if (variant) keys.add(variant);
      }
    }
  }

  return keys;
}

function setsIntersect(a: Set<string>, b: Set<string>): boolean {
  for (const v of a) {
    if (b.has(v)) return true;
  }
  return false;
}

/**
 * Score person-name joins for election sheets.
 * Prefer title+spelling matches so "Dr. Dharmpal" → "Dr. Dharampal"
 * and not the unrelated "Shri Dharmpal".
 */
function scoreNameMatch(query: string, candidate: string): number {
  const qTitle = keySet(query, true);
  const cTitle = keySet(candidate, true);
  if (setsIntersect(qTitle, cTitle)) return 100;

  const qCompact = keySet(query, false);
  const cCompact = keySet(candidate, false);
  if (setsIntersect(qCompact, cCompact)) return 80;

  for (const q of qCompact) {
    for (const c of cCompact) {
      if (q.length >= 8 && c.length >= 8 && (q.includes(c) || c.includes(q))) {
        return 70;
      }
    }
  }

  const qTokens = [...expandPersonNameVariants(normalizePersonName(query))]
    .flatMap((v) => v.split(/\s+/))
    .filter((t) => t.length >= 3);
  const cTokenSet = new Set(
    [...expandPersonNameVariants(normalizePersonName(candidate))]
      .flatMap((v) => v.split(/\s+/))
      .filter((t) => t.length >= 3),
  );
  if (!qTokens.length || !cTokenSet.size) return 0;
  const uniqueQ = [...new Set(qTokens)];
  const hits = uniqueQ.filter((t) => cTokenSet.has(t)).length;
  if (hits === uniqueQ.length && uniqueQ.length >= 2) return 60;
  if (hits >= 2 && hits / uniqueQ.length >= 0.66) return 55;
  return 0;
}

function findBestName<T extends { name: string }>(
  query: string,
  rows: T[],
): T | null {
  let best: T | null = null;
  let bestScore = 0;
  let tie = false;

  for (const row of rows) {
    const score = scoreNameMatch(query, row.name);
    if (score > bestScore) {
      bestScore = score;
      best = row;
      tie = false;
    } else if (score === bestScore && score > 0 && best && row.name !== best.name) {
      tie = true;
    }
  }

  // Ambiguous compact-only match (e.g. two "Dharmpal Singh"s) — require title hit
  if (tie && bestScore < 100) return null;
  return bestScore >= 55 ? best : null;
}

function mlaRowToHistory(row: MlaDataRow): PersonElectionHistory {
  const years = [
    [2022, row.election_2022],
    [2017, row.election_2017],
    [2012, row.election_2012],
    [2007, row.election_2007],
    [2002, row.election_2002],
  ] as const;

  return {
    name: row.mla_name,
    caste: cleanText(row.caste),
    elections: years
      .map(([year, raw]) => parsePersonElection(year, raw))
      .filter((e): e is PersonElectionResult => !!e),
  };
}

function mpRowToHistory(row: MpDataRow): PersonElectionHistory {
  const years = [
    [2024, row.election_2024],
    [2019, row.election_2019],
    [2014, row.election_2014],
    [2009, row.election_2009],
    [2004, row.election_2004],
  ] as const;

  return {
    name: row.mp_name,
    caste: cleanText(row.caste),
    elections: years
      .map(([year, raw]) => parsePersonElection(year, raw))
      .filter((e): e is PersonElectionResult => !!e),
  };
}

let mlaIndex: { name: string; row: MlaDataRow }[] | null = null;
let mpIndex: { name: string; row: MpDataRow }[] | null = null;

function loadMlaIndex() {
  if (mlaIndex) return mlaIndex;
  if (!tableExists("mla_data")) {
    mlaIndex = [];
    return mlaIndex;
  }
  const rows = getDb().prepare(`SELECT * FROM mla_data`).all() as MlaDataRow[];
  mlaIndex = rows.map((row) => ({ name: row.mla_name, row }));
  return mlaIndex;
}

function loadMpIndex() {
  if (mpIndex) return mpIndex;
  if (!tableExists("mp_lok_sabha_data")) {
    mpIndex = [];
    return mpIndex;
  }
  const rows = getDb()
    .prepare(`SELECT * FROM mp_lok_sabha_data`)
    .all() as MpDataRow[];
  mpIndex = rows.map((row) => ({ name: row.mp_name, row }));
  return mpIndex;
}

export function getMlaElectionHistory(name: string): PersonElectionHistory | null {
  const match = findBestName(name, loadMlaIndex());
  return match ? mlaRowToHistory(match.row) : null;
}

export function getMpElectionHistory(name: string): PersonElectionHistory | null {
  const match = findBestName(name, loadMpIndex());
  return match ? mpRowToHistory(match.row) : null;
}
