import "server-only";
import {
  compactPersonKey,
  normalizePersonName,
  stripHonorifics,
} from "./name-search";
import {
  listAllMlaBioMembers,
  listAllMpBioMembers,
  type MLABioRecord,
  type MPBioRecord,
} from "./representatives-db";

export {
  compactPersonKey as compactMpKey,
  normalizePersonName as normalizeMpCore,
  stripHonorifics as stripTitles,
} from "./name-search";

const CORE_REPLACEMENTS: [string, string][] = [
  ["agarwal", "agrawal"],
  ["bajpai", "bajpayee"],
  ["dharampal", "dharmpal"],
];

export interface PersonNameIndex<T> {
  byKey: Map<string, T>;
  aliasToKey: Map<string, string>;
}

export type MpNameIndex = PersonNameIndex<MPBioRecord>;
export type MlaNameIndex = PersonNameIndex<MLABioRecord>;

function expandSpellingVariants(value: string): string[] {
  const variants = new Set<string>([value]);
  for (const [a, b] of CORE_REPLACEMENTS) {
    if (value.includes(a)) variants.add(value.replaceAll(a, b));
    if (value.includes(b)) variants.add(value.replaceAll(b, a));
  }
  return [...variants];
}

function extractAliasNames(fullName: string): string[] {
  const names = [fullName];
  const aliasMatch = fullName.match(/\balias\s+(.+)$/i);
  if (aliasMatch) {
    names.push(aliasMatch[1].trim());
    names.push(fullName.slice(0, aliasMatch.index).trim());
  }
  return names;
}

function tokenize(name: string): string[] {
  return normalizePersonName(name).split(/\s+/).filter(Boolean);
}

function registerAlias(
  aliasToKey: Map<string, string>,
  alias: string,
  key: string,
): void {
  if (!alias || aliasToKey.has(alias)) return;
  aliasToKey.set(alias, key);
}

function registerNameVariants(
  aliasToKey: Map<string, string>,
  rawName: string,
  key: string,
): void {
  for (const name of extractAliasNames(rawName)) {
    const core = normalizePersonName(name);
    const compact = compactPersonKey(name);
    registerAlias(aliasToKey, core, key);
    registerAlias(aliasToKey, compact, key);
    for (const variant of expandSpellingVariants(core)) {
      registerAlias(aliasToKey, variant, key);
      registerAlias(aliasToKey, variant.replace(/\s+/g, ""), key);
    }

    const tokens = tokenize(name);
    for (let len = 2; len <= tokens.length; len++) {
      const prefix = tokens.slice(0, len).join(" ");
      registerAlias(aliasToKey, prefix, key);
      registerAlias(aliasToKey, prefix.replace(/\s+/g, ""), key);
      for (const variant of expandSpellingVariants(prefix)) {
        registerAlias(aliasToKey, variant, key);
        registerAlias(aliasToKey, variant.replace(/\s+/g, ""), key);
      }
    }
  }
}

function buildNameIndex<T extends { fullName: string }>(
  members: T[],
  keyFn: (member: T) => string,
): PersonNameIndex<T> {
  const byKey = new Map<string, T>();
  const aliasToKey = new Map<string, string>();

  for (const member of members) {
    const key = keyFn(member);
    byKey.set(key, member);
    registerNameVariants(aliasToKey, member.fullName, key);
  }

  return { byKey, aliasToKey };
}

export function buildMpNameIndex(): MpNameIndex {
  return buildNameIndex(listAllMpBioMembers(), (member) =>
    compactPersonKey(member.fullName),
  );
}

export function buildMlaNameIndex(): MlaNameIndex {
  return buildNameIndex(listAllMlaBioMembers(), (member) =>
    compactPersonKey(member.fullName),
  );
}

let cachedMpIndex: MpNameIndex | null = null;
let cachedMlaIndex: MlaNameIndex | null = null;

