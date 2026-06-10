import { NextRequest } from "next/server";
import { getMedia } from "@/services/analytics";
import { parseFilters, jsonError, warmDataCaches } from "@/lib/api-helpers";
import type { MediaType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await warmDataCaches();
    const filters = parseFilters(req.nextUrl.searchParams);
    const mediaType =
      (req.nextUrl.searchParams.get("mediaType") as MediaType | null) ?? null;
    const data = getMedia({ ...filters, mediaType });
    return Response.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
