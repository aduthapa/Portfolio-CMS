import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { slugify, uniqueSlug } from "../../utils/slugify";
import { CATEGORY_OPTIONS } from "../../utils/categories";
import { uploadProfileImage, publicUrlFor } from "../../middleware/upload";
import { ProfileCategory, ProfileStatus } from "@prisma/client";
import { parsePage, buildPageList } from "../../utils/pagination";

export const profilesRouter = Router();

const uploadFields = uploadProfileImage.fields([
  { name: "avatar", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);

function parseTagNames(raw: unknown): string[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function toArray(value: unknown): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function parseSocialLinks(body: Record<string, unknown>): { platform: string; url: string }[] {
  const platforms = toArray(body.socialPlatform);
  const urls = toArray(body.socialUrl);
  const links: { platform: string; url: string }[] = [];
  for (let i = 0; i < Math.max(platforms.length, urls.length); i++) {
    const platform = (platforms[i] || "").trim();
    const url = (urls[i] || "").trim();
    if (platform && url) links.push({ platform, url });
  }
  return links;
}

async function connectTags(tagNames: string[]) {
  const results = [];
  for (const name of tagNames) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    results.push(tag.id);
  }
  return results;
}

profilesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, perPage, skip, take } = parsePage(req.query.page, 15);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";

    const where = {
      ...(q ? { OR: [{ fullName: { contains: q } }, { stageName: { contains: q } }] } : {}),
      ...(status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status) ? { status: status as ProfileStatus } : {}),
    };

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
        include: { _count: { select: { portfolioItems: true, inquiries: true } } },
      }),
      prisma.profile.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    res.render("admin/profiles/index", {
      title: "Profiles",
      profiles,
      q,
      status,
      page,
      totalPages,
      pageList: buildPageList(page, totalPages),
      total,
    });
  })
);

profilesRouter.get("/new", (_req, res) => {
  res.render("admin/profiles/form", {
    title: "New profile",
    profile: null,
    categoryOptions: CATEGORY_OPTIONS,
    tagNames: "",
    socialLinks: [{ platform: "", url: "" }],
  });
});

profilesRouter.post(
  "/",
  uploadFields,
  asyncHandler(async (req, res) => {
    const body = req.body;
    const files = req.files as { avatar?: Express.Multer.File[]; cover?: Express.Multer.File[] } | undefined;

    if (!body.fullName || !String(body.fullName).trim()) {
      req.flash("error", "Full name is required.");
      return res.redirect("/admin/profiles/new");
    }

    const slugBase = body.slug && String(body.slug).trim() ? String(body.slug) : String(body.fullName);
    const slug = await uniqueSlug(slugBase, async (s) => Boolean(await prisma.profile.findUnique({ where: { slug: s } })));

    const avatarFile = files?.avatar?.[0];
    const coverFile = files?.cover?.[0];

    const profile = await prisma.profile.create({
      data: {
        slug,
        fullName: String(body.fullName).trim(),
        stageName: body.stageName ? String(body.stageName).trim() : null,
        category: (body.category as ProfileCategory) || "OTHER",
        status: (body.status as ProfileStatus) || "DRAFT",
        featured: body.featured === "on",
        shortBio: body.shortBio ? String(body.shortBio).slice(0, 280) : null,
        bio: String(body.bio || ""),
        location: body.location ? String(body.location).trim() : null,
        website: body.website ? String(body.website).trim() : null,
        metaTitle: body.metaTitle ? String(body.metaTitle).trim() : null,
        metaDescription: body.metaDescription ? String(body.metaDescription).slice(0, 320) : null,
        avatarUrl: avatarFile ? publicUrlFor("profiles", avatarFile.filename) : null,
        coverImageUrl: coverFile ? publicUrlFor("profiles", coverFile.filename) : null,
        managerId: req.currentUser!.id,
        socialLinks: { create: parseSocialLinks(body) },
      },
    });

    const tagIds = await connectTags(parseTagNames(body.tags));
    if (tagIds.length) {
      await prisma.profileTag.createMany({
        data: tagIds.map((tagId) => ({ profileId: profile.id, tagId })),
      });
    }

    req.flash("success", `Profile "${profile.fullName}" created.`);
    res.redirect(`/admin/profiles/${profile.id}/edit`);
  })
);

profilesRouter.get(
  "/:id/edit",
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.findUnique({
      where: { id: Number(req.params.id) },
      include: { socialLinks: true, tags: { include: { tag: true } } },
    });
    if (!profile) {
      req.flash("error", "Profile not found.");
      return res.redirect("/admin/profiles");
    }

    res.render("admin/profiles/form", {
      title: `Edit ${profile.fullName}`,
      profile,
      categoryOptions: CATEGORY_OPTIONS,
      tagNames: profile.tags.map((t) => t.tag.name).join(", "),
      socialLinks: profile.socialLinks.length ? profile.socialLinks : [{ platform: "", url: "" }],
    });
  })
);

profilesRouter.put(
  "/:id",
  uploadFields,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) {
      req.flash("error", "Profile not found.");
      return res.redirect("/admin/profiles");
    }

    const body = req.body;
    const files = req.files as { avatar?: Express.Multer.File[]; cover?: Express.Multer.File[] } | undefined;
    const avatarFile = files?.avatar?.[0];
    const coverFile = files?.cover?.[0];

    let slug = existing.slug;
    if (body.slug && slugify(String(body.slug)) !== existing.slug) {
      slug = await uniqueSlug(String(body.slug), async (s) =>
        Boolean(await prisma.profile.findFirst({ where: { slug: s, NOT: { id } } }))
      );
    }

    await prisma.profile.update({
      where: { id },
      data: {
        slug,
        fullName: String(body.fullName || existing.fullName).trim(),
        stageName: body.stageName ? String(body.stageName).trim() : null,
        category: (body.category as ProfileCategory) || existing.category,
        status: (body.status as ProfileStatus) || existing.status,
        featured: body.featured === "on",
        shortBio: body.shortBio ? String(body.shortBio).slice(0, 280) : null,
        bio: String(body.bio ?? existing.bio),
        location: body.location ? String(body.location).trim() : null,
        website: body.website ? String(body.website).trim() : null,
        metaTitle: body.metaTitle ? String(body.metaTitle).trim() : null,
        metaDescription: body.metaDescription ? String(body.metaDescription).slice(0, 320) : null,
        ...(avatarFile ? { avatarUrl: publicUrlFor("profiles", avatarFile.filename) } : {}),
        ...(coverFile ? { coverImageUrl: publicUrlFor("profiles", coverFile.filename) } : {}),
      },
    });

    await prisma.socialLink.deleteMany({ where: { profileId: id } });
    const links = parseSocialLinks(body);
    if (links.length) {
      await prisma.socialLink.createMany({ data: links.map((l) => ({ ...l, profileId: id })) });
    }

    await prisma.profileTag.deleteMany({ where: { profileId: id } });
    const tagIds = await connectTags(parseTagNames(body.tags));
    if (tagIds.length) {
      await prisma.profileTag.createMany({ data: tagIds.map((tagId) => ({ profileId: id, tagId })) });
    }

    req.flash("success", "Profile updated.");
    res.redirect(`/admin/profiles/${id}/edit`);
  })
);

profilesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const profile = await prisma.profile.findUnique({ where: { id } });
    if (profile) {
      await prisma.profile.delete({ where: { id } });
      req.flash("success", `Profile "${profile.fullName}" deleted.`);
    }
    res.redirect("/admin/profiles");
  })
);
