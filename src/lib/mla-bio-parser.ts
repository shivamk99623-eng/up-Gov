import "server-only";
import path from "node:path";
import fs from "node:fs";
import { normalizeGovernmentMemberName } from "./government-member-parser";
import type { CareerPosition } from "./types";

const MLA_FILE = path.join(
  process.cwd(),
  "data",
  "uttar_pradesh_MLA_members_bio.json",
);

export interface MLABioRecord {
  fullName: string;
  constituency: string | null;
  partyFname: string | null;
  dateOfBirth: string | null;
  education: string | null;
  profession: string | null;
  careerTimeline: CareerPosition[];
}

interface RawMlaEntry {
  fullName?: string;
  constituency?: string;
  partyFname?: string;
  dateOfBirth?: string;
  education?: string;
  ProfessionName?: string;
  positionHeld?: Array<{ period?: string; positionHeld?: string }>;
}

interface BioCache {
  mtime: number;
  byKey: Map<string, MLABioRecord>;
  members: MLABioRecord[];
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

function parseMlaEntry(raw: RawMlaEntry): MLABioRecord | null {
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
  };
}

function loadJson<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function ensureCache(): BioCache {
  const mtime = fs.existsSync(MLA_FILE) ? fs.statSync(MLA_FILE).mtimeMs : 0;

  if (cache && cache.mtime === mtime) {
    return cache;
  }

  const byKey = new Map<string, MLABioRecord>();
  const members: MLABioRecord[] = [];

  for (const raw of loadJson<RawMlaEntry>(MLA_FILE)) {
    const record = parseMlaEntry(raw);
    if (!record) continue;
    members.push(record);
    byKey.set(personKey(record.fullName), record);
  }

  cache = { mtime, byKey, members };
  return cache;
}

/** All MLAs from the Vidhan Sabha bio JSON. */
export function listAllMlaBioMembers(): MLABioRecord[] {
  return [...ensureCache().members];
}

/** Looks up MLA bio by name. */
export function lookupMlaBio(name: string): MLABioRecord | null {
  return ensureCache().byKey.get(personKey(name)) ?? null;
}
