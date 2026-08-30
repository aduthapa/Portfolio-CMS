import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";

export interface ResolvedMenuItem {
  id: number;
  label: string;
  href: string;
}

// A menu item points at either an internal Page (kept in sync if that
// page's slug changes) or a raw URL (for fixed routes like /contact that
// aren't block-based pages, or external links).
export const getMenuItems = cache(async (): Promise<ResolvedMenuItem[]> => {
  const items = await prisma.menuItem.findMany({
    orderBy: { sortOrder: "asc" },
    include: { page: true },
  });

  return items.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.page ? (item.page.isHome ? "/" : `/${item.page.slug}`) : item.url || "#",
  }));
});

// Raw rows (with page relation) for the admin editor, which needs the
// actual pageId/url to prefill its form rather than a resolved href.
export const getAllMenuItemsRaw = cache(async () => {
  return prisma.menuItem.findMany({
    orderBy: { sortOrder: "asc" },
    include: { page: true },
  });
});
