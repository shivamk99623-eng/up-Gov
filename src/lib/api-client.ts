import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type {
  ConstituencyAnalyticsResponse,
  ConstituencyDetailResponse,
  ConstituencyPrintResponse,
  ConstituencyScope,
  DashboardResponse,
  PrintQueryResponse,
  DistrictAnalyticsResponse,
  MediaQueryResponse,
  MediaType,
  MLA,
  MLAListItem,
  MP,
  MPListItem,
  OnlineQueryResponse,
  XQueryResponse,
  YouTubeQueryResponse,
  House,
} from "./types";
import {
  appendMediaTableQuery,
  createMediaTableQuery,
  type MediaTableQuery,
} from "@/lib/media-table-query";
import { useApiFilterState, type ApiFilterValues } from "@/lib/use-api-filter-state";
import { buildFilterQuery, type FilterState } from "@/store/filters";

export type { MediaTableQuery };
export { createMediaTableQuery };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** @deprecated Use MediaTableQuery */
export interface ListPagination {
  page: number;
  pageSize: number;
}

function mergeTableFilters(
  state: ApiFilterValues,
  tableQuery?: MediaTableQuery,
): ApiFilterValues {
  if (!tableQuery) return state;
  return {
    ...state,
    search: tableQuery.search || state.search,
    sentiment:
      tableQuery.sentiment !== "All" ? tableQuery.sentiment : state.sentiment,
    language: tableQuery.language || state.language,
  };
}

function buildMediaParams(
  state: ApiFilterValues,
  tableQuery?: MediaTableQuery,
  extra?: Record<string, string | null | undefined>,
): URLSearchParams {
  const constituencyScoped =
    extra?.district === null ||
    !!(extra?.constituency && extra.constituency !== "All");
  const merged = mergeTableFilters(state, tableQuery);
  const scoped = constituencyScoped ? { ...merged, district: null } : merged;
  const params = new URLSearchParams(buildFilterQuery(scoped));
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (key === "district" && value == null) continue;
    if (value) params.set(key, value);
  }
  if (tableQuery) appendMediaTableQuery(params, tableQuery);
  return params;
}

function mediaEndpoint(mediaType: MediaType): string {
  switch (mediaType) {
    case "YouTube":
      return "/api/youtube";
    case "X":
      return "/api/x";
    case "Online":
      return "/api/online";
  }
}

function useGlobalFilterQuery(extra?: Partial<FilterState>) {
  const state = useApiFilterState();
  return buildFilterQuery({ ...state, ...extra });
}

export function useDashboard() {
  const qs = useGlobalFilterQuery();
  return useQuery({
    queryKey: ["dashboard", qs],
    queryFn: () => fetchJson<DashboardResponse>(`/api/dashboard?${qs}`),
  });
}

export function useDistrictAnalytics(district: string | null) {
  const qs = useGlobalFilterQuery({ district });
  return useQuery({
    queryKey: ["district", district, qs],
    queryFn: () =>
      fetchJson<DistrictAnalyticsResponse>(
        `/api/district?${qs}`,
      ),
    enabled: !!district,
  });
}

