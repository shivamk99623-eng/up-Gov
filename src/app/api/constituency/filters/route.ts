import { getConstituencyOptions } from "@/services/constituency";
import { jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(getConstituencyOptions(), {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
