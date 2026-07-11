"use client";

import { useFilterStore } from "@/store/filters";
import { DEBOUNCE } from "./debounce-throttle";
import { normalizeSearchFilter } from "./search-filter";
import { useDebouncedValue } from "./use-debounced-value";
import {
  GLOBAL_FILTER_QUERY_ROOTS,
  useGlobalFiltersLoading,
} from "./use-global-filters-loading";
import { useIsFetching } from "@tanstack/react-query";

/** Tracks global header search: debounce pending + API refetch in flight. */
export function useGlobalSearchStatus() {
  const searchInput = useFilterStore((s) => s.searchInput);
  const search = useFilterStore((s) => s.search);
  const debouncedInput = useDebouncedValue(searchInput, DEBOUNCE.SEARCH_MS);
  const effectiveDebounced = normalizeSearchFilter(debouncedInput) ?? "";

  const isDebouncing =
    searchInput !== debouncedInput || effectiveDebounced !== search;

  const fetchingCount = useIsFetching({
    predicate: (query) =>
      typeof query.queryKey[0] === "string" &&
      GLOBAL_FILTER_QUERY_ROOTS.has(query.queryKey[0]),
  });
  const isFetching = fetchingCount > 0;

  const isActive = !!search.trim();
  const isWorking = !!searchInput.trim() && (isDebouncing || isFetching);

  return {
    searchInput,
    search,
    isDebouncing,
    isFetching,
    isActive,
    isWorking,
  };
}

export { useGlobalFiltersLoading };
