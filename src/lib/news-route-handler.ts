import { NextRequest } from "next/server";
import { parseFilters, parsePagination, jsonError } from "@/lib/api-helpers";
import { applyConstituencyScope } from "@/lib/news-repository";

type NewsHandler = (
  filters: ReturnType<typeof parseFilters>,
  pagination: ReturnType<typeof parsePagination>,
) => unknown;

export function createNewsRoute(handler: NewsHandler) {
  return async function GET(req: NextRequest) {
    try {
      const filters = applyConstituencyScope(parseFilters(req.nextUrl.searchParams));
      const pagination = parsePagination(req.nextUrl.searchParams);
      return Response.json(handler(filters, pagination));
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "Unknown error");
    }
  };
}
