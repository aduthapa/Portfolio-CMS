import { PrismaClient } from "@prisma/client";

// Separate singleton from src/config/prisma.ts (which the still-live
// Express app uses) so importing it doesn't pull in that module's eager,
// all-fields-required env validation (src/config/env.ts) — every field
// there gets checked the moment anything imports `env`, even ones this
// app doesn't use, which breaks Next's build-time page-data collection
// (it imports every route module regardless of static/dynamic). Prisma
// already reads DATABASE_URL directly from process.env via
// prisma/schema.prisma's datasource block, so nothing here needs it
// explicitly.
declare global {
  // eslint-disable-next-line no-var
  var __nextPrisma: PrismaClient | undefined;
}

export const prisma = global.__nextPrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__nextPrisma = prisma;
}
