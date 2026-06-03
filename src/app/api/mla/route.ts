import { NextRequest } from "next/server";
import { MLAS } from "@/data/mlas";

export const dynamic = "force-static";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const mla = MLAS.find((m) => m.id === id);
    if (!mla) return Response.json({ error: "MLA not found" }, { status: 404 });
    return Response.json(mla);
  }
  return Response.json({ total: MLAS.length, mlas: MLAS });
}
