import { NextRequest } from "next/server";
import { getMPDirectory } from "@/services/representatives";
import { jsonError, warmDataCaches } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await warmDataCaches();
    const all = getMPDirectory();
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const mp = all.find((m) => m.id === id);
      if (!mp) return Response.json({ error: "MP not found" }, { status: 404 });
      return Response.json(mp);
    }
    const house = req.nextUrl.searchParams.get("house");
    const mps =
      house && house !== "All"
        ? all.filter((m) => m.house === house)
        : all;
    return Response.json(
      { total: mps.length, mps },
      {
        headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
      },
    );
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
