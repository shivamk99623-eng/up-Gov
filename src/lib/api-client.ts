import { useQuery } from "@tanstack/react-query";
import type {
  DashboardResponse,
  DistrictAnalyticsResponse,
  MediaQueryResponse,
  MediaType,
  MLA,
} from "./types";
import { buildFilterQuery, useFilterStore, type FilterState } from "@/store/filters";

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

function useGlobalFilterQuery(extra?: Partial<FilterState>) {
  const state = useFilterStore();
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

export function useMedia(district: string | null, mediaType: MediaType | "All") {
  const qs = useGlobalFilterQuery({
    district,
    mediaType: undefined as never,
  });
  const params = new URLSearchParams(qs);
  if (mediaType && mediaType !== "All") params.set("mediaType", mediaType);
  const finalQs = params.toString();
  return useQuery({
    queryKey: ["media", district, mediaType, finalQs],
    queryFn: () => fetchJson<MediaQueryResponse>(`/api/media?${finalQs}`),
    enabled: !!district,
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
    queryFn: () => fetchJson<{ total: number; mlas: MLA[] }>(`/api/mla`),
    staleTime: 10 * 60 * 1000,
  });
}
