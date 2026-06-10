import "server-only";
import type { GlobalFilters, MediaType, Sentiment } from "./types";

let warmCaches: Promise<void> | null = null;

/**
 * Parses Excel/JSON data once per server process. Concurrent cold requests
 * share the same in-flight promise instead of each triggering a full reload.
 */
export function warmDataCaches(): Promise<void> {
  if (!warmCaches) {
    warmCaches = (async () => {
      const [{ loadRecords }, { loadAllPrintRecords }, { listAllMpBioMembers }] =
        await Promise.all([
          import("@/lib/excel-parser"),
          import("@/lib/print-parser"),
          import("@/lib/mp-bio-parser"),
        ]);
      loadRecords();
      loadAllPrintRecords();
      listAllMpBioMembers();
    })();
  }
  return warmCaches;
}

/** Parses shared global filters from a request's URL search params. */
export function parseFilters(searchParams: URLSearchParams): GlobalFilters {
  const get = (k: string) => {
    const v = searchParams.get(k);
    return v && v !== "All" && v.length ? v : null;
  };
  return {
    district: get("district"),
    constituency: get("constituency"),
    mediaType: (get("mediaType") as MediaType | null) ?? null,
    sentiment: (get("sentiment") as Sentiment | null) ?? null,
    language: get("language"),
    search: get("search"),
    dateFrom: get("dateFrom"),
    dateTo: get("dateTo"),
    entity: get("entity"),
    printSource: (() => {
      const v = searchParams.get("printSource");
      return v === "district" || v === "mla" || v === "mp" ? v : null;
    })(),
  };
}

export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}
