import "server-only";
import { listAllMpBioMembers, type MPBioRecord } from "./mp-bio-parser";

const TITLE_RE =
  /^(?:(?:shri|shrimati|smt|dr|prof|adv|mr|mrs|ms|miss)\.?\s*)+/i;

/** Spelling / formatting variants seen across news files and bio JSON. */
const CORE_REPLACEMENTS: [string, string][] = [
  ["agarwal", "agrawal"],
  ["bajpai", "bajpayee"],
  ["dharampal", "dharmpal"],
];

export interface MpNameIndex {
  byKey: Map<string, MPBioRecord>;
  aliasToKey: Map<string, string>;
}

function stripTitles(name: string): string {
  let s = name.trim().replace(/\u00a0/g, " ");
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(TITLE_RE, "").trim();
  }
  return s;
}

/** Lowercase core name with titles and dots removed. */
export function normalizeMpCore(name: string): string {
  return stripTitles(name)
    .toLowerCase()
    .replace(/[\[\]]/g, "")
    .replace(/,/g, " ")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Letters-only compact key for cross-format joins. */
export function compactMpKey(name: string): string {
  return normalizeMpCore(name).replace(/\s+/g, "");
}

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
  return normalizeMpCore(name).split(/\s+/).filter(Boolean);
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
    const core = normalizeMpCore(name);
    const compact = compactMpKey(name);
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

export function buildMpNameIndex(): MpNameIndex {
  const byKey = new Map<string, MPBioRecord>();
  const aliasToKey = new Map<string, string>();

  for (const member of listAllMpBioMembers()) {
    const key = compactMpKey(member.fullName);
    byKey.set(key, member);
    registerNameVariants(aliasToKey, member.fullName, key);
  }

  return { byKey, aliasToKey };
}

let cachedIndex: MpNameIndex | null = null;

export function getMpNameIndex(): MpNameIndex {
  if (!cachedIndex) cachedIndex = buildMpNameIndex();
  return cachedIndex;
}

function lookupAlias(name: string, index: MpNameIndex): string | null {
  const candidates = new Set<string>([
    normalizeMpCore(name),
    compactMpKey(name),
  ]);

  for (const base of [normalizeMpCore(name), compactMpKey(name)]) {
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

function tokenSubsetMatch(name: string, index: MpNameIndex): string | null {
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

/** Resolves any MP name variant to the canonical compact bio key. */
export function resolveMpBioKey(
  name: string | null | undefined,
  index: MpNameIndex = getMpNameIndex(),
): string | null {
  if (!name?.trim()) return null;

  const direct = lookupAlias(name, index);
  if (direct) return direct;

  return tokenSubsetMatch(name, index);
}

export function resolveMpBioRecord(
  name: string | null | undefined,
  index: MpNameIndex = getMpNameIndex(),
): MPBioRecord | null {
  const key = resolveMpBioKey(name, index);
  return key ? (index.byKey.get(key) ?? null) : null;
}

/** True when two names refer to the same MP in the bio JSON (or are identical). */
export function mpNamesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
  index: MpNameIndex = getMpNameIndex(),
): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  if (a.trim() === b.trim()) return true;

  const keyA = resolveMpBioKey(a, index);
  const keyB = resolveMpBioKey(b, index);
  if (keyA && keyB) return keyA === keyB;

  return normalizeMpCore(a) === normalizeMpCore(b);
}
