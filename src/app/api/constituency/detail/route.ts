import { NextRequest } from "next/server";
import { getConstituencyDetail } from "@/lib/constituency-detail";
import { jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get("name");
    if (!name?.trim()) {
      return jsonError("Constituency name is required", 400);
    }
    const data = getConstituencyDetail(name);
    if (!data) {
      return jsonError(`Constituency not found: ${name}`, 404);
    }
    return Response.json(data);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error");
  }
}
