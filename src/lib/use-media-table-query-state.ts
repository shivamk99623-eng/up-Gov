"use client";

import * as React from "react";
import { DEBOUNCE, THROTTLE } from "@/lib/debounce-throttle";
import {
  useDebouncedValue,
  useIsDebouncing,
  useThrottledCallback,
} from "@/lib/use-debounced-value";
import {
  createMediaTableQuery,
  type MediaTableQuery,
} from "@/lib/media-table-query";

type SortState = { id: string; dir: "asc" | "desc" } | null;

export type MediaTableQueryState = ReturnType<typeof useMediaTableQueryState>;

/** Clamp page when result count shrinks (e.g. after changing scope). */
export function useClampServerPage(
  total: number | undefined,
  pageSize: number,
  page: number,
  onPageChange: (page: number) => void,
) {
  React.useEffect(() => {
    if (total === undefined) return;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) onPageChange(maxPage);
  }, [total, pageSize, page, onPageChange]);
}

export function useMediaTableQueryState(initialPageSize = 50) {
  const [tableQuery, setTableQuery] = React.useState(() =>
    createMediaTableQuery({ pageSize: initialPageSize }),
  );
  const debouncedSearch = useDebouncedValue(
    tableQuery.search,
    DEBOUNCE.SEARCH_MS,
  );
  const isSearchPending = useIsDebouncing(tableQuery.search, debouncedSearch);

  const apiQuery = React.useMemo(
    (): MediaTableQuery => ({
      ...tableQuery,
      search: debouncedSearch,
    }),
    [tableQuery, debouncedSearch],
  );

  const patchQuery = React.useCallback((patch: Partial<MediaTableQuery>) => {
    setTableQuery((prev) => ({
      ...prev,
      ...patch,
      page:
        patch.page ??
        (patch.search !== undefined ||
        patch.sortBy !== undefined ||
        patch.sortDir !== undefined ||
        patch.sentiment !== undefined ||
        patch.language !== undefined ||
        patch.pageSize !== undefined
          ? 1
          : prev.page),
    }));
  }, []);

  const throttledPageChange = useThrottledCallback(
    (page: number) => patchQuery({ page }),
    THROTTLE.ACTION_MS,
  );

  const throttledPageSizeChange = useThrottledCallback(
    (pageSize: number) => patchQuery({ pageSize, page: 1 }),
    THROTTLE.ACTION_MS,
  );

  const sortValue: SortState =
    tableQuery.sortBy && tableQuery.sortDir
      ? { id: tableQuery.sortBy, dir: tableQuery.sortDir }
      : null;

  const tableControls = {
    serverMode: true as const,
    searchValue: tableQuery.search,
    onSearchChange: (search: string) => patchQuery({ search }),
    sortValue,
    onSortChange: (sort: SortState) =>
      patchQuery({
        sortBy: sort?.id ?? null,
        sortDir: sort?.dir ?? null,
      }),
    sentiment: tableQuery.sentiment,
    onSentimentChange: (sentiment: MediaTableQuery["sentiment"]) =>
      patchQuery({ sentiment }),
    language: tableQuery.language,
    onLanguageChange: (language: string | null) => patchQuery({ language }),
    isSearchPending,
    serverPagination: {
      total: 0,
      page: tableQuery.page,
      pageSize: tableQuery.pageSize,
      onPageChange: throttledPageChange,
      onPageSizeChange: throttledPageSizeChange,
    },
  };

  return { tableQuery, apiQuery, patchQuery, tableControls, isSearchPending };
}

export function bindServerPagination<T extends { total: number; page?: number; limit?: number }>(
  data: T | undefined,
  tableQuery: MediaTableQuery,
  tableControls: Pick<
    ReturnType<typeof useMediaTableQueryState>["tableControls"],
    "serverPagination"
  >,
) {
  return {
    total: data?.total ?? 0,
    page: data?.page ?? tableQuery.page,
    pageSize: data?.limit ?? tableQuery.pageSize,
    onPageChange: tableControls.serverPagination.onPageChange,
    onPageSizeChange: tableControls.serverPagination.onPageSizeChange,
  };
}
