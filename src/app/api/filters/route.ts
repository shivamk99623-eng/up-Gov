import { jsonError } from "@/lib/api-helpers";
import { runDbOp } from "@/lib/db-worker/pool";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await runDbOp({ op: "filterOptions" }));
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
