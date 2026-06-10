import { NextRequest } from "next/server";
import { getMLADirectory } from "@/services/representatives";
import { jsonError, warmDataCaches } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await warmDataCaches();
    const mlas = getMLADirectory();
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const mla = mlas.find((m) => m.id === id);
      if (!mla)
        return Response.json({ error: "MLA not found" }, { status: 404 });
      return Response.json(mla);
    }
    return Response.json(
      { total: mlas.length, mlas },
      {
        headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
      },
    );
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
