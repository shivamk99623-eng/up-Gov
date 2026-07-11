import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api-helpers";
import { runDbOp } from "@/lib/db-worker/pool";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get("name");
    if (!name?.trim()) {
      return jsonError("Assembly name is required", 400);
    }
    const data = await runDbOp({ op: "legislativeDetail", name });
    if (!data) {
      return jsonError(`Assembly not found: ${name}`, 404);
    }
    return Response.json(data);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
