import { NextRequest } from "next/server";
import { getMPById, getMPList } from "@/services/representatives";
import { jsonError } from "@/lib/api-helpers";
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

    if (id) {
      const mp = getMPById(id, house);
      if (!mp) return Response.json({ error: "MP not found" }, { status: 404 });
      return Response.json(mp);
    }

    const all = getMPList();
    const mps = house ? all.filter((m) => m.house === house) : all;
    return Response.json({ total: mps.length, mps });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
