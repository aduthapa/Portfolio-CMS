"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { slugify, uniqueSlug } from "../../utils/slugify";
import type { BlockType } from "@prisma/client";

export interface FormState {
  error?: string;
}

// Slugs that would collide with (or be confused with) a real top-level
// route — /[slug] only catches what nothing else matches, so these would
// technically still work, but blocking them avoids a page that's
// unreachable in spirit even if reachable in practice.
const RESERVED_SLUGS = new Set(["admin", "contact", "api", "login", "profiles", "blog"]);

export async function createPage(_prevState: FormState, formData: FormData): Promise<FormState> {
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Title is required." };

  const base = slugify(title);
  if (RESERVED_SLUGS.has(base)) {
    return { error: `"${title}" conflicts with a reserved page name — try something more specific.` };
  }

  const slug = await uniqueSlug(title, async (candidate) => {
    if (RESERVED_SLUGS.has(candidate)) return true;
    const existing = await prisma.page.findUnique({ where: { slug: candidate } });
    return !!existing;
  });

  const page = await prisma.page.create({ data: { title, slug } });
  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${page.id}`);
}

export async function updatePageTitle(pageId: number, formData: FormData): Promise<FormState> {
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Title is required." };

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) return { error: "Page not found." };

  await prisma.page.update({ where: { id: pageId }, data: { title } });
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${pageId}`);
  if (page.isHome) revalidatePath("/");
  else revalidatePath(`/${page.slug}`);
  return {};
}

export async function deletePage(pageId: number) {
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.isHome) return; // the Home page can't be deleted — it's always the "/" route
  await prisma.page.delete({ where: { id: pageId } });
  revalidatePath("/admin/pages");
  revalidatePath("/admin/menu");
  redirect("/admin/pages");
}

function buildBlockContent(type: BlockType, formData: FormData) {
  switch (type) {
    case "HEADING":
      return {
        text: String(formData.get("text") || "").slice(0, 200),
        level: ["h1", "h2", "h3"].includes(String(formData.get("level"))) ? String(formData.get("level")) : "h2",
      };
    case "TEXT":
      return { text: String(formData.get("text") || "").slice(0, 5000) };
    case "IMAGE":
      return {
        url: String(formData.get("url") || "").slice(0, 500),
        caption: String(formData.get("caption") || "").slice(0, 200),
      };
    case "GALLERY":
      return {
        images: String(formData.get("urls") || "")
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean)
          .slice(0, 30)
          .map((url) => ({ url, caption: "" })),
      };
    case "BUTTON":
      return {
        label: String(formData.get("label") || "Learn more").slice(0, 60),
        url: String(formData.get("url") || "#").slice(0, 500),
        style: formData.get("style") === "secondary" ? "secondary" : "primary",
      };
    case "VIDEO":
      return { url: String(formData.get("url") || "").slice(0, 500) };
    case "DIVIDER":
    default:
      return {};
  }
}

export async function addBlock(pageId: number, type: BlockType, formData: FormData) {
  const content = buildBlockContent(type, formData);
  const maxOrder = await prisma.pageBlock.aggregate({ where: { pageId }, _max: { sortOrder: true } });
  await prisma.pageBlock.create({
    data: { pageId, type, content, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath(`/admin/pages/${pageId}`);
  await revalidatePublicPage(pageId);
}

export async function updateBlock(blockId: number, formData: FormData) {
  const block = await prisma.pageBlock.findUnique({ where: { id: blockId } });
  if (!block) return;
  const content = buildBlockContent(block.type, formData);
  await prisma.pageBlock.update({ where: { id: blockId }, data: { content } });
  revalidatePath(`/admin/pages/${block.pageId}`);
  await revalidatePublicPage(block.pageId);
}

export async function deleteBlock(blockId: number) {
  const block = await prisma.pageBlock.delete({ where: { id: blockId } }).catch(() => null);
  if (!block) return;
  revalidatePath(`/admin/pages/${block.pageId}`);
  await revalidatePublicPage(block.pageId);
}

export async function toggleBlockVisibility(blockId: number) {
  const block = await prisma.pageBlock.findUnique({ where: { id: blockId } });
  if (!block) return;
  await prisma.pageBlock.update({ where: { id: blockId }, data: { visible: !block.visible } });
  revalidatePath(`/admin/pages/${block.pageId}`);
  await revalidatePublicPage(block.pageId);
}

// Called directly from the drag-and-drop client component on drop —
// Server Actions can be invoked outside a <form> too, not just as a
// submit handler.
export async function reorderBlocks(pageId: number, orderedBlockIds: number[]) {
  await prisma.$transaction(
    orderedBlockIds.map((id, index) =>
      prisma.pageBlock.updateMany({ where: { id, pageId }, data: { sortOrder: index } })
    )
  );
  await revalidatePublicPage(pageId);
}

async function revalidatePublicPage(pageId: number) {
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) return;
  revalidatePath(page.isHome ? "/" : `/${page.slug}`);
}
