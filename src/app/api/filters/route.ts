import { getFilterOptions } from "@/services/analytics";
import { jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(getFilterOptions());
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
