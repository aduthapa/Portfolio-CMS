import type { SessionOptions } from "iron-session";

// Deliberately has zero Node-only imports (no Prisma, no `dotenv/config`'s
// `fs` read) — this file is imported by middleware.ts, which runs on
// Next.js's Edge runtime. The DB-backed parts of auth (src/lib/session.ts's
// getCurrentUser) are Node-only and never imported from here.
export interface SessionData {
  userId?: number;
}

// Same cookie name/attributes as the Express app's express-session config
// (src/app.ts) so no README/env changes are needed during the migration.
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me",
  cookieName: "portfolio_cms_sid",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  },
};
