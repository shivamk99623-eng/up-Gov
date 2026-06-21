import type { Sentiment, SortDirection } from "./types";

export type { SortDirection };

/** Table-level query params sent to media APIs (pagination, search, sort, filters). */
export interface MediaTableQuery {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string | null;
  sortDir: SortDirection | null;
  sentiment: Sentiment | "All";
  language: string | null;
}

export function createMediaTableQuery(
  partial?: Partial<MediaTableQuery>,
): MediaTableQuery {
  return {
    page: 1,
    pageSize: 50,
    search: "",
    sortBy: null,
    sortDir: null,
    sentiment: "All",
    language: null,
    ...partial,
  };
}

export function appendMediaTableQuery(
  params: URLSearchParams,
  query?: MediaTableQuery,
) {
  if (!query) return;
  params.set("page", String(query.page));
  params.set("limit", String(query.pageSize));
  if (query.search.trim()) params.set("search", query.search.trim());
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortDir) params.set("sortDir", query.sortDir);
  if (query.sentiment !== "All") params.set("sentiment", query.sentiment);
  if (query.language) params.set("language", query.language);
}
