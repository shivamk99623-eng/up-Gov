import { NextRequest } from "next/server";
import { getDistrictAnalytics } from "@/services/analytics";
import { parseFilters, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const district = req.nextUrl.searchParams.get("district");
    if (!district) return jsonError("Missing required query param: district", 400);
    const filters = parseFilters(req.nextUrl.searchParams);
    const data = getDistrictAnalytics(district, filters);
    return Response.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
