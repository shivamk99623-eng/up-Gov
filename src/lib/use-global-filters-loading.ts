"use client";

import { useIsFetching } from "@tanstack/react-query";
import { DEBOUNCE } from "@/lib/debounce-throttle";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useFilterStore } from "@/store/filters";
import { normalizeSearchFilter } from "@/lib/search-filter";

/** React Query roots that refetch when global filters change. */
export const GLOBAL_FILTER_QUERY_ROOTS = new Set([
  "dashboard",
  "print",
  "scoped-media",
  "district",
  "constituency",
  "constituency-print",
  "mp",
  "mla",
]);

function useFilterDrivenFetching(): boolean {
  const fetchingCount = useIsFetching({
    predicate: (query) =>
      typeof query.queryKey[0] === "string" &&
      GLOBAL_FILTER_QUERY_ROOTS.has(query.queryKey[0]),
  });
  return fetchingCount > 0;
}

/** True when global date filters are waiting to settle. */
export function useGlobalFiltersPending(): boolean {
  const rawDateFrom = useFilterStore((s) => s.dateFrom);
  const rawDateTo = useFilterStore((s) => s.dateTo);
  const debouncedDateFrom = useDebouncedValue(rawDateFrom, DEBOUNCE.DATE_MS);
  const debouncedDateTo = useDebouncedValue(rawDateTo, DEBOUNCE.DATE_MS);

  return rawDateFrom !== debouncedDateFrom || rawDateTo !== debouncedDateTo;
}

/**
 * True while global filters are debouncing or filter-driven queries are in flight.
 * Use this to show loading UI on every page when filters change.
 */
export function useGlobalFiltersLoading(): {
  isLoading: boolean;
  isDebouncing: boolean;
  isFetching: boolean;
} {
  const searchInput = useFilterStore((s) => s.searchInput);
  const search = useFilterStore((s) => s.search);
  const debouncedInput = useDebouncedValue(searchInput, DEBOUNCE.SEARCH_MS);
  const effectiveDebounced = normalizeSearchFilter(debouncedInput) ?? "";

  const datePending = useGlobalFiltersPending();
  const searchPending =
    searchInput !== debouncedInput || effectiveDebounced !== search;
  const isDebouncing = datePending || searchPending;
  const isFetching = useFilterDrivenFetching();

  return {
    isLoading: isDebouncing || isFetching,
    isDebouncing,
    isFetching,
  };
}
