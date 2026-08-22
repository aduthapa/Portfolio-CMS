import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// A single shared Prisma instance avoids exhausting MySQL connections
// under Passenger's process model, and survives tsx's dev-mode reloads.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient();

if (!env.isProduction) {
  global.__prisma = prisma;
}
