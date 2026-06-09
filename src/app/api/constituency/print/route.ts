import { NextRequest } from "next/server";
import { getConstituencyPrint } from "@/services/constituency";
import { jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const constituency = req.nextUrl.searchParams.get("constituency");
    const data = getConstituencyPrint(constituency);
    return Response.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
