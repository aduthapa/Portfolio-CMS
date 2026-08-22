import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadPortfolioMedia, publicUrlFor } from "../../middleware/upload";
import { MediaType } from "@prisma/client";

// Mounted at /admin/profiles/:profileId/portfolio
export const portfolioRouter = Router({ mergeParams: true });

async function loadProfile(profileId: number) {
  return prisma.profile.findUnique({ where: { id: profileId } });
}

portfolioRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const profileId = Number(req.params.profileId);
    const profile = await loadProfile(profileId);
    if (!profile) {
      req.flash("error", "Profile not found.");
      return res.redirect("/admin/profiles");
    }
    const items = await prisma.portfolioItem.findMany({ where: { profileId }, orderBy: { sortOrder: "asc" } });
    res.render("admin/portfolio/index", { title: `Portfolio — ${profile.fullName}`, profile, items });
  })
);

portfolioRouter.post(
  "/",
  uploadPortfolioMedia.single("media"),
  asyncHandler(async (req, res) => {
    const profileId = Number(req.params.profileId);
    const profile = await loadProfile(profileId);
    if (!profile) {
      req.flash("error", "Profile not found.");
      return res.redirect("/admin/profiles");
    }

    if (!req.file) {
      req.flash("error", "Please choose an image or video to upload.");
      return res.redirect(`/admin/profiles/${profileId}/portfolio`);
    }

    const body = req.body;
    const maxOrder = await prisma.portfolioItem.aggregate({
      where: { profileId },
      _max: { sortOrder: true },
    });

    await prisma.portfolioItem.create({
      data: {
        profileId,
        title: String(body.title || req.file.originalname).slice(0, 190),
        description: body.description ? String(body.description) : null,
        category: body.category ? String(body.category).trim() : null,
        featured: body.featured === "on",
        mediaType: req.file.mimetype.startsWith("video") ? MediaType.VIDEO : MediaType.IMAGE,
        mediaUrl: publicUrlFor("portfolio", req.file.filename),
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    req.flash("success", "Portfolio item added.");
    res.redirect(`/admin/profiles/${profileId}/portfolio`);
  })
);

portfolioRouter.put(
  "/:itemId",
  uploadPortfolioMedia.single("media"),
  asyncHandler(async (req, res) => {
    const profileId = Number(req.params.profileId);
    const itemId = Number(req.params.itemId);
    const item = await prisma.portfolioItem.findFirst({ where: { id: itemId, profileId } });
    if (!item) {
      req.flash("error", "Portfolio item not found.");
      return res.redirect(`/admin/profiles/${profileId}/portfolio`);
    }

    const body = req.body;
    await prisma.portfolioItem.update({
      where: { id: itemId },
      data: {
        title: String(body.title || item.title).slice(0, 190),
        description: body.description ? String(body.description) : null,
        category: body.category ? String(body.category).trim() : null,
        featured: body.featured === "on",
        ...(req.file
          ? {
              mediaType: req.file.mimetype.startsWith("video") ? MediaType.VIDEO : MediaType.IMAGE,
              mediaUrl: publicUrlFor("portfolio", req.file.filename),
            }
          : {}),
      },
    });

    req.flash("success", "Portfolio item updated.");
    res.redirect(`/admin/profiles/${profileId}/portfolio`);
  })
);

portfolioRouter.delete(
  "/:itemId",
  asyncHandler(async (req, res) => {
    const profileId = Number(req.params.profileId);
    const itemId = Number(req.params.itemId);
    await prisma.portfolioItem.deleteMany({ where: { id: itemId, profileId } });
    req.flash("success", "Portfolio item deleted.");
    res.redirect(`/admin/profiles/${profileId}/portfolio`);
  })
);

// Drag-and-drop reorder: receives an ordered array of item IDs as JSON.
portfolioRouter.post(
  "/reorder",
  asyncHandler(async (req, res) => {
    const profileId = Number(req.params.profileId);
    const order: number[] = Array.isArray(req.body.order) ? req.body.order.map(Number) : [];

    await prisma.$transaction(
      order.map((itemId, index) =>
        prisma.portfolioItem.updateMany({
          where: { id: itemId, profileId },
          data: { sortOrder: index },
        })
      )
    );

    res.json({ ok: true });
  })
);