export function usePrint(
  scope?: {
    district?: string | null;
    constituency?: string | null;
    entity?: string | null;
    printSource?: "district" | "mla" | "mp" | null;
  },
  tableQuery?: MediaTableQuery,
) {
  const state = useApiFilterState();
  const params = buildMediaParams(state, tableQuery, {
    district: scope?.district ?? state.district,
    constituency: scope?.constituency ?? null,
    entity: scope?.entity ?? null,
    printSource: scope?.printSource ?? null,
  });
  const qs = params.toString();
  return useQuery({
    queryKey: [
      "print",
      scope?.district,
      scope?.constituency,
      scope?.entity,
      scope?.printSource,
      tableQuery,
      qs,
    ],
    queryFn: () => fetchJson<PrintQueryResponse>(`/api/print?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useScopedMedia(
  scope: {
    district?: string | null;
    entity?: string | null;
    constituency?: string | null;
    constituencyScope?: ConstituencyScope;
  },
  mediaType: MediaType | "All",
  tableQuery?: MediaTableQuery,
) {
  const state = useApiFilterState();
  const {
    district = null,
    entity = null,
    constituency = null,
    constituencyScope = "parliamentary",
  } = scope;
  const onConstituencyPage = "constituency" in scope;
  const params = buildMediaParams(state, tableQuery, {
    district: entity || onConstituencyPage ? null : district,
    entity,
    constituency: constituency && constituency !== "All" ? constituency : null,
    constituencyScope,
  });
  const endpoint =
    mediaType === "All" ? "/api/media" : mediaEndpoint(mediaType);
  const qs = params.toString();
  const url = `${endpoint}${qs ? `?${qs}` : ""}`;
  return useQuery({
    queryKey: [
      "scoped-media",
      district,
      entity,
      constituency,
      constituencyScope,
      mediaType,
      tableQuery,
      url,
    ],
    queryFn: () =>
      fetchJson<
        MediaQueryResponse | YouTubeQueryResponse | XQueryResponse | OnlineQueryResponse
      >(url),
    enabled: !!(entity || district || constituency !== undefined),
    placeholderData: keepPreviousData,
  });
}

export function useConstituencyAnalytics(
  constituency: string,
  constituencyScope: ConstituencyScope = "parliamentary",
) {
  const qs = useGlobalFilterQuery();
  const scopeQs = qs
    ? `${qs}&constituencyScope=${constituencyScope}`
    : `constituencyScope=${constituencyScope}`;
  return useQuery({
    queryKey: ["constituency", constituency, constituencyScope, qs],
    queryFn: () =>
      fetchJson<ConstituencyAnalyticsResponse>(
        `/api/constituency?constituency=${encodeURIComponent(constituency)}&${scopeQs}`,
      ),
  });
}

export function useConstituencyPrint(
  constituency: string | null,
  tableQuery?: MediaTableQuery,
  constituencyScope: ConstituencyScope = "parliamentary",
) {
  const state = useApiFilterState();
  const params = buildMediaParams(state, tableQuery, {
    constituency: constituency && constituency !== "All" ? constituency : null,
    district: null,
    constituencyScope,
  });
  const qs = params.toString();
  return useQuery({
    queryKey: ["constituency-print", constituency ?? "All", constituencyScope, tableQuery, qs],
    queryFn: () =>
      fetchJson<ConstituencyPrintResponse>(`/api/constituency/print?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useConstituencyOptions(
  constituencyScope: ConstituencyScope = "parliamentary",
) {
  return useQuery({
    queryKey: ["constituency-options", constituencyScope],
    queryFn: () =>
      fetchJson<{ constituencies: string[] }>(
        `/api/constituency/filters?constituencyScope=${constituencyScope}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useConstituencyDetail(name: string | null) {
  return useQuery({
    queryKey: ["constituency-detail", name],
    queryFn: () =>
      fetchJson<ConstituencyDetailResponse>(
        `/api/constituency/detail?name=${encodeURIComponent(name!)}`,
      ),
    enabled: !!name && name !== "All",
    staleTime: 10 * 60 * 1000,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ["filter-options"],
    queryFn: () =>
      fetchJson<{ districts: string[]; languages: string[] }>(`/api/filters`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMLAs() {
  return useQuery({
    queryKey: ["mlas"],
    queryFn: () => fetchJson<{ total: number; mlas: MLAListItem[] }>(`/api/mla`),
    staleTime: 10 * 60 * 1000,
  });
}

export function useMLA(id: string | null) {
  return useQuery({
    queryKey: ["mla", id],
    queryFn: () => fetchJson<MLA>(`/api/mla?id=${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useMPs() {
  return useQuery({
    queryKey: ["mps"],
    queryFn: () => fetchJson<{ total: number; mps: MPListItem[] }>(`/api/mp`),
    staleTime: 10 * 60 * 1000,
  });
}

export function useMP(id: string | null, house?: House | null) {
  const params = new URLSearchParams();
  if (id) params.set("id", id);
  if (house) params.set("house", house);
  const qs = params.toString();
  return useQuery({
    queryKey: ["mp", id, house ?? null],
    queryFn: () => fetchJson<MP>(`/api/mp?${qs}`),
    enabled: !!id,
  });
}
