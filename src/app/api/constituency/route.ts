import { NextRequest } from "next/server";
import { getConstituencyAnalytics } from "@/services/constituency";
import { parseFilters, jsonError, warmDataCaches } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await warmDataCaches();
    const constituency =
      req.nextUrl.searchParams.get("constituency") ?? "All";
    const filters = parseFilters(req.nextUrl.searchParams);
    const data = getConstituencyAnalytics(constituency, filters);
    return Response.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
