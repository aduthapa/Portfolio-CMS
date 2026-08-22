export function parsePage(value: unknown, perPage = 12) {
  const page = Math.max(1, parseInt(String(value ?? "1"), 10) || 1);
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

export function buildPageList(current: number, totalPages: number): number[] {
  const pages = new Set<number>();
  for (let p = Math.max(1, current - 2); p <= Math.min(totalPages, current + 2); p++) {
    pages.add(p);
  }
  pages.add(1);
  pages.add(totalPages);
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
}
