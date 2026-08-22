import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const [profileCount, publishedCount, portfolioCount, newInquiries, totalInquiries, topProfiles, recentInquiries] =
      await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({ where: { status: "PUBLISHED" } }),
        prisma.portfolioItem.count(),
        prisma.inquiry.count({ where: { status: "NEW" } }),
        prisma.inquiry.count(),
        prisma.profile.findMany({ orderBy: { viewCount: "desc" }, take: 5 }),
        prisma.inquiry.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          include: { profile: { select: { fullName: true, stageName: true, slug: true } } },
        }),
      ]);

    res.render("admin/dashboard", {
      title: "Dashboard",
      stats: { profileCount, publishedCount, portfolioCount, newInquiries, totalInquiries },
      topProfiles,
      recentInquiries,
    });
  })
);
