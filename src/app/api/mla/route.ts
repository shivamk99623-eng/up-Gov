import { NextRequest } from "next/server";
import { jsonError, parseFilters } from "@/lib/api-helpers";
import { runDbOp } from "@/lib/db-worker/pool";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const filters = parseFilters(req.nextUrl.searchParams);
      const mla = await runDbOp({ op: "mlaById", id, filters });
      if (!mla)
        return Response.json({ error: "MLA not found" }, { status: 404 });
      return Response.json(mla);
    }
    return Response.json(await runDbOp({ op: "mlaList" }));
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
