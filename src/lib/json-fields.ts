import "server-only";

export interface DistrictRef {
  dt_code?: string;
  district?: string;
}

/** Parses a JSON array column (or plain string) into string values. */
export function parseJsonStringArray(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "district" in item) {
          return String((item as DistrictRef).district ?? "").trim();
        }
        return String(item).trim();
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return parseJsonStringArray(JSON.parse(trimmed));
    } catch {
      return [trimmed];
    }
  }
  return [String(value).trim()].filter(Boolean);
}

/** Extracts person names from JSON array columns, including mildly malformed JSON. */
export function parsePersonNameArray(value: unknown): string[] {
  if (value == null || value === "") return [];

  const parsed = parseJsonStringArray(value);
  if (typeof value !== "string") return parsed;

  const trimmed = value.trim();
  if (!trimmed.startsWith("[")) return parsed;

  const quoted = [...trimmed.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1].trim().replace(/,+$/, ""))
    .filter(Boolean);

  if (quoted.length > parsed.length) return quoted;
  if (quoted.length && parsed.length === 1 && parsed[0] === trimmed) {
    return quoted;
  }

  return parsed;
}

export function parseDistrictNames(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parseDistrictNames(parsed);
    } catch {
      return [value.trim()].filter(Boolean);
    }
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "district" in item) {
          return String((item as DistrictRef).district ?? "").trim();
        }
        return "";
      })
      .filter(Boolean);
  }
  return [];
}

export function jsonArrayContains(
  columnValue: unknown,
  target: string,
  normalize = (s: string) => s.toLowerCase(),
): boolean {
  const needle = normalize(target);
  return parseJsonStringArray(columnValue).some(
    (item) => normalize(item) === needle,
  );
}
