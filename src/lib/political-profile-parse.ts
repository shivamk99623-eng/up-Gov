import type {
  ConstituencyCasteSegment,
  ConstituencyElectionResult,
  ConstituencyPartyOrg,
} from "./types";

export interface RawElection {
  winner_name?: string | null;
  winner_party?: string | null;
  total_candidates?: number | string | null;
  total_votes_polled?: number | string | null;
  exit_poll_results?: string | null;
  winning_candidate_caste?: string | null;
  winning_candidate_votes?: number | string | null;
  runner_up_name?: string | null;
  runner_up_party?: string | null;
  runner_up_votes?: number | string | null;
  winning_margin?: number | string | null;
}

export interface RawCaste {
  most_populated?: string | null;
  second_majority?: string | null;
  rest?: string | null;
}

export interface RawPartyOrg {
  jiladhyaksha?: string | null;
  mahanagar?: string | null;
  mandal?: string | null;
  jilapratinidhi?: string | null;
  boothadhyaksha?: string | null;
}

export function parseJson<T>(value: string | null | undefined): T | null {
  if (!value?.trim()) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function toNumber(value: unknown): number | null {
  if (value == null || value === "" || value === "-") return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const cleaned = String(value).replace(/,/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

export function cleanText(value: unknown): string | null {
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

export function parseCasteSegment(
  raw: string | null | undefined,
): ConstituencyCasteSegment | null {
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

export function parseRestCommunities(
  raw: string | null | undefined,
): ConstituencyCasteSegment[] {
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

export function parseDemographics(raw: RawCaste | null | undefined) {
  return {
    mostPopulated: parseCasteSegment(raw?.most_populated),
    secondMajority: parseCasteSegment(raw?.second_majority),
    rest: parseRestCommunities(raw?.rest),
  };
}

export function parsePartyOrg(
  raw: RawPartyOrg | null | undefined,
): ConstituencyPartyOrg {
  return {
    jiladhyaksha: cleanText(raw?.jiladhyaksha),
    mahanagar: cleanText(raw?.mahanagar),
    mandal: cleanText(raw?.mandal),
    jilapratinidhi: cleanText(raw?.jilapratinidhi),
    boothadhyaksha: cleanText(raw?.boothadhyaksha),
  };
}

export function parseElection(
  year: number,
  raw: RawElection | null,
): ConstituencyElectionResult {
  return {
    year,
    winnerName: cleanText(raw?.winner_name),
    winnerParty: cleanText(raw?.winner_party),
    totalCandidates: toNumber(raw?.total_candidates),
    totalVotesPolled: toNumber(raw?.total_votes_polled),
    exitPollResult: cleanText(raw?.exit_poll_results),
    winningCandidateCaste: cleanText(raw?.winning_candidate_caste),
    winningCandidateVotes: toNumber(raw?.winning_candidate_votes),
    runnerUpName: cleanText(raw?.runner_up_name),
    runnerUpParty: cleanText(raw?.runner_up_party),
    runnerUpVotes: toNumber(raw?.runner_up_votes),
    winningMargin: toNumber(raw?.winning_margin),
  };
}

export function parsePartyOrganizationBundle(value: string | null | undefined) {
  const partyRaw = parseJson<{
    bjp?: RawPartyOrg;
    sp?: RawPartyOrg;
    bsp?: RawPartyOrg;
    inc?: RawPartyOrg;
  }>(value);

  return {
    bjp: parsePartyOrg(partyRaw?.bjp),
    sp: parsePartyOrg(partyRaw?.sp),
    bsp: parsePartyOrg(partyRaw?.bsp),
    inc: parsePartyOrg(partyRaw?.inc),
  };
}
