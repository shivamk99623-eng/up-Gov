import { getConstituencyOptions } from "@/services/constituency";
import { jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(getConstituencyOptions());
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
