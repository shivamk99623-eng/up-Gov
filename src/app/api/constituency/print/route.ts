import { NextRequest } from "next/server";
import { parseFilters, parsePagination, jsonError } from "@/lib/api-helpers";
import { applyConstituencyScope } from "@/lib/news-repository";
import { runDbOp } from "@/lib/db-worker/pool";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const constituency = req.nextUrl.searchParams.get("constituency");
    const filters = applyConstituencyScope(
      parseFilters(req.nextUrl.searchParams),
    );
    const pagination = parsePagination(req.nextUrl.searchParams);
    const data = await runDbOp({
      op: "constituencyPrint",
      constituency,
      filters,
      pagination,
    });
    return Response.json(data);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
