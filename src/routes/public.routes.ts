import { Router } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from "../utils/categories";
import { parsePage, buildPageList } from "../utils/pagination";
import { getVideoEmbedUrl } from "../utils/video";
import { ProfileCategory } from "@prisma/client";

export const publicRouter = Router();

publicRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const blockRows = await prisma.pageBlock.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
    });

    const blocks = blockRows.map((b) => {
      if (b.type === "VIDEO") {
        const content = b.content as { url?: string };
        return { ...b, embedUrl: content.url ? getVideoEmbedUrl(content.url) : null };
      }
      return b;
    });

    res.render("public/home", { title: undefined, blocks });
  })
);

publicRouter.get(
  "/profiles",
  asyncHandler(async (req, res) => {
    const { page, perPage, skip, take } = parsePage(req.query.page, 12);
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const where = {
      status: "PUBLISHED" as const,
      ...(category && category in CATEGORY_LABELS ? { category: category as ProfileCategory } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { stageName: { contains: q } },
              { shortBio: { contains: q } },
            ],
          }
        : {}),
    };

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({ where, orderBy: { featured: "desc" }, skip, take }),
      prisma.profile.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    res.render("public/profiles", {
      title: "Talent",
      profiles,
      categoryOptions: CATEGORY_OPTIONS,
      selectedCategory: category,
      q,
      page,
      totalPages,
      pageList: buildPageList(page, totalPages),
      total,
    });
  })
);

publicRouter.get(
  "/profiles/:slug",
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.findFirst({
      where: { slug: req.params.slug, status: "PUBLISHED" },
      include: {
        socialLinks: true,
        tags: { include: { tag: true } },
        portfolioItems: { orderBy: { sortOrder: "asc" } },
        pressMentions: { orderBy: { publishedAt: "desc" } },
        awards: { orderBy: { year: "desc" } },
        events: { orderBy: { startDate: "asc" } },
        testimonials: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!profile) {
      res.status(404).render("public/404", { title: "Profile not found" });
      return;
    }

    prisma.profile.update({ where: { id: profile.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    res.render("public/profile-detail", {
      title: profile.metaTitle || profile.stageName || profile.fullName,
      description: profile.metaDescription || profile.shortBio || undefined,
      profile,
      categoryLabel: CATEGORY_LABELS[profile.category],
    });
  })
);

publicRouter.post(
  "/profiles/:slug/inquiries",
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.findFirst({
      where: { slug: req.params.slug, status: "PUBLISHED" },
    });
    if (!profile) {
      res.status(404).render("public/404", { title: "Profile not found" });
      return;
    }

    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      req.flash("error", "Please fill in your name, email, and message.");
      return res.redirect(`/profiles/${profile.slug}#booking`);
    }

    await prisma.inquiry.create({
      data: {
        profileId: profile.id,
        name: String(name).slice(0, 190),
        email: String(email).slice(0, 190),
        phone: phone ? String(phone).slice(0, 60) : null,
        subject: subject ? String(subject).slice(0, 190) : null,
        message: String(message).slice(0, 4000),
      },
    });

    req.flash("success", "Thanks! Your inquiry has been sent — we'll be in touch soon.");
    res.redirect(`/profiles/${profile.slug}#booking`);
  })
);

publicRouter.get("/contact", (_req, res) => {
  res.render("public/contact", { title: "Contact" });
});

publicRouter.post(
  "/contact",
  asyncHandler(async (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      req.flash("error", "Please fill in your name, email, and message.");
      return res.redirect("/contact");
    }

    await prisma.inquiry.create({
      data: {
        name: String(name).slice(0, 190),
        email: String(email).slice(0, 190),
        phone: phone ? String(phone).slice(0, 60) : null,
        subject: subject ? String(subject).slice(0, 190) : null,
        message: String(message).slice(0, 4000),
      },
    });

    req.flash("success", "Thanks for reaching out — we'll respond shortly.");
    res.redirect("/contact");
  })
);
