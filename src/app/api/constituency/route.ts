import { NextRequest } from "next/server";
import { parseFilters, jsonError } from "@/lib/api-helpers";
import { applyConstituencyScope } from "@/lib/news-repository";
import { runDbOp } from "@/lib/db-worker/pool";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const constituency =
      req.nextUrl.searchParams.get("constituency") ?? "All";
    const filters = applyConstituencyScope(
      parseFilters(req.nextUrl.searchParams),
    );
    const data = await runDbOp({
      op: "constituencyAnalytics",
      constituency,
      filters,
    });
    return Response.json(data);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
