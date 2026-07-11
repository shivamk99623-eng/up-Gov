import { NextRequest } from "next/server";
import { jsonError, parseFilters } from "@/lib/api-helpers";
import { runDbOp } from "@/lib/db-worker/pool";
import type { House } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const houseParam = req.nextUrl.searchParams.get("house");
    const house =
      houseParam === "Lok Sabha" || houseParam === "Rajya Sabha"
        ? (houseParam as House)
        : undefined;
    const filters = parseFilters(req.nextUrl.searchParams);

    if (id) {
      const mp = await runDbOp({
        op: "mpById",
        id,
        house,
        filters,
      });
      if (!mp) return Response.json({ error: "MP not found" }, { status: 404 });
      return Response.json(mp);
    }

    return Response.json(await runDbOp({ op: "mpList", house }));
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
