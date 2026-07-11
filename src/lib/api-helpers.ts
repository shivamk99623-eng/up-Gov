import "server-only";
import type { ConstituencyScope, GlobalFilters, MediaType, Sentiment, SortDirection } from "./types";
import { normalizePagination, normalizeSearchFilter } from "./news-repository";

/** Parses shared global filters from a request's URL search params. */
export function parseFilters(searchParams: URLSearchParams): GlobalFilters {
  const get = (k: string) => {
    const v = searchParams.get(k);
    return v && v !== "All" && v.length ? v : null;
  };
  const sortDir = searchParams.get("sortDir");
  return {
    district: get("district"),
    constituency: get("constituency"),
    mediaType: (get("mediaType") as MediaType | null) ?? null,
    sentiment: (get("sentiment") as Sentiment | null) ?? null,
    language: get("language"),
    search: normalizeSearchFilter(searchParams.get("search")),
    dateFrom: get("dateFrom"),
    dateTo: get("dateTo"),
    entity: get("entity"),
    sortBy: get("sortBy"),
    sortDir:
      sortDir === "asc" || sortDir === "desc"
        ? (sortDir as SortDirection)
        : null,
    printSource: (() => {
      const v = searchParams.get("printSource");
      return v === "district" || v === "mla" || v === "mp" ? v : null;
    })(),
    constituencyScope: (() => {
      const v = searchParams.get("constituencyScope");
      if (v === "legislative") return "legislative";
      if (v === "parliamentary") return "parliamentary";
      return null;
    })(),
  };
}

export function parsePagination(searchParams: URLSearchParams) {
  return normalizePagination(
    searchParams.get("page"),
    searchParams.get("limit") ?? searchParams.get("pageSize"),
  );
}

export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}
