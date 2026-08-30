import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "./src/lib/session-options";

// Edge-runtime gate: cheap "is there a validly-sealed session cookie"
// check on every /admin/** request. Prisma isn't Edge-compatible, so the
// authoritative active/role check (getCurrentUser in src/lib/session.ts)
// still runs Node-side per request/action — this only stops anonymous
// requests from reaching an admin page at all.
export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/admin/login";
  if (!pathname.startsWith("/admin") || isLoginRoute) {
    return response;
  }

  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
