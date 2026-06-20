import { getFilterOptions } from "@/services/analytics";
import { jsonError, warmDataCaches } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await warmDataCaches();
    return Response.json(getFilterOptions(), {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
