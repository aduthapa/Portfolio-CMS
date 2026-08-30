"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";

export interface FormState {
  error?: string;
}

// `target` is either "page:<id>" (an internal Page) or "url:<value>" (a
// raw URL/external link) — one input driving one of two DB columns.
function parseTarget(target: string): { pageId: number | null; url: string | null } {
  if (target.startsWith("page:")) {
    return { pageId: Number(target.slice(5)), url: null };
  }
  return { pageId: null, url: target.startsWith("url:") ? target.slice(4) : target };
}

export async function createMenuItem(_prevState: FormState, formData: FormData): Promise<FormState> {
  const label = String(formData.get("label") || "").trim();
  const target = String(formData.get("target") || "").trim();
  if (!label) return { error: "Label is required." };
  if (!target) return { error: "Choose a page or enter a URL." };

  const { pageId, url } = parseTarget(target);
  if (!pageId && !url) return { error: "Enter a URL." };

  const maxOrder = await prisma.menuItem.aggregate({ _max: { sortOrder: true } });
  await prisma.menuItem.create({
    data: { label: label.slice(0, 60), pageId, url: url?.slice(0, 500), sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath("/admin/menu");
  revalidateEverywhere();
  return {};
}

export async function deleteMenuItem(id: number) {
  await prisma.menuItem.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/menu");
  revalidateEverywhere();
}

export async function reorderMenuItems(orderedIds: number[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.menuItem.updateMany({ where: { id }, data: { sortOrder: index } }))
  );
  revalidateEverywhere();
}

// The menu renders in the header on every public page, so any change
// needs every currently-cached public route invalidated, not just one.
function revalidateEverywhere() {
  revalidatePath("/", "layout");
}
