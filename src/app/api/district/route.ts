import { NextRequest } from "next/server";
import { parseFilters, jsonError } from "@/lib/api-helpers";
import { runDbOp } from "@/lib/db-worker/pool";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const district = req.nextUrl.searchParams.get("district");
    if (!district)
      return jsonError("Missing required query param: district", 400);
    const filters = parseFilters(req.nextUrl.searchParams);
    const data = await runDbOp({ op: "district", district, filters });
    return Response.json(data);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
