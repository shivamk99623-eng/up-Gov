import { create } from "zustand";
import type { MediaType, Sentiment } from "@/lib/types";

export interface FilterState {
  dateFrom: string | null;
  dateTo: string | null;
  district: string | null;
  mediaType: MediaType | "All";
  sentiment: Sentiment | "All";
  language: string | null;
  search: string;

  setDateRange: (from: string | null, to: string | null) => void;
  setDistrict: (d: string | null) => void;
  setMediaType: (m: MediaType | "All") => void;
  setSentiment: (s: Sentiment | "All") => void;
  setLanguage: (l: string | null) => void;
  setSearch: (q: string) => void;
  reset: () => void;
}

const initial = {
  dateFrom: null,
  dateTo: null,
  district: null,
  mediaType: "All" as const,
  sentiment: "All" as const,
  language: null,
  search: "",
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initial,
  setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
  setDistrict: (district) => set({ district }),
  setMediaType: (mediaType) => set({ mediaType }),
  setSentiment: (sentiment) => set({ sentiment }),
  setLanguage: (language) => set({ language }),
  setSearch: (search) => set({ search }),
  reset: () => set({ ...initial }),
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
  if (state.search) params.set("search", state.search);
  return params.toString();
}
