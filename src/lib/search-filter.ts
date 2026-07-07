/** Minimum token length for text search (avoids full-table scans). */
export const MIN_SEARCH_TOKEN_LENGTH = 3;

/** Normalizes user search input; returns null when no valid tokens remain. */
export function normalizeSearchFilter(
  search: string | null | undefined,
): string | null {
  const trimmed = search?.trim();
  if (!trimmed) return null;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const valid = tokens.filter((t) => t.length >= MIN_SEARCH_TOKEN_LENGTH);
  if (!valid.length) return null;
  return valid.join(" ");
}
