import { create } from "zustand";
import { startTransition } from "react";
import type { MediaType, Sentiment } from "@/lib/types";
import { normalizeSearchFilter } from "@/lib/search-filter";

export interface FilterState {
  dateFrom: string | null;
  dateTo: string | null;
  district: string | null;
  mediaType: MediaType | "All";
  sentiment: Sentiment | "All";
  language: string | null;
  /** Immediate input value (debounced into `search` for API calls). */
  searchInput: string;
  search: string;

  setDateRange: (from: string | null, to: string | null) => void;
  setDistrict: (d: string | null) => void;
  setMediaType: (m: MediaType | "All") => void;
  setSentiment: (s: Sentiment | "All") => void;
  setLanguage: (l: string | null) => void;
  setSearchInput: (q: string) => void;
  setSearch: (q: string) => void;
  reset: () => void;
}

// Default to the latest week present in database/data.db (news ends ~2026-06-22).
const initial = {
  dateFrom: new Date("2026-06-29").toISOString(),
  dateTo: new Date("2026-07-10").toISOString(),
  district: null,
  mediaType: "All" as const,
  sentiment: "All" as const,
  language: null,
  searchInput: "",
  search: "",
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initial,
  setDateRange: (dateFrom, dateTo) =>
    startTransition(() => set({ dateFrom, dateTo })),
  setDistrict: (district) => startTransition(() => set({ district })),
  setMediaType: (mediaType) => startTransition(() => set({ mediaType })),
  setSentiment: (sentiment) => startTransition(() => set({ sentiment })),
  setLanguage: (language) => startTransition(() => set({ language })),
  setSearchInput: (searchInput) => set({ searchInput }),
  setSearch: (search) => set({ search }),
  reset: () => startTransition(() => set({ ...initial })),
}));

/** Builds a query-string from the current global filters. */
export function buildFilterQuery(state: Partial<FilterState>): string {
  const params = new URLSearchParams();
  if (state.dateFrom) params.set("dateFrom", state.dateFrom);
  if (state.dateTo) params.set("dateTo", state.dateTo);
  if (state.district) params.set("district", state.district);
  if (state.mediaType && state.mediaType !== "All")
    params.set("mediaType", state.mediaType);
  if (state.sentiment && state.sentiment !== "All")
    params.set("sentiment", state.sentiment);
  if (state.language) params.set("language", state.language);
  const search = normalizeSearchFilter(state.search);
  if (search) params.set("search", search);
  return params.toString();
}
