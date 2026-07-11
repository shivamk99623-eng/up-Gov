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
  queryEntityMediaStats,
  type EntityMediaStats,
} from "@/lib/news-repository";
import {
  getMlaElectionHistory,
  getMpElectionHistory,
} from "@/lib/person-election-data";
import type {
  GlobalFilters,
  MLAListItem,
  MLA,
  MP,
  MPBioProfile,
  MPListItem,
} from "@/lib/types";

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

function buildMlaDetail(mlaBio: MLABioRecord, stats: EntityMediaStats): MLA {
  const name = mlaBio.fullName;

  return {
    id: mlaBio.id,
    name,
    bioProfile: toBioProfile(mlaBio),
    governmentProfile: null,
    district: stats.primaryDistrict,
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
    mediaMentions: stats.digitalTotal + stats.printTotal,
    totalEngagement: stats.totalEngagement,
    media: stats.media,
    sentiment: stats.sentiment,
    electionHistory: getMlaElectionHistory(name),
  };
}

function buildMpDetail(mpBio: MPBioRecord, stats: EntityMediaStats): MP {
  const name = mpBio.fullName;
  const electionHistory =
    mpBio.house === "Lok Sabha" ? getMpElectionHistory(name) : null;

  return {
    id: mpBio.id,
    name,
    bioProfile: toBioProfile(mpBio),
    house: mpBio.house,
    houses: [mpBio.house],
    constituency: mpBio.constituency,
    district: stats.primaryDistrict,
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
    mediaMentions: stats.digitalTotal + stats.printTotal,
    totalEngagement: stats.totalEngagement,
    media: stats.media,
    sentiment: stats.sentiment,
    electionHistory,
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

export function getMLAById(
  id: string,
  filters: GlobalFilters = {},
): MLA | null {
  const bio = getMlaBioById(id);
  if (!bio) return null;
  const stats = queryEntityMediaStats(bio.fullName, "mla", filters);
  return buildMlaDetail(bio, stats);
}

export function getMPList(): MPListItem[] {
  return listAllMpBioMembers().map((bio) => ({
    id: bio.id,
    name: bio.fullName,
    house: bio.house,
    constituency: bio.constituency,
    party: bio.partyFname,
  }));
}

export function getMPById(
  id: string,
  house?: MP["house"],
  filters: GlobalFilters = {},
): MP | null {
  const bio = getMpBioById(id, house);
  if (!bio) return null;
  const stats = queryEntityMediaStats(bio.fullName, "mp", filters);
  return buildMpDetail(bio, stats);
}
