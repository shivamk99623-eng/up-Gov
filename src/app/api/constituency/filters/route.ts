import { jsonError } from "@/lib/api-helpers";
import { runDbOp } from "@/lib/db-worker/pool";
import type { ConstituencyScope } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = (
      url.searchParams.get("constituencyScope") === "legislative"
        ? "legislative"
        : "parliamentary"
    ) as ConstituencyScope;
    return Response.json(
      await runDbOp({ op: "constituencyOptions", scope }),
    );
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
