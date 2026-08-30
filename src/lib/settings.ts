import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";

// React's cache() dedupes this to one query per request render pass.
// Cross-request caching/invalidation (matching src/middleware/locals.ts's
// 30s TTL today) is a Phase 2 concern once the admin Settings page moves
// over and can call revalidateTag on save.
export const getSiteSettings = cache(async () => {
  return prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
});
