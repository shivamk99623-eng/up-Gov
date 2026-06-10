import "server-only";
import path from "node:path";
import fs from "node:fs";
import type { House } from "./types";
import { normalizeGovernmentMemberName } from "./government-member-parser";

const LOK_FILE = path.join(
  process.cwd(),
  "data",
  "uttar_pradesh_lok_sabha_members_bio.json",
);
const RAJ_FILE = path.join(
  process.cwd(),
  "data",
  "uttar_pradesh_rajya_sabha_members_bio.json",
);

export interface CareerPosition {
  period: string;
  position: string;
}

export interface MPBioRecord {
  fullName: string;
  constituency: string | null;
  partyFname: string | null;
  dateOfBirth: string | null;
  education: string | null;
  profession: string | null;
  careerTimeline: CareerPosition[];
  house: House;
}

interface RawLokEntry {
  fullName?: string;
  constituency?: string;
  partyFname?: string;
  dateOfBirth?: string;
  education?: string;
  ProfessionName?: string;
  positionHeld?: Array<{ period?: string; positionHeld?: string }>;
}

interface RawRajEntry {
  fullName?: string;
  partyFname?: string;
  dateOfBirth?: string;
  education?: string;
  ProfessionName?: string;
  positionHelds?: Array<{ period?: string; position?: string }>;
}

interface BioCache {
  lokMtime: number;
  rajMtime: number;
  lok: Map<string, MPBioRecord>;
  raj: Map<string, MPBioRecord>;
  lokMembers: MPBioRecord[];
  rajMembers: MPBioRecord[];
}

let cache: BioCache | null = null;

function cleanText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return text || null;
}

function personKey(name: string): string {
  return normalizeGovernmentMemberName(name);
}

function normalizePosition(
  period: unknown,
  position: unknown,
): CareerPosition | null {
  const pos = cleanText(position);
  if (!pos) return null;
  return {
    period: cleanText(period) ?? "",
    position: pos,
  };
}

function parseLokEntry(raw: RawLokEntry): MPBioRecord | null {
  const fullName = cleanText(raw.fullName);
  if (!fullName) return null;

  const careerTimeline = (raw.positionHeld ?? [])
    .map((item) => normalizePosition(item.period, item.positionHeld))
    .filter((item): item is CareerPosition => item != null);

  return {
    fullName,
    constituency: cleanText(raw.constituency),
    partyFname: cleanText(raw.partyFname),
    dateOfBirth: cleanText(raw.dateOfBirth),
    education: cleanText(raw.education),
    profession: cleanText(raw.ProfessionName),
    careerTimeline,
    house: "Lok Sabha",
  };
}

function parseRajEntry(raw: RawRajEntry): MPBioRecord | null {
  const fullName = cleanText(raw.fullName);
  if (!fullName) return null;

  const careerTimeline = (raw.positionHelds ?? [])
    .map((item) => normalizePosition(item.period, item.position))
    .filter((item): item is CareerPosition => item != null);

  return {
    fullName,
    constituency: null,
    partyFname: cleanText(raw.partyFname),
    dateOfBirth: cleanText(raw.dateOfBirth),
    education: cleanText(raw.education),
    profession: cleanText(raw.ProfessionName),
    careerTimeline,
    house: "Rajya Sabha",
  };
}

function indexRecord(map: Map<string, MPBioRecord>, record: MPBioRecord): void {
  map.set(personKey(record.fullName), record);
}

function loadJson<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function ensureCache(): BioCache {
  const lokMtime = fs.existsSync(LOK_FILE) ? fs.statSync(LOK_FILE).mtimeMs : 0;
  const rajMtime = fs.existsSync(RAJ_FILE) ? fs.statSync(RAJ_FILE).mtimeMs : 0;

  if (cache && cache.lokMtime === lokMtime && cache.rajMtime === rajMtime) {
    return cache;
  }

  const lok = new Map<string, MPBioRecord>();
  const raj = new Map<string, MPBioRecord>();
  const lokMembers: MPBioRecord[] = [];
  const rajMembers: MPBioRecord[] = [];

  for (const raw of loadJson<RawLokEntry>(LOK_FILE)) {
    const record = parseLokEntry(raw);
    if (!record) continue;
    lokMembers.push(record);
    indexRecord(lok, record);
  }

  for (const raw of loadJson<RawRajEntry>(RAJ_FILE)) {
    const record = parseRajEntry(raw);
    if (!record) continue;
    rajMembers.push(record);
    indexRecord(raj, record);
  }

  lokMembers.sort((a, b) => a.fullName.localeCompare(b.fullName));
  rajMembers.sort((a, b) => a.fullName.localeCompare(b.fullName));

  cache = { lokMtime, rajMtime, lok, raj, lokMembers, rajMembers };
  return cache;
}

/** All MPs from the Lok Sabha bio JSON. */
export function listLokSabhaBioMembers(): MPBioRecord[] {
  return [...ensureCache().lokMembers];
}

/** All MPs from the Rajya Sabha bio JSON. */
export function listRajyaSabhaBioMembers(): MPBioRecord[] {
  return [...ensureCache().rajMembers];
}

/** All MPs from both bio JSON files. */
export function listAllMpBioMembers(): MPBioRecord[] {
  const { lokMembers, rajMembers } = ensureCache();
  return [...lokMembers, ...rajMembers];
}

/** Looks up MP bio by name, optionally scoped to a house. */
export function lookupMpBio(
  name: string,
  house?: House | null,
): MPBioRecord | null {
  const key = personKey(name);
  const { lok, raj } = ensureCache();

  if (house === "Lok Sabha") return lok.get(key) ?? null;
  if (house === "Rajya Sabha") return raj.get(key) ?? null;

  return lok.get(key) ?? raj.get(key) ?? null;
}
