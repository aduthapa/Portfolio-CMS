import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { prisma } from "./prisma";
import { sessionOptions, type SessionData } from "./session-options";

export type { SessionData };

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

// cache() dedupes this to one query per request across every Server
// Component/Action that calls it, mirroring loadCurrentUser's per-request
// re-fetch (src/middleware/auth.ts) without a stale in-memory copy.
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.active) return null;
  return user;
});
