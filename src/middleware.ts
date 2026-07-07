import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * This app uses API routes only (no "use server" actions).
 * POSTs with Next-Action are stale browser bundles or bot probes after Docker redeploys.
 */
export function middleware(request: NextRequest) {
  if (request.method === "POST" && request.headers.has("next-action")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
