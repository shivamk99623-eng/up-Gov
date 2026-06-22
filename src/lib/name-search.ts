/** Honorifics and titles stripped before person-name search/matching. */
const HONORIFIC_RE =
  /^(?:(?:shri|shrimati|smt|smt\.|dr|dr\.|prof|prof\.|adv|adv\.|mr|mr\.|mrs|mrs\.|ms|ms\.|miss|hon(?:'ble)?|late|pt|pandit|ku|kumari|ml|ml\.)\s*)+/i;

/** Spelling variants seen across news files and bio JSON. */
const SPELLING_VARIANTS: [string, string][] = [
  ["agarwal", "agrawal"],
  ["bajpai", "bajpayee"],
  ["dharampal", "dharmpal"],
];

export function stripHonorifics(name: string): string {
  let s = name.trim().replace(/\u00a0/g, " ");
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(HONORIFIC_RE, "").trim();
  }
  return s;
}

/** Lowercase person name with honorifics and punctuation normalized. */
export function normalizePersonName(name: string): string {
  return stripHonorifics(name)
    .toLowerCase()
    .replace(/[\[\]]/g, "")
    .replace(/,/g, " ")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Letters-only compact key for cross-format joins. */
export function compactPersonKey(name: string): string {
  return normalizePersonName(name).replace(/\s+/g, "");
}

function expandSpellingVariants(value: string): string[] {
  const variants = new Set<string>([value]);
  for (const [a, b] of SPELLING_VARIANTS) {
    if (value.includes(a)) variants.add(value.replaceAll(a, b));
    if (value.includes(b)) variants.add(value.replaceAll(b, a));
  }
  return [...variants];
}

/** Tokenizes free text for semantic search (titles stripped). */
export function tokenizeSearch(text: string): string[] {
  const normalized = normalizePersonName(text);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

function searchBlob(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .map((p) => normalizePersonName(String(p)))
    .join(" ");
}

/**
 * True when every query token appears in the combined searchable text.
 * Honorifics in the query (e.g. "Dr", "Shri") are ignored.
 */
export function matchesSemanticSearch(
  query: string,
  ...texts: (string | null | undefined)[]
): boolean {
  const tokens = tokenizeSearch(query);
  if (!tokens.length) return true;

  const hay = searchBlob(...texts);
  if (!hay) return false;

  const hayVariants = new Set<string>([hay, hay.replace(/\s+/g, "")]);
  for (const variant of expandSpellingVariants(hay)) {
    hayVariants.add(variant);
    hayVariants.add(variant.replace(/\s+/g, ""));
  }

  return tokens.every((token) => {
    const tokenVariants = expandSpellingVariants(token);
    for (const t of tokenVariants) {
      for (const h of hayVariants) {
        if (h.includes(t)) return true;
      }
    }
    return false;
  });
}

export function buildPersonSearchKeywords(
  ...parts: (string | null | undefined)[]
): string {
  return searchBlob(...parts);
}

export function formatRepOptionLabel(
  name: string,
  constituency: string | null,
  party: string | null,
): string {
  return constituency || party
    ? `${name} — ${[constituency, party].filter(Boolean).join(" · ")}`
    : name;
}

export interface RepSelectOption {
  label: string;
  value: string;
  keywords: string;
}

export function buildRepSelectOption(
  id: string,
  name: string,
  constituency: string | null,
  party: string | null,
): RepSelectOption {
  return {
    label: formatRepOptionLabel(name, constituency, party),
    value: id,
    keywords: buildPersonSearchKeywords(name, constituency, party),
  };
}
