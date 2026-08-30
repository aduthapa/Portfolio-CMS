import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";

export const getPages = cache(async () => {
  return prisma.page.findMany({
    orderBy: [{ isHome: "desc" }, { title: "asc" }],
    include: { _count: { select: { blocks: true } } },
  });
});

export const getPageBySlug = cache(async (slug: string) => {
  return prisma.page.findUnique({ where: { slug } });
});

export const getPageById = cache(async (id: number) => {
  return prisma.page.findUnique({ where: { id } });
});

export const getHomePage = cache(async () => {
  const home = await prisma.page.findFirst({ where: { isHome: true } });
  if (home) return home;
  // Should always exist after the add_pages_and_menu migration backfill,
  // but fall back to creating it rather than 500ing the whole site if a
  // fresh database was ever migrated without the data-migration step.
  return prisma.page.create({ data: { slug: "home", title: "Home", isHome: true } });
});
