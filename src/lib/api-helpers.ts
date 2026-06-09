import type { GlobalFilters, MediaType, Sentiment } from "./types";

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
