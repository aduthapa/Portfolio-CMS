import { Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadMediaAsset, publicUrlFor } from "../../middleware/upload";
import { parsePage, buildPageList } from "../../utils/pagination";

export const mediaRouter = Router();

mediaRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, perPage, skip, take } = parsePage(req.query.page, 24);
    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
      prisma.mediaAsset.count(),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    res.render("admin/media/index", {
      title: "Media library",
      assets,
      page,
      totalPages,
      pageList: buildPageList(page, totalPages),
      total,
    });
  })
);

mediaRouter.post(
  "/",
  uploadMediaAsset.array("files", 10),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      req.flash("error", "Please choose at least one file to upload.");
      return res.redirect("/admin/media");
    }

    await prisma.mediaAsset.createMany({
      data: files.map((file) => ({
        fileName: file.originalname,
        url: publicUrlFor("media", file.filename),
        mimeType: file.mimetype,
        size: file.size,
        mediaType: file.mimetype.startsWith("video") ? "VIDEO" : "IMAGE",
        uploadedById: req.currentUser!.id,
      })),
    });

    req.flash("success", `Uploaded ${files.length} file(s).`);
    res.redirect("/admin/media");
  })
);

mediaRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: Number(req.params.id) } });
    if (asset) {
      const filePath = path.join(process.cwd(), "public", asset.url);
      fs.unlink(filePath, () => {});
      await prisma.mediaAsset.delete({ where: { id: asset.id } });
      req.flash("success", "File deleted.");
    }
    res.redirect("/admin/media");
  })
);
