import "server-only";
import { loadRecords } from "@/lib/excel-parser";
import type {
  House,
  MediaBreakdown,
  MediaRecord,
  MLA,
  MP,
  RepType,
  SentimentBreakdown,
} from "@/lib/types";

/* --------------------------- Deterministic dummy --------------------------- */

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=8c1d18,b91c1c,a16207,15803d,1d4ed8&backgroundType=gradientLinear&fontFamily=Georgia`;

/** Stable 32-bit hash of a string (used to seed placeholder profile fields). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Picks a value in [min, max] deterministically from the name + salt. */
function pick(name: string, salt: string, min: number, max: number): number {
  return min + (hash(name + salt) % (max - min + 1));
}

const EDUCATIONS = [
  "B.A. (Political Science)",
  "M.A. (Public Administration)",
  "LL.B.",
  "B.Com.",
  "Ph.D. (Sociology)",
  "M.A. (History)",
  "B.Sc., LL.B.",
  "Post Graduate (Economics)",
];

/** Names in the dataset that are known to be women. */
const FEMALE_NAMES = new Set(["Sangeeta Yadav", "Sadhana Singh"]);

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dotted(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

/* ------------------------------ Aggregation ------------------------------ */

interface EntityAgg {
  name: string;
  type: RepType;
  records: MediaRecord[];
}

function groupByEntity(types: RepType[]): EntityAgg[] {
  const all = loadRecords();
  const map = new Map<string, EntityAgg>();
  for (const r of all) {
    if (!r.entityName || !r.entityType) continue;
    if (!types.includes(r.entityType)) continue;
    const key = `${r.entityType}::${r.entityName}`;
    let e = map.get(key);
    if (!e) {
      e = { name: r.entityName, type: r.entityType, records: [] };
      map.set(key, e);
    }
    e.records.push(r);
  }
  return [...map.values()].sort(
    (a, b) => b.records.length - a.records.length,
  );
}

/** Total real engagement across an entity's linked mentions. */
function engagementOf(records: MediaRecord[]): number {
  let sum = 0;
  for (const r of records) {
    sum += Math.max(r.totalEngagement, r.likes + r.comments + r.shares);
  }
  return sum;
}

function sentimentOf(records: MediaRecord[]): SentimentBreakdown {
  const s = { positive: 0, negative: 0, neutral: 0 };
  for (const r of records) {
    if (r.sentiment === "Positive") s.positive += 1;
    else if (r.sentiment === "Negative") s.negative += 1;
    else s.neutral += 1;
  }
  return s;
}

/** Media-wise count (YouTube / X / Online) across an entity's mentions. */
function mediaOf(records: MediaRecord[]): MediaBreakdown {
  const m = { youtube: 0, x: 0, online: 0 };
  for (const r of records) {
    if (r.mediaType === "YouTube") m.youtube += 1;
    else if (r.mediaType === "X") m.x += 1;
    else m.online += 1;
  }
  return m;
}

/**
 * Most common real district among an entity's mentions. Person rows that have
 * no district resolve to the person's own name, so those are ignored here and
 * we fall back to the state.
 */
function primaryDistrict(name: string, records: MediaRecord[]): string | null {
  const counts = new Map<string, number>();
  for (const r of records) {
    if (!r.district || r.district === name) continue;
    counts.set(r.district, (counts.get(r.district) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [d, n] of counts) {
    if (n > bestN) {
      best = d;
      bestN = n;
    }
  }
  return best;
}

/* --------------------------- Public directory --------------------------- */

export function getMLADirectory(): MLA[] {
  return groupByEntity(["MLA"]).map((e) => {
    const district = primaryDistrict(e.name, e.records) ?? "Uttar Pradesh";
    return {
      id: `mla-${slug(e.name)}`,
      name: e.name,
      district,
      constituency: district,
      party: "Bharatiya Janata Party",
      designation: "Member of Legislative Assembly",
      email: `${dotted(e.name)}@upvidhansabha.gov.in`,
      phone: `+91 ${pick(e.name, "p1", 70000, 99999)} ${pick(e.name, "p2", 10000, 99999)}`,
      image: avatar(e.name),
      education: EDUCATIONS[hash(e.name) % EDUCATIONS.length],
      age: pick(e.name, "age", 40, 70),
      gender: FEMALE_NAMES.has(e.name) ? "Female" : "Male",
      bio: `${e.name} is a Member of the Legislative Assembly associated with the ${district} region. This profile aggregates ${e.records.length} media mentions linked to them across YouTube, online news and X. Biographical and contact details below are placeholder values.`,
      socialMedia: {
        twitter: `https://twitter.com/${slug(e.name)}`,
        facebook: `https://facebook.com/${slug(e.name)}`,
        instagram: `https://instagram.com/${slug(e.name)}`,
        website: `https://${slug(e.name)}.in`,
      },
      performanceScore: pick(e.name, "perf", 72, 96),
      attendance: pick(e.name, "att", 80, 99),
      publicEngagement: pick(e.name, "eng", 65, 95),
      mediaMentions: e.records.length,
      totalEngagement: engagementOf(e.records),
      media: mediaOf(e.records),
      sentiment: sentimentOf(e.records),
    } satisfies MLA;
  });
}

export function getMPDirectory(): MP[] {
  return groupByEntity(["Lok Sabha MP", "Rajya Sabha MP"]).map((e) => {
    const house: House =
      e.type === "Rajya Sabha MP" ? "Rajya Sabha" : "Lok Sabha";
    const realDistrict = primaryDistrict(e.name, e.records);
    const district = realDistrict ?? "Uttar Pradesh";
    const constituency =
      house === "Rajya Sabha"
        ? "Rajya Sabha — Uttar Pradesh"
        : realDistrict ?? "Uttar Pradesh";
    const bio =
      house === "Rajya Sabha"
        ? `${e.name} is a Member of the Rajya Sabha representing Uttar Pradesh. This profile aggregates ${e.records.length} linked media mentions across YouTube, online news and X. Biographical and contact details below are placeholder values.`
        : `${e.name} is a Member of the Lok Sabha associated with the ${constituency} constituency. This profile aggregates ${e.records.length} linked media mentions across YouTube, online news and X. Biographical and contact details below are placeholder values.`;
    return {
      id: `mp-${slug(e.name)}`,
      name: e.name,
      house,
      constituency,
      district,
      party: "Bharatiya Janata Party",
      designation: `Member of ${house}`,
      email: `${dotted(e.name)}@sansad.nic.in`,
      phone: `+91 ${pick(e.name, "p1", 70000, 99999)} ${pick(e.name, "p2", 10000, 99999)}`,
      image: avatar(e.name),
      education: EDUCATIONS[hash(e.name) % EDUCATIONS.length],
      age: pick(e.name, "age", 42, 74),
      gender: FEMALE_NAMES.has(e.name) ? "Female" : "Male",
      bio,
      termSince: pick(e.name, "term", 2014, 2024),
      socialMedia: {
        twitter: `https://twitter.com/${slug(e.name)}`,
        facebook: `https://facebook.com/${slug(e.name)}`,
        instagram: `https://instagram.com/${slug(e.name)}`,
        website: `https://${slug(e.name)}.in`,
      },
      performanceScore: pick(e.name, "perf", 74, 97),
      attendance: pick(e.name, "att", 82, 99),
      publicEngagement: pick(e.name, "eng", 68, 96),
      mediaMentions: e.records.length,
      totalEngagement: engagementOf(e.records),
      media: mediaOf(e.records),
      sentiment: sentimentOf(e.records),
    } satisfies MP;
  });
}
