import "server-only";
import { loadRecords } from "@/lib/excel-parser";
import {
  listGovernmentMlaMembers,
  listGovernmentMpMembers,
  lookupGovernmentMember,
} from "@/lib/government-member-parser";
import {
  listMlaNames,
  listMpNamesByHouse,
  loadMlaPrintRecords,
  loadMpPrintRecords,
} from "@/lib/print-parser";
import type {
  House,
  MediaBreakdown,
  MediaRecord,
  MLA,
  MP,
  RepType,
  Sentiment,
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

function addSentiment(
  acc: SentimentBreakdown,
  sentiment: Sentiment,
) {
  if (sentiment === "Positive") acc.positive += 1;
  else if (sentiment === "Negative") acc.negative += 1;
  else acc.neutral += 1;
}

function sentimentOf(records: MediaRecord[]): SentimentBreakdown {
  const s = { positive: 0, negative: 0, neutral: 0 };
  for (const r of records) addSentiment(s, r.sentiment);
  return s;
}

function mergeSentiment(
  digital: SentimentBreakdown,
  print: SentimentBreakdown,
): SentimentBreakdown {
  return {
    positive: digital.positive + print.positive,
    negative: digital.negative + print.negative,
    neutral: digital.neutral + print.neutral,
  };
}

function sentimentOfPrint(mpName: string): SentimentBreakdown {
  const s = { positive: 0, negative: 0, neutral: 0 };
  for (const r of loadMpPrintRecords(mpName)) addSentiment(s, r.sentiment);
  return s;
}

function sentimentOfMlaPrint(mlaName: string): SentimentBreakdown {
  const s = { positive: 0, negative: 0, neutral: 0 };
  for (const r of loadMlaPrintRecords(mlaName)) addSentiment(s, r.sentiment);
  return s;
}

/** Media-wise count (YouTube / X / Online) across an entity's mentions. */
function mediaOf(records: MediaRecord[]): MediaBreakdown {
  const m = { print: 0, youtube: 0, x: 0, online: 0 };
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

/* --------------------------- MLA union index --------------------------- */

interface MlaUnionEntry {
  name: string;
  hasMedia: boolean;
  records: MediaRecord[];
}

function normalizeMlaKey(name: string): string {
  return name
    .trim()
    .replace(/,\s*$/g, "")
    .replace(/[\[\]]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^(?:shri|smt\.?)\s+/i, "")
    .replace(/^dr\.?\s*/i, "")
    .replace(/\./g, "")
    .trim();
}

function collectMlaUnion(): MlaUnionEntry[] {
  const map = new Map<string, MlaUnionEntry>();

  const upsert = (rawName: string): MlaUnionEntry => {
    const key = normalizeMlaKey(rawName);
    let entry = map.get(key);
    if (!entry) {
      entry = {
        name: rawName.trim().replace(/\s+/g, " "),
        hasMedia: false,
        records: [],
      };
      map.set(key, entry);
    }
    return entry;
  };

  for (const e of groupByEntity(["MLA"])) {
    const entry = upsert(e.name);
    entry.name = e.name;
    entry.hasMedia = true;
    entry.records = e.records;
  }

  for (const name of listMlaNames()) {
    const entry = upsert(name);
    if (!entry.hasMedia) entry.name = name;
  }

  for (const member of listGovernmentMlaMembers()) {
    const entry = upsert(member.name);
    if (!entry.hasMedia) entry.name = member.name;
  }

  return [...map.values()].sort((a, b) => {
    const aMentions = a.records.length + loadMlaPrintRecords(a.name).length;
    const bMentions = b.records.length + loadMlaPrintRecords(b.name).length;
    return bMentions - aMentions || a.name.localeCompare(b.name);
  });
}

/* --------------------------- MP union index --------------------------- */

interface MpUnionEntry {
  name: string;
  mediaType: RepType | null;
  houses: Set<House>;
  records: MediaRecord[];
}

function normalizeMpKey(name: string): string {
  return name
    .trim()
    .replace(/[\[\]]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function collectMpUnion(): MpUnionEntry[] {
  const map = new Map<string, MpUnionEntry>();

  const upsert = (rawName: string): MpUnionEntry => {
    const key = normalizeMpKey(rawName);
    let entry = map.get(key);
    if (!entry) {
      entry = {
        name: rawName.trim().replace(/\s+/g, " "),
        mediaType: null,
        houses: new Set<House>(),
        records: [],
      };
      map.set(key, entry);
    }
    return entry;
  };

  for (const e of groupByEntity(["Lok Sabha MP", "Rajya Sabha MP"])) {
    const entry = upsert(e.name);
    entry.name = e.name;
    entry.mediaType = e.type;
    entry.records = e.records;
    entry.houses.add(
      e.type === "Rajya Sabha MP" ? "Rajya Sabha" : "Lok Sabha",
    );
  }

  const { lokSabha, rajyaSabha } = listMpNamesByHouse();
  for (const name of lokSabha) {
    const entry = upsert(name);
    if (!entry.mediaType) entry.name = name;
    entry.houses.add("Lok Sabha");
  }
  for (const name of rajyaSabha) {
    const entry = upsert(name);
    if (!entry.mediaType) entry.name = name;
    entry.houses.add("Rajya Sabha");
  }

  for (const member of listGovernmentMpMembers()) {
    const entry = upsert(member.name);
    if (!entry.mediaType) entry.name = member.name;
    if (member.house) entry.houses.add(member.house);
  }

  return [...map.values()].sort((a, b) => {
    const aMentions = a.records.length + loadMpPrintRecords(a.name).length;
    const bMentions = b.records.length + loadMpPrintRecords(b.name).length;
    return bMentions - aMentions || a.name.localeCompare(b.name);
  });
}

function primaryHouse(entry: MpUnionEntry): House {
  if (entry.mediaType === "Rajya Sabha MP") return "Rajya Sabha";
  if (entry.mediaType === "Lok Sabha MP") return "Lok Sabha";
  if (entry.houses.has("Rajya Sabha") && !entry.houses.has("Lok Sabha")) {
    return "Rajya Sabha";
  }
  return "Lok Sabha";
}

/* --------------------------- Public directory --------------------------- */

export function getMLADirectory(): MLA[] {
  return collectMlaUnion().map((e) => {
    const district = primaryDistrict(e.name, e.records) ?? "Uttar Pradesh";
    const printRecords = loadMlaPrintRecords(e.name);
    const digitalMedia = mediaOf(e.records);
    const media: MediaBreakdown = {
      ...digitalMedia,
      print: printRecords.length,
    };
    const sentiment = mergeSentiment(
      sentimentOf(e.records),
      sentimentOfMlaPrint(e.name),
    );
    const totalMentions = e.records.length + printRecords.length;
    const gov = lookupGovernmentMember(e.name, "mla");
    return {
      id: `mla-${slug(e.name)}`,
      name: e.name,
      governmentProfile: gov,
      district,
      constituency: district,
      party: "Bharatiya Janata Party",
      designation: "Member of Legislative Assembly",
      email: `${dotted(e.name)}@upvidhansabha.gov.in`,
      phone: `+91 ${pick(e.name, "p1", 70000, 99999)} ${pick(e.name, "p2", 10000, 99999)}`,
      image: avatar(e.name),
      education: gov?.highestQualification ?? "—",
      age: pick(e.name, "age", 40, 70),
      gender: FEMALE_NAMES.has(e.name) ? "Female" : "Male",
      bio: `${e.name} is a Member of the Legislative Assembly associated with the ${district} region. This profile aggregates ${totalMentions} media mentions (including ${printRecords.length} print articles) across print, YouTube, online news and X.`,
      socialMedia: {
        twitter: `https://twitter.com/${slug(e.name)}`,
        facebook: `https://facebook.com/${slug(e.name)}`,
        instagram: `https://instagram.com/${slug(e.name)}`,
        website: `https://${slug(e.name)}.in`,
      },
      performanceScore: pick(e.name, "perf", 72, 96),
      attendance: pick(e.name, "att", 80, 99),
      publicEngagement: pick(e.name, "eng", 65, 95),
      mediaMentions: totalMentions,
      totalEngagement: engagementOf(e.records),
      media,
      sentiment,
    } satisfies MLA;
  });
}

export function getMPDirectory(): MP[] {
  return collectMpUnion().map((e) => {
    const house = primaryHouse(e);
    const houses = [...e.houses].sort((a, b) => a.localeCompare(b));
    const realDistrict = primaryDistrict(e.name, e.records);
    const district = realDistrict ?? "Uttar Pradesh";
    const constituency =
      house === "Rajya Sabha"
        ? "Rajya Sabha — Uttar Pradesh"
        : realDistrict ?? "Uttar Pradesh";
    const printRecords = loadMpPrintRecords(e.name);
    const digitalMedia = mediaOf(e.records);
    const media: MediaBreakdown = {
      ...digitalMedia,
      print: printRecords.length,
    };
    const sentiment = mergeSentiment(
      sentimentOf(e.records),
      sentimentOfPrint(e.name),
    );
    const totalMentions = e.records.length + printRecords.length;
    const gov = lookupGovernmentMember(e.name, "mp");
    const bio =
      house === "Rajya Sabha"
        ? `${e.name} is a Member of the Rajya Sabha representing Uttar Pradesh. This profile aggregates ${totalMentions} media mentions (including ${printRecords.length} print articles) across print, YouTube, online news and X.`
        : `${e.name} is a Member of the Lok Sabha associated with the ${constituency} constituency. This profile aggregates ${totalMentions} media mentions (including ${printRecords.length} print articles) across print, YouTube, online news and X.`;
    return {
      id: `mp-${slug(e.name)}`,
      name: e.name,
      governmentProfile: gov,
      house,
      houses,
      constituency,
      district,
      party: "Bharatiya Janata Party",
      designation: `Member of ${house}`,
      email: `${dotted(e.name)}@sansad.nic.in`,
      phone: `+91 ${pick(e.name, "p1", 70000, 99999)} ${pick(e.name, "p2", 10000, 99999)}`,
      image: avatar(e.name),
      education: gov?.highestQualification ?? "—",
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
      mediaMentions: totalMentions,
      totalEngagement: engagementOf(e.records),
      media,
      sentiment,
    } satisfies MP;
  });
}
