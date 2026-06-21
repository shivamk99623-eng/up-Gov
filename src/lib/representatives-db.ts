import "server-only";
import { getDb } from "./db";
import type { CareerPosition, House } from "./types";

export interface MPBioRecord {
  id: string;
  fullName: string;
  constituency: string | null;
  partyFname: string | null;
  dateOfBirth: string | null;
  education: string | null;
  profession: string | null;
  careerTimeline: CareerPosition[];
  house: House;
}

export interface MLABioRecord {
  id: string;
  fullName: string;
  constituency: string | null;
  partyFname: string | null;
  dateOfBirth: string | null;
  education: string | null;
  profession: string | null;
  careerTimeline: CareerPosition[];
}

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

function parseTimeline(
  raw: unknown,
  positionKey: "positionHeld" | "position",
): CareerPosition[] {
  if (!raw) return [];
  let items: unknown[] = [];
  if (typeof raw === "string") {
    try {
      items = JSON.parse(raw);
    } catch {
      return [];
    }
  } else if (Array.isArray(raw)) {
    items = raw;
  }
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const position = cleanText(rec[positionKey] ?? rec.positionHeld);
      if (!position) return null;
      return {
        period: cleanText(rec.period) ?? "",
        position,
      };
    })
    .filter((item): item is CareerPosition => item != null);
}

function tableExists(name: string): boolean {
  return !!getDb()
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
}

function mpCompositeId(house: House, mpsno: number | string): string {
  const prefix = house === "Rajya Sabha" ? "rajya" : "lok";
  return `${prefix}:${mpsno}`;
}

function parseMpId(
  id: string,
  houseHint?: House,
): { mpsno: number; house?: House } | null {
  const composite = id.match(/^(lok|rajya):(\d+)$/i);
  if (composite) {
    return {
      mpsno: Number(composite[2]),
      house:
        composite[1].toLowerCase() === "rajya" ? "Rajya Sabha" : "Lok Sabha",
    };
  }
  const mpsno = Number.parseInt(id, 10);
  if (!Number.isFinite(mpsno)) return null;
  return houseHint ? { mpsno, house: houseHint } : { mpsno };
}
function mapLokRow(row: Record<string, unknown>): MPBioRecord | null {
  const fullName = cleanText(row.fullName);
  const mpsno = row.mpsno;
  if (!fullName || mpsno == null) return null;
  return {
    id: mpCompositeId("Lok Sabha", String(mpsno)),
    fullName,
    constituency: cleanText(row.constituency),
    partyFname: cleanText(row.partyFname),
    dateOfBirth: cleanText(row.dateOfBirth),
    education: cleanText(row.education),
    profession: cleanText(row.ProfessionName),
    careerTimeline: parseTimeline(row.positionHeld, "positionHeld"),
    house: "Lok Sabha",
  };
}

function mapRajRow(row: Record<string, unknown>): MPBioRecord | null {
  const fullName = cleanText(row.fullName);
  const mpsno = row.mpsno;
  if (!fullName || mpsno == null) return null;
  return {
    id: mpCompositeId("Rajya Sabha", String(mpsno)),
    fullName,
    constituency: null,
    partyFname: cleanText(row.partyFname),
    dateOfBirth: cleanText(row.dateOfBirth),
    education: cleanText(row.education),
    profession: cleanText(row.ProfessionName),
    careerTimeline: parseTimeline(row.positionHelds, "position"),
    house: "Rajya Sabha",
  };
}

function mapMlaRow(row: Record<string, unknown>): MLABioRecord | null {
  const fullName = cleanText(row.fullName);
  const mpsno = row.mpsno;
  if (!fullName || mpsno == null) return null;
  return {
    id: String(mpsno),
    fullName,
    constituency: cleanText(row.constituency),
    partyFname: cleanText(row.partyFname),
    dateOfBirth: cleanText(row.dateOfBirth),
    education: cleanText(row.education),
    profession: null,
    careerTimeline: parseTimeline(row.positionHeld, "positionHeld"),
  };
}

export function listAllMpBioMembers(): MPBioRecord[] {
  const members: MPBioRecord[] = [];

  if (tableExists("uttar_pradesh_lok_sabha_members_bio")) {
    const lokRows = getDb()
      .prepare(
        `SELECT mpsno, fullName, constituency, partyFname, dateOfBirth, education,
                ProfessionName, positionHeld
         FROM uttar_pradesh_lok_sabha_members_bio
         ORDER BY mpsno`,
      )
      .all() as Record<string, unknown>[];
    for (const row of lokRows) {
      const mapped = mapLokRow(row);
      if (mapped) members.push(mapped);
    }
  }

  if (tableExists("uttar_pradesh_rajya_sabha_members_bio")) {
    const rajRows = getDb()
      .prepare(
        `SELECT mpsno, fullName, partyFname, dateOfBirth, education,
                ProfessionName, positionHelds
         FROM uttar_pradesh_rajya_sabha_members_bio
         ORDER BY mpsno`,
      )
      .all() as Record<string, unknown>[];
    for (const row of rajRows) {
      const mapped = mapRajRow(row);
      if (mapped) members.push(mapped);
    }
  }

  return members;
}

export function listAllMlaBioMembers(): MLABioRecord[] {
  if (!tableExists("uttar_pradesh_MLA_members_bio")) return [];
  const rows = getDb()
    .prepare(
      `SELECT mpsno, fullName, constituency, partyFname, dateOfBirth, education,
              positionHeld
       FROM uttar_pradesh_MLA_members_bio
       ORDER BY mpsno`,
    )
    .all() as Record<string, unknown>[];

  const members: MLABioRecord[] = [];
  for (const row of rows) {
    const mapped = mapMlaRow(row);
    if (mapped) members.push(mapped);
  }
  return members;
}

export function getMlaBioById(id: string): MLABioRecord | null {
  if (!tableExists("uttar_pradesh_MLA_members_bio")) return null;
  const mpsno = Number.parseInt(id, 10);
  if (!Number.isFinite(mpsno)) return null;
  const row = getDb()
    .prepare(
      `SELECT mpsno, fullName, constituency, partyFname, dateOfBirth, education,
              positionHeld
       FROM uttar_pradesh_MLA_members_bio WHERE mpsno = ?`,
    )
    .get(mpsno) as Record<string, unknown> | undefined;
  return row ? mapMlaRow(row) : null;
}

export function getMpBioById(id: string, house?: House): MPBioRecord | null {
  const parsed = parseMpId(id, house);
  if (!parsed) return null;
  const { mpsno, house: parsedHouse } = parsed;
  const resolvedHouse = parsedHouse ?? house;

  if (resolvedHouse !== "Rajya Sabha" && tableExists("uttar_pradesh_lok_sabha_members_bio")) {
    const lok = getDb()
      .prepare(
        `SELECT mpsno, fullName, constituency, partyFname, dateOfBirth, education,
                ProfessionName, positionHeld
         FROM uttar_pradesh_lok_sabha_members_bio WHERE mpsno = ?`,
      )
      .get(mpsno) as Record<string, unknown> | undefined;
    if (lok) return mapLokRow(lok);
  }

  if (resolvedHouse !== "Lok Sabha" && tableExists("uttar_pradesh_rajya_sabha_members_bio")) {
    const raj = getDb()
      .prepare(
        `SELECT mpsno, fullName, partyFname, dateOfBirth, education,
                ProfessionName, positionHelds
         FROM uttar_pradesh_rajya_sabha_members_bio WHERE mpsno = ?`,
      )
      .get(mpsno) as Record<string, unknown> | undefined;
    if (raj) return mapRajRow(raj);
  }

  return null;
}