export function getMpNameIndex(): MpNameIndex {
  if (!cachedMpIndex) cachedMpIndex = buildMpNameIndex();
  return cachedMpIndex;
}

export function getMlaNameIndex(): MlaNameIndex {
  if (!cachedMlaIndex) cachedMlaIndex = buildMlaNameIndex();
  return cachedMlaIndex;
}

function lookupAlias(name: string, index: PersonNameIndex<unknown>): string | null {
  const candidates = new Set<string>([
    normalizePersonName(name),
    compactPersonKey(name),
  ]);

  for (const base of [normalizePersonName(name), compactPersonKey(name)]) {
    for (const variant of expandSpellingVariants(base)) {
      candidates.add(variant);
      candidates.add(variant.replace(/\s+/g, ""));
    }
  }

  for (const candidate of candidates) {
    const hit = index.aliasToKey.get(candidate);
    if (hit) return hit;
  }
  return null;
}

function tokenSubsetMatch(
  name: string,
  index: PersonNameIndex<{ fullName: string }>,
): string | null {
  const queryTokens = tokenize(name);
  if (queryTokens.length < 2) return null;

  let bestKey: string | null = null;
  let bestScore = 0;

  for (const [key, member] of index.byKey) {
    for (const aliasName of extractAliasNames(member.fullName)) {
      const targetTokens = tokenize(aliasName);
      const targetSet = new Set(targetTokens);
      const matched = queryTokens.filter((t) => targetSet.has(t)).length;
      if (matched !== queryTokens.length) continue;

      const score = matched * 100 - targetTokens.length;
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }
  }

  return bestKey;
}

function resolveBioKey(
  name: string | null | undefined,
  index: PersonNameIndex<{ fullName: string }>,
): string | null {
  if (!name?.trim()) return null;

  const direct = lookupAlias(name, index);
  if (direct) return direct;

  return tokenSubsetMatch(name, index);
}

/** Resolves any MP name variant to the canonical compact bio key. */
export function resolveMpBioKey(
  name: string | null | undefined,
  index: MpNameIndex = getMpNameIndex(),
): string | null {
  return resolveBioKey(name, index);
}

export function resolveMlaBioKey(
  name: string | null | undefined,
  index: MlaNameIndex = getMlaNameIndex(),
): string | null {
  return resolveBioKey(name, index);
}

export function resolveMpBioRecord(
  name: string | null | undefined,
  index: MpNameIndex = getMpNameIndex(),
): MPBioRecord | null {
  const key = resolveMpBioKey(name, index);
  return key ? (index.byKey.get(key) ?? null) : null;
}

export function resolveMlaBioRecord(
  name: string | null | undefined,
  index: MlaNameIndex = getMlaNameIndex(),
): MLABioRecord | null {
  const key = resolveMlaBioKey(name, index);
  return key ? (index.byKey.get(key) ?? null) : null;
}

function namesMatchInIndex(
  a: string | null | undefined,
  b: string | null | undefined,
  index: PersonNameIndex<unknown>,
): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  if (a.trim() === b.trim()) return true;

  const keyA = resolveBioKey(a, index as PersonNameIndex<{ fullName: string }>);
  const keyB = resolveBioKey(b, index as PersonNameIndex<{ fullName: string }>);
  if (keyA && keyB) return keyA === keyB;

  return normalizePersonName(a) === normalizePersonName(b);
}

/** True when two names refer to the same MP in the bio JSON (or are identical). */
export function mpNamesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
  index: MpNameIndex = getMpNameIndex(),
): boolean {
  return namesMatchInIndex(a, b, index);
}

export function mlaNamesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
  index: MlaNameIndex = getMlaNameIndex(),
): boolean {
  return namesMatchInIndex(a, b, index);
}

/** Matches MLA or MP names across honorifics, aliases, and spelling variants. */
export function personNamesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  return (
    mpNamesMatch(a, b) ||
    mlaNamesMatch(a, b) ||
    normalizePersonName(a ?? "") === normalizePersonName(b ?? "")
  );
}
