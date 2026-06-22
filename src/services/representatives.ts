import "server-only";
import {
  getMlaBioById,
  getMpBioById,
  listAllMlaBioMembers,
  listAllMpBioMembers,
  type MLABioRecord,
  type MPBioRecord,
} from "@/lib/representatives-db";
import {
  queryDigitalMedia,
  queryPrintRecords,
} from "@/lib/news-repository";
import type {
  MediaBreakdown,
  MediaRecord,
  MLAListItem,
  MLA,
  MP,
  MPBioProfile,
  MPListItem,
  SentimentBreakdown,
} from "@/lib/types";

function sentimentOf(records: MediaRecord[]): SentimentBreakdown {
  const s = { positive: 0, negative: 0, neutral: 0 };
  for (const r of records) {
    if (r.sentiment === "Positive") s.positive += 1;
    else if (r.sentiment === "Negative") s.negative += 1;
    else s.neutral += 1;
  }
  return s;
}

function mediaOf(records: MediaRecord[]): MediaBreakdown {
  const m = { print: 0, youtube: 0, x: 0, online: 0 };
  for (const r of records) {
    if (r.mediaType === "YouTube") m.youtube += 1;
    else if (r.mediaType === "X") m.x += 1;
    else m.online += 1;
  }
  return m;
}

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

function toBioProfile(bio: MLABioRecord | MPBioRecord): MPBioProfile {
  return {
    fullName: bio.fullName,
    constituency: bio.constituency,
    partyFname: bio.partyFname,
    dateOfBirth: bio.dateOfBirth,
    education: bio.education,
    profession: bio.profession,
    careerTimeline: bio.careerTimeline,
  };
}

function linkedDigitalRecords(name: string): MediaRecord[] {
  return queryDigitalMedia({ entity: name }).records;
}

function linkedPrintCount(name: string, source: "mla" | "mp"): number {
  return queryPrintRecords({ entity: name, printSource: source }).total;
}

function buildMlaDetail(
  mlaBio: MLABioRecord,
  records: MediaRecord[],
  printCount: number,
): MLA {
  const name = mlaBio.fullName;
  const digitalMedia = mediaOf(records);

  return {
    id: mlaBio.id,
    name,
    bioProfile: toBioProfile(mlaBio),
    governmentProfile: null,
    district: primaryDistrict(name, records),
    constituency: mlaBio.constituency,
    party: mlaBio.partyFname,
    designation: "Member of Legislative Assembly",
    email: null,
    phone: null,
    image: null,
    education: mlaBio.education,
    age: null,
    gender: null,
    bio: null,
    socialMedia: null,
    performanceScore: null,
    attendance: null,
    publicEngagement: null,
    mediaMentions: records.length + printCount,
    totalEngagement: 0,
    media: { ...digitalMedia, print: printCount },
    sentiment: sentimentOf(records),
  };
}

function buildMpDetail(
  mpBio: MPBioRecord,
  records: MediaRecord[],
  printCount: number,
): MP {
  const name = mpBio.fullName;
  const digitalMedia = mediaOf(records);

  return {
    id: mpBio.id,
    name,
    bioProfile: toBioProfile(mpBio),
    house: mpBio.house,
    houses: [mpBio.house],
    constituency: mpBio.constituency,
    district: primaryDistrict(name, records),
    party: mpBio.partyFname,
    designation: `Member of ${mpBio.house}`,
    email: null,
    phone: null,
    image: null,
    education: mpBio.education,
    age: null,
    gender: null,
    bio: null,
    termSince: null,
    socialMedia: null,
    performanceScore: null,
    attendance: null,
    publicEngagement: null,
    mediaMentions: records.length + printCount,
    totalEngagement: 0,
    media: { ...digitalMedia, print: printCount },
    sentiment: sentimentOf(records),
  };
}

export function getMLAList(): MLAListItem[] {
  return listAllMlaBioMembers().map((bio) => ({
    id: bio.id,
    name: bio.fullName,
    constituency: bio.constituency,
    party: bio.partyFname,
  }));
}

export function getMLAById(id: string): MLA | null {
  const bio = getMlaBioById(id);
  if (!bio) return null;
  const name = bio.fullName;
  const records = linkedDigitalRecords(name);
  const printCount = linkedPrintCount(name, "mla");
  return buildMlaDetail(bio, records, printCount);
}

export function getMPList(): MPListItem[] {
  return listAllMpBioMembers()
    .map((bio) => ({
      id: bio.id,
      name: bio.fullName,
      house: bio.house,
      constituency: bio.constituency,
      party: bio.partyFname,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getMPById(id: string, house?: MP["house"]): MP | null {
  const bio = getMpBioById(id, house);
  if (!bio) return null;
  const name = bio.fullName;
  const records = linkedDigitalRecords(name);
  const printCount = linkedPrintCount(name, "mp");
  return buildMpDetail(bio, records, printCount);
}
