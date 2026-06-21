import "server-only";
import {
  queryDigitalMedia,
  queryOnlineRecords,
  queryPrintRecords,
  queryXRecords,
  queryYouTubeRecords,
  type PaginationParams,
} from "@/lib/news-repository";
import type {
  GlobalFilters,
  MediaQueryResponse,
  MediaType,
  OnlineQueryResponse,
  PrintQueryResponse,
  XQueryResponse,
  YouTubeQueryResponse,
} from "@/lib/types";

export function getPrintNews(
  filters: GlobalFilters = {},
  pagination?: PaginationParams,
): PrintQueryResponse {
  const result = queryPrintRecords(filters, { pagination });
  return {
    mediaType: "Print",
    district: filters.district ?? null,
    constituency: filters.constituency ?? null,
    entity: filters.entity ?? null,
    total: result.total,
    records: result.records,
    ...(pagination
      ? { page: result.page, limit: result.limit, totalPages: result.totalPages }
      : {}),
  };
}

export function getYouTubeNews(
  filters: GlobalFilters = {},
  pagination?: PaginationParams,
  options?: { skipDistrict?: boolean },
): YouTubeQueryResponse {
  const result = queryYouTubeRecords(filters, { ...options, pagination });
  return {
    mediaType: "YouTube",
    district: filters.district ?? null,
    constituency: filters.constituency ?? null,
    entity: filters.entity ?? null,
    total: result.total,
    records: result.records,
    ...(pagination
      ? { page: result.page, limit: result.limit, totalPages: result.totalPages }
      : {}),
  };
}

export function getXNews(
  filters: GlobalFilters = {},
  pagination?: PaginationParams,
  options?: { skipDistrict?: boolean },
): XQueryResponse {
  const result = queryXRecords(filters, { ...options, pagination });
  return {
    mediaType: "X",
    district: filters.district ?? null,
    constituency: filters.constituency ?? null,
    entity: filters.entity ?? null,
    total: result.total,
    records: result.records,
    ...(pagination
      ? { page: result.page, limit: result.limit, totalPages: result.totalPages }
      : {}),
  };
}

export function getOnlineNews(
  filters: GlobalFilters = {},
  pagination?: PaginationParams,
  options?: { skipDistrict?: boolean },
): OnlineQueryResponse {
  const result = queryOnlineRecords(filters, { ...options, pagination });
  return {
    mediaType: "Online",
    district: filters.district ?? null,
    constituency: filters.constituency ?? null,
    entity: filters.entity ?? null,
    total: result.total,
    records: result.records,
    ...(pagination
      ? { page: result.page, limit: result.limit, totalPages: result.totalPages }
      : {}),
  };
}

/** Combined digital media query (all types or one type). Used by `/api/media`. */
export function getCombinedDigitalNews(
  filters: GlobalFilters & { mediaType?: MediaType | "All" | null },
  pagination?: PaginationParams,
): MediaQueryResponse {
  const { mediaType, ...rest } = filters;
  if (mediaType === "YouTube") {
    return { ...getYouTubeNews(rest, pagination), mediaType: "YouTube" };
  }
  if (mediaType === "X") {
    return { ...getXNews(rest, pagination), mediaType: "X" };
  }
  if (mediaType === "Online") {
    return { ...getOnlineNews(rest, pagination), mediaType: "Online" };
  }

  const result = queryDigitalMedia(filters, { pagination });
  return {
    district: filters.district ?? null,
    constituency: filters.constituency ?? null,
    mediaType: mediaType ?? "All",
    total: result.total,
    records: result.records,
    ...(pagination
      ? { page: result.page, limit: result.limit, totalPages: result.totalPages }
      : {}),
  };
}
