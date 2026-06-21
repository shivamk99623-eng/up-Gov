import "server-only";
import { getDb } from "./db";

const DISTRICT_TO_GEO: Record<string, string> = {
  Kanpur: "Kanpur Nagar",
};

const DISTRICT_ALIASES: Record<string, string> = {
  badaun: "Budaun",
  budaun: "Budaun",
  raebareli: "Rae Bareli",
  "rae bareli": "Rae Bareli",
  shravasti: "Shrawasti",
  kanpurdehat: "Kanpur Dehat",
  "kanpur dehat": "Kanpur Dehat",
  bagpat: "Baghpat",
  baghpat: "Baghpat",
  bulandshahar: "Bulandshahr",
  bulandshahr: "Bulandshahr",
  "gautam buddha nagar": "Gautam Buddha Nagar",
  "gautam buddhanagar": "Gautam Buddha Nagar",
  gbnagar: "Gautam Buddha Nagar",
  "sant kabir nagar": "Sant Kabir Nagar",
  "santkabir nagar": "Sant Kabir Nagar",
  sknagar: "Sant Kabir Nagar",
  ambedkarnagar: "Ambedkar Nagar",
  "ambedkar nagar": "Ambedkar Nagar",
  sidharthnagar: "Siddharthnagar",
  siddharthnagar: "Siddharthnagar",
  prayagraj: "Prayagraj",
  ayodhya: "Ayodhya",
  kanpur: "Kanpur Nagar",
};

let districtLookup: Map<string, string> | null = null;
let knownDistrictNames: Set<string> | null = null;

function buildDistrictLookup(): Map<string, string> {
  if (districtLookup) return districtLookup;

  const map = new Map<string, string>();
  try {
    const rows = getDb()
      .prepare("SELECT DISTINCT district FROM districts WHERE district IS NOT NULL")
      .all() as { district: string }[];
    for (const { district } of rows) {
      const lower = district.toLowerCase();
      map.set(lower, district);
      map.set(lower.replace(/\s+/g, ""), district);
    }
  } catch {
    /* districts table may be empty during tests */
  }

  for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
    const key = alias.toLowerCase();
    map.set(key, canonical);
    map.set(key.replace(/\s+/g, ""), canonical);
    const canonLower = canonical.toLowerCase();
    map.set(canonLower, canonical);
    map.set(canonLower.replace(/\s+/g, ""), canonical);
  }

  districtLookup = map;
  knownDistrictNames = new Set(map.values());
  return districtLookup;
}

export function toGeoName(district: string): string {
  return DISTRICT_TO_GEO[district] ?? district;
}

export function isKnownDistrict(district: string | null | undefined): boolean {
  if (!district?.trim()) return false;
  const trimmed = district.trim();
  const lookup = buildDistrictLookup();
  const lower = trimmed.toLowerCase();
  if (lookup.has(lower) || lookup.has(lower.replace(/\s+/g, ""))) return true;
  return knownDistrictNames?.has(trimmed) ?? false;
}

export function resolveDistrictName(token: string): string {
  const lookup = buildDistrictLookup();
  const t = token.trim();
  const lower = t.toLowerCase();
  return (
    lookup.get(lower) ??
    lookup.get(lower.replace(/\s+/g, "")) ??
    t.replace(/\s+/g, " ")
  );
}

export function listKnownDistricts(): string[] {
  buildDistrictLookup();
  return [...(knownDistrictNames ?? new Set())].sort();
}
