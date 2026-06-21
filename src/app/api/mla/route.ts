import { NextRequest } from "next/server";
import { getMLAById, getMLAList } from "@/services/representatives";
import { jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const mla = getMLAById(id);
      if (!mla)
        return Response.json({ error: "MLA not found" }, { status: 404 });
      return Response.json(mla);
    }
    const mlas = getMLAList();
    return Response.json({ total: mlas.length, mlas });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
