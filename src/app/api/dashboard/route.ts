import { NextRequest } from "next/server";
import { parseFilters, jsonError } from "@/lib/api-helpers";
import { assembleDashboard } from "@/lib/dashboard-assemble";
import { runDbOp } from "@/lib/db-worker/pool";
import type {
  getDashboardRollups,
  getDashboardStats,
} from "@/services/analytics";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  try {
    const filters = parseFilters(req.nextUrl.searchParams);

    // Two SQLite workers in parallel — cuts wall time vs one serial dashboard op.
    const [stats, rollups] = await Promise.all([
      runDbOp<ReturnType<typeof getDashboardStats>>({
        op: "dashboardStats",
        filters,
      }),
      runDbOp<ReturnType<typeof getDashboardRollups>>({
        op: "dashboardRollups",
        filters,
      }),
    ]);

    return Response.json(assembleDashboard(stats, rollups));
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
