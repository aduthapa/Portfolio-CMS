import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadMediaAsset, publicUrlFor } from "../../middleware/upload";
import { invalidateSiteSettingsCache, getSiteSettings } from "../../middleware/locals";
import { requireAdmin } from "../../middleware/auth";
import { sendTestEmail } from "../../config/mailer";
import { logError } from "../../utils/logger";

export const settingsRouter = Router();

settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.siteSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    res.render("admin/settings", { title: "Site settings", settings });
  })
);

settingsRouter.put(
  "/",
  requireAdmin,
  uploadMediaAsset.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const files = req.files as { logo?: Express.Multer.File[]; favicon?: Express.Multer.File[] } | undefined;
    const logoFile = files?.logo?.[0];
    const faviconFile = files?.favicon?.[0];

    await prisma.siteSetting.upsert({
      where: { id: 1 },
      update: {
        siteName: String(body.siteName || "Portfolio CMS").trim(),
        tagline: body.tagline ? String(body.tagline).trim() : null,
        primaryColor: body.primaryColor ? String(body.primaryColor).trim() : "#7c3aed",
        contactEmail: body.contactEmail ? String(body.contactEmail).trim() : null,
        instagramUrl: body.instagramUrl ? String(body.instagramUrl).trim() : null,
        twitterUrl: body.twitterUrl ? String(body.twitterUrl).trim() : null,
        youtubeUrl: body.youtubeUrl ? String(body.youtubeUrl).trim() : null,
        ...(logoFile ? { logoUrl: publicUrlFor("media", logoFile.filename) } : {}),
        ...(faviconFile ? { faviconUrl: publicUrlFor("media", faviconFile.filename) } : {}),
      },
      create: {
        id: 1,
        siteName: String(body.siteName || "Portfolio CMS").trim(),
      },
    });

    invalidateSiteSettingsCache();
    req.flash("success", "Settings updated.");
    res.redirect("/admin/settings");
  })
);

settingsRouter.post(
  "/test-email",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const to = req.currentUser!.email;
    try {
      const settings = await getSiteSettings();
      const result = await sendTestEmail(to, settings.siteName);
      req.flash(
        "success",
        `Request accepted for ${to} — check your inbox (and spam folder). Raw response: ${result}`
      );
    } catch (err) {
      logError("settings: send test email", err);
      const detail = err instanceof Error ? err.message : String(err);
      req.flash("error", `Test email failed: ${detail}`);
    }
    res.redirect("/admin/settings");
  })
);
