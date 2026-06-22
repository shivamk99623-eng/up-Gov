import { NextRequest } from "next/server";
import { getConstituencyAnalytics } from "@/services/constituency";
import { parseFilters, jsonError } from "@/lib/api-helpers";
import { applyConstituencyScope } from "@/lib/news-repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const constituency =
      req.nextUrl.searchParams.get("constituency") ?? "All";
    const filters = applyConstituencyScope(parseFilters(req.nextUrl.searchParams));
    const data = getConstituencyAnalytics(constituency, filters);
    return Response.json(data);
    return Response.json({});
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
