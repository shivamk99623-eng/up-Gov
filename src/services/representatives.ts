import "server-only";
import { loadRecords } from "@/lib/excel-parser";
import { lookupGovernmentMember, listGovernmentMlaMembers } from "@/lib/government-member-parser";
import { listAllMlaBioMembers, type MLABioRecord } from "@/lib/mla-bio-parser";
import {
  getMlaNameIndex,
  resolveMlaBioKey,
  resolveMlaBioRecord,
} from "@/lib/mla-name-matching";
import { listAllMpBioMembers } from "@/lib/mp-bio-parser";
import {
  compactMpKey,
  getMpNameIndex,
  resolveMpBioKey,
} from "@/lib/mp-name-matching";
import {
  listMlaNames,
  loadMlaPrintRecords,
  loadMpPrintRecords,
} from "@/lib/print-parser";
import type {
  House,
  MediaBreakdown,
  MediaRecord,
  MLA,
  MP,
  MPBioProfile,
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

function sentimentOfPrintRecords(records: { sentiment: Sentiment }[]): SentimentBreakdown {
  const s = { positive: 0, negative: 0, neutral: 0 };
  for (const r of records) addSentiment(s, r.sentiment);
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

function toMlaBioProfile(mlaBio: MLABioRecord): MPBioProfile {
  return {
    fullName: mlaBio.fullName,
    constituency: mlaBio.constituency,
    partyFname: mlaBio.partyFname,
    dateOfBirth: mlaBio.dateOfBirth,
    education: mlaBio.education,
    profession: mlaBio.profession,
    careerTimeline: mlaBio.careerTimeline,
  };
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
  const bioIndex = getMlaNameIndex();

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

  const upsertBioCanonical = (rawName: string): MlaUnionEntry => {
    const bioKey = resolveMlaBioKey(rawName, bioIndex);
    const canonical =
      (bioKey ? bioIndex.byKey.get(bioKey)?.fullName : null) ?? rawName;
    return upsert(canonical);
  };

  for (const e of groupByEntity(["MLA"])) {
    const entry = upsertBioCanonical(e.name);
    entry.name = entry.name || e.name;
    entry.hasMedia = true;
    entry.records.push(...e.records);
  }

  for (const name of listMlaNames()) {
    const entry = upsertBioCanonical(name);
    if (!entry.hasMedia) entry.name = name;
  }

  for (const member of listGovernmentMlaMembers()) {
    const entry = upsertBioCanonical(member.name);
    if (!entry.hasMedia) entry.name = member.name;
  }

  for (const member of listAllMlaBioMembers()) {
    const entry = upsert(member.fullName);
    entry.name = member.fullName;
  }

  return [...map.values()];
}

function sortMlaDirectory(mlas: MLA[]): MLA[] {
  const bioRank = new Map(
    listAllMlaBioMembers().map((member, index) => [
      compactMpKey(member.fullName),
      index,
    ]),
  );

  return [...mlas].sort((a, b) => {
    const aKey = resolveMlaBioKey(a.name) ?? compactMpKey(a.name);
    const bKey = resolveMlaBioKey(b.name) ?? compactMpKey(b.name);
    const aRank = aKey ? bioRank.get(aKey) : undefined;
    const bRank = bKey ? bioRank.get(bKey) : undefined;

    if (aRank != null && bRank != null) return aRank - bRank;
    if (aRank != null) return -1;
    if (bRank != null) return 1;

    return (
      b.mediaMentions - a.mediaMentions || a.name.localeCompare(b.name)
    );
  });
}

/* --------------------------- MP media index --------------------------- */

/** Media mentions keyed by canonical bio MP (joined onto JSON members). */
function buildMpMediaIndex(): Map<string, MediaRecord[]> {
  const index = getMpNameIndex();
  const map = new Map<string, MediaRecord[]>();
  for (const e of groupByEntity(["Lok Sabha MP", "Rajya Sabha MP"])) {
    const key = resolveMpBioKey(e.name, index);
    if (!key) continue;
    const existing = map.get(key) ?? [];
    existing.push(...e.records);
    map.set(key, existing);
  }
  return map;
}

/* --------------------------- Public directory --------------------------- */

export function getMLADirectory(): MLA[] {
  const mlas = collectMlaUnion().map((e) => {
    const mlaBio = resolveMlaBioRecord(e.name);
    const name = mlaBio?.fullName ?? e.name;
    const district = primaryDistrict(name, e.records) ?? "Uttar Pradesh";
    const resolvedConstituency = mlaBio?.constituency ?? district;
    const printRecords = loadMlaPrintRecords(name);
    const digitalMedia = mediaOf(e.records);
    const media: MediaBreakdown = {
      ...digitalMedia,
      print: printRecords.length,
    };
    const sentiment = mergeSentiment(
      sentimentOf(e.records),
      sentimentOfPrintRecords(printRecords),
    );
    const totalMentions = e.records.length + printRecords.length;
    const gov = lookupGovernmentMember(name, "mla");
    return {
      id: `mla-${slug(name)}`,
      name,
      bioProfile: mlaBio ? toMlaBioProfile(mlaBio) : null,
      governmentProfile: gov,
      district,
      constituency: resolvedConstituency,
      party: mlaBio?.partyFname ?? "Bharatiya Janata Party",
      designation: "Member of Legislative Assembly",
      email: `${dotted(name)}@upvidhansabha.gov.in`,
      phone: `+91 ${pick(name, "p1", 70000, 99999)} ${pick(name, "p2", 10000, 99999)}`,
      image: avatar(name),
      education: mlaBio?.education ?? gov?.highestQualification ?? "—",
      age: pick(name, "age", 40, 70),
      gender: FEMALE_NAMES.has(name) ? "Female" : "Male",
      bio: `${name} is a Member of the Legislative Assembly${
        resolvedConstituency !== district
          ? ` representing the ${resolvedConstituency} constituency`
          : ` associated with the ${district} region`
      }. This profile aggregates ${totalMentions} media mentions (including ${printRecords.length} print articles) across print, YouTube, online news and X.`,
      socialMedia: {
        twitter: `https://twitter.com/${slug(name)}`,
        facebook: `https://facebook.com/${slug(name)}`,
        instagram: `https://instagram.com/${slug(name)}`,
        website: `https://${slug(name)}.in`,
      },
      performanceScore: pick(name, "perf", 72, 96),
      attendance: pick(name, "att", 80, 99),
      publicEngagement: pick(name, "eng", 65, 95),
      mediaMentions: totalMentions,
      totalEngagement: engagementOf(e.records),
      media,
      sentiment,
    } satisfies MLA;
  });

  return sortMlaDirectory(mlas);
}

export function getMPDirectory(): MP[] {
  const mediaIndex = buildMpMediaIndex();

  return listAllMpBioMembers()
    .map((mpBio) => {
      const name = mpBio.fullName;
      const house = mpBio.house;
      const houses: House[] = [house];
      const records = mediaIndex.get(compactMpKey(name)) ?? [];
      const realDistrict = primaryDistrict(name, records);
      const district = realDistrict ?? "Uttar Pradesh";
      const resolvedConstituency =
        mpBio.constituency ??
        (house === "Rajya Sabha"
          ? "Rajya Sabha — Uttar Pradesh"
          : realDistrict ?? "Uttar Pradesh");
      const printRecords = loadMpPrintRecords(name);
      const digitalMedia = mediaOf(records);
      const media: MediaBreakdown = {
        ...digitalMedia,
        print: printRecords.length,
      };
      const sentiment = mergeSentiment(
        sentimentOf(records),
        sentimentOfPrintRecords(printRecords),
      );
      const totalMentions = records.length + printRecords.length;
      const bio =
        house === "Rajya Sabha"
          ? `${name} is a Member of the Rajya Sabha representing Uttar Pradesh. This profile aggregates ${totalMentions} media mentions (including ${printRecords.length} print articles) across print, YouTube, online news and X.`
          : `${name} is a Member of the Lok Sabha associated with the ${resolvedConstituency} constituency. This profile aggregates ${totalMentions} media mentions (including ${printRecords.length} print articles) across print, YouTube, online news and X.`;
      const houseSlug = house === "Lok Sabha" ? "lok" : "raj";
      return {
        id: `mp-${houseSlug}-${slug(name)}`,
        name,
        bioProfile: {
          fullName: mpBio.fullName,
          constituency: mpBio.constituency,
          partyFname: mpBio.partyFname,
          dateOfBirth: mpBio.dateOfBirth,
          education: mpBio.education,
          profession: mpBio.profession,
          careerTimeline: mpBio.careerTimeline,
        },
        house,
        houses,
        constituency: resolvedConstituency,
        district,
        party: mpBio.partyFname ?? "Bharatiya Janata Party",
        designation: `Member of ${house}`,
        email: `${dotted(name)}@sansad.nic.in`,
        phone: `+91 ${pick(name, "p1", 70000, 99999)} ${pick(name, "p2", 10000, 99999)}`,
        image: avatar(name),
        education: mpBio.education ?? "—",
        age: pick(name, "age", 42, 74),
        gender: FEMALE_NAMES.has(name) ? "Female" : "Male",
        bio,
        termSince: pick(name, "term", 2014, 2024),
        socialMedia: {
          twitter: `https://twitter.com/${slug(name)}`,
          facebook: `https://facebook.com/${slug(name)}`,
          instagram: `https://instagram.com/${slug(name)}`,
          website: `https://${slug(name)}.in`,
        },
        performanceScore: pick(name, "perf", 74, 97),
        attendance: pick(name, "att", 82, 99),
        publicEngagement: pick(name, "eng", 68, 96),
        mediaMentions: totalMentions,
        totalEngagement: engagementOf(records),
        media,
        sentiment,
      } satisfies MP;
    })
    .sort((a, b) => {
      const aMentions = a.mediaMentions;
      const bMentions = b.mediaMentions;
      return bMentions - aMentions || a.name.localeCompare(b.name);
    });
}
