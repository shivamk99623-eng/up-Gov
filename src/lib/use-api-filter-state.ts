"use client";

import * as React from "react";
import { DEBOUNCE } from "@/lib/debounce-throttle";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useFilterStore, type FilterState } from "@/store/filters";

export type ApiFilterValues = Pick<
  FilterState,
  | "dateFrom"
  | "dateTo"
  | "district"
  | "mediaType"
  | "sentiment"
  | "language"
  | "search"
>;

/** Filter store values debounced before they drive API refetches. */
export function useApiFilterState(): ApiFilterValues {
  const district = useFilterStore((s) => s.district);
  const mediaType = useFilterStore((s) => s.mediaType);
  const sentiment = useFilterStore((s) => s.sentiment);
  const language = useFilterStore((s) => s.language);
  const rawSearch = useFilterStore((s) => s.search);
  const rawDateFrom = useFilterStore((s) => s.dateFrom);
  const rawDateTo = useFilterStore((s) => s.dateTo);

  const debouncedSearch = useDebouncedValue(rawSearch, DEBOUNCE.SEARCH_MS);
  const debouncedDateFrom = useDebouncedValue(rawDateFrom, DEBOUNCE.DATE_MS);
  const debouncedDateTo = useDebouncedValue(rawDateTo, DEBOUNCE.DATE_MS);

  return React.useMemo(
    () => ({
      district,
      mediaType,
      sentiment,
      language,
      search: debouncedSearch,
      dateFrom: debouncedDateFrom,
      dateTo: debouncedDateTo,
    }),
    [
      district,
      mediaType,
      sentiment,
      language,
      debouncedSearch,
      debouncedDateFrom,
      debouncedDateTo,
    ],
  );
}

/** True when global search/date filters are waiting to settle. */
export function useGlobalFiltersPending(): boolean {
  const rawSearch = useFilterStore((s) => s.search);
  const rawDateFrom = useFilterStore((s) => s.dateFrom);
  const rawDateTo = useFilterStore((s) => s.dateTo);
  const debouncedSearch = useDebouncedValue(rawSearch, DEBOUNCE.SEARCH_MS);
  const debouncedDateFrom = useDebouncedValue(rawDateFrom, DEBOUNCE.DATE_MS);
  const debouncedDateTo = useDebouncedValue(rawDateTo, DEBOUNCE.DATE_MS);

  return (
    rawSearch !== debouncedSearch ||
    rawDateFrom !== debouncedDateFrom ||
    rawDateTo !== debouncedDateTo
  );
}
