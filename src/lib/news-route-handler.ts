import { NextRequest } from "next/server";
import { parseFilters, parsePagination, jsonError } from "@/lib/api-helpers";
import { applyConstituencyScope } from "@/lib/news-repository";
import { runDbOp } from "@/lib/db-worker/pool";
import type { DbWorkerOp } from "@/lib/db-worker/types";

type NewsOpBuilder = (
  filters: ReturnType<typeof parseFilters>,
  pagination: ReturnType<typeof parsePagination>,
) => DbWorkerOp;

/** News list routes — parse on main thread, execute SQLite work in a worker. */
export function createNewsRoute(buildOp: NewsOpBuilder) {
  return async function GET(req: NextRequest) {
    try {
      const filters = applyConstituencyScope(
        parseFilters(req.nextUrl.searchParams),
      );
      const pagination = parsePagination(req.nextUrl.searchParams);
      const data = await runDbOp(buildOp(filters, pagination));
      return Response.json(data);
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "Unknown error");
    }
  };
}
