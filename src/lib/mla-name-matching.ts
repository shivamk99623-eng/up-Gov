import "server-only";
import { listAllMlaBioMembers, type MLABioRecord } from "./mla-bio-parser";
import {
  compactMpKey,
  normalizeMpCore,
} from "./mp-name-matching";

export interface MlaNameIndex {
  byKey: Map<string, MLABioRecord>;
  aliasToKey: Map<string, string>;
}

const CORE_REPLACEMENTS: [string, string][] = [
  ["agarwal", "agrawal"],
  ["bajpai", "bajpayee"],
  ["dharampal", "dharmpal"],
];

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

export function buildMlaNameIndex(): MlaNameIndex {
  const byKey = new Map<string, MLABioRecord>();
  const aliasToKey = new Map<string, string>();

  for (const member of listAllMlaBioMembers()) {
    const key = compactMpKey(member.fullName);
    byKey.set(key, member);
    registerNameVariants(aliasToKey, member.fullName, key);
  }

  return { byKey, aliasToKey };
}

let cachedIndex: MlaNameIndex | null = null;

export function getMlaNameIndex(): MlaNameIndex {
  if (!cachedIndex) cachedIndex = buildMlaNameIndex();
  return cachedIndex;
}

function lookupAlias(name: string, index: MlaNameIndex): string | null {
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

function tokenSubsetMatch(name: string, index: MlaNameIndex): string | null {
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

/** Resolves any MLA name variant to the canonical compact bio key. */
export function resolveMlaBioKey(
  name: string | null | undefined,
  index: MlaNameIndex = getMlaNameIndex(),
): string | null {
  if (!name?.trim()) return null;

  const direct = lookupAlias(name, index);
  if (direct) return direct;

  return tokenSubsetMatch(name, index);
}

export function resolveMlaBioRecord(
  name: string | null | undefined,
  index: MlaNameIndex = getMlaNameIndex(),
): MLABioRecord | null {
  const key = resolveMlaBioKey(name, index);
  return key ? (index.byKey.get(key) ?? null) : null;
}
