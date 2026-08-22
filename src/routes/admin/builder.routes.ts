import { Router } from "express";
import { Prisma, BlockType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadMediaAsset, publicUrlFor } from "../../middleware/upload";

export const builderRouter = Router();

const uploadFields = uploadMediaAsset.fields([
  { name: "image", maxCount: 1 },
  { name: "galleryImages", maxCount: 20 },
]);

type UploadedFiles = { image?: Express.Multer.File[]; galleryImages?: Express.Multer.File[] };

function toArray(value: unknown): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function buildContent(type: BlockType, body: Record<string, unknown>, files: UploadedFiles): Prisma.JsonObject {
  switch (type) {
    case "HEADING":
      return {
        text: String(body.text || "").slice(0, 200),
        level: ["h1", "h2", "h3"].includes(String(body.level)) ? String(body.level) : "h2",
      };
    case "TEXT":
      return { text: String(body.text || "").slice(0, 5000) };
    case "IMAGE": {
      const file = files.image?.[0];
      return {
        url: file ? publicUrlFor("media", file.filename) : String(body.existingUrl || ""),
        caption: body.caption ? String(body.caption).slice(0, 200) : "",
      };
    }
    case "GALLERY": {
      const existing: { url: string; caption: string }[] = (() => {
        try {
          return JSON.parse(String(body.existingImages || "[]"));
        } catch {
          return [];
        }
      })();
      const removeSet = new Set(toArray(body.removeUrls));
      const kept = existing.filter((img) => !removeSet.has(img.url));
      const newFiles = files.galleryImages || [];
      const uploaded = newFiles.map((f) => ({ url: publicUrlFor("media", f.filename), caption: "" }));
      return { images: [...kept, ...uploaded] };
    }
    case "BUTTON":
      return {
        label: String(body.label || "Learn more").slice(0, 60),
        url: String(body.url || "#").slice(0, 500),
        style: body.style === "secondary" ? "secondary" : "primary",
      };
    case "VIDEO":
      return { url: String(body.url || "").slice(0, 500) };
    case "DIVIDER":
    default:
      return {};
  }
}

builderRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const blocks = await prisma.pageBlock.findMany({ orderBy: { sortOrder: "asc" } });
    res.render("admin/builder", { title: "Page builder", blocks });
  })
);

builderRouter.post(
  "/",
  uploadFields,
  asyncHandler(async (req, res) => {
    const type = req.body.type as BlockType;
    if (!Object.values(BlockType).includes(type)) {
      req.flash("error", "Unknown block type.");
      return res.redirect("/admin/builder");
    }

    const files = (req.files as UploadedFiles) || {};
    const content = buildContent(type, req.body, files);

    const maxOrder = await prisma.pageBlock.aggregate({ _max: { sortOrder: true } });
    await prisma.pageBlock.create({
      data: { type, content, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
    });

    req.flash("success", "Block added.");
    res.redirect("/admin/builder");
  })
);

builderRouter.put(
  "/:id",
  uploadFields,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const block = await prisma.pageBlock.findUnique({ where: { id } });
    if (!block) {
      req.flash("error", "Block not found.");
      return res.redirect("/admin/builder");
    }

    const files = (req.files as UploadedFiles) || {};
    const content = buildContent(block.type, req.body, files);
    await prisma.pageBlock.update({ where: { id }, data: { content } });

    req.flash("success", "Block updated.");
    res.redirect("/admin/builder");
  })
);

builderRouter.put(
  "/:id/visibility",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const block = await prisma.pageBlock.findUnique({ where: { id } });
    if (block) {
      await prisma.pageBlock.update({ where: { id }, data: { visible: !block.visible } });
    }
    res.redirect("/admin/builder");
  })
);

builderRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.pageBlock.deleteMany({ where: { id: Number(req.params.id) } });
    req.flash("success", "Block removed.");
    res.redirect("/admin/builder");
  })
);

// Drag-and-drop reorder: receives an ordered array of block IDs as JSON.
builderRouter.post(
  "/reorder",
  asyncHandler(async (req, res) => {
    const order: number[] = Array.isArray(req.body.order) ? req.body.order.map(Number) : [];
    await prisma.$transaction(
      order.map((id, index) => prisma.pageBlock.updateMany({ where: { id }, data: { sortOrder: index } }))
    );
    res.json({ ok: true });
  })
);
