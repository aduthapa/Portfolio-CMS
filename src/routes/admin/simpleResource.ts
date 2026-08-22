import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";

export type FieldType = "text" | "textarea" | "number" | "date" | "url";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
}

export interface SimpleResourceConfig {
  slug: string; // route segment, e.g. "press"
  resourceLabel: string; // "Press mention"
  resourcePluralLabel: string; // "Press mentions"
  viewTitleField: string; // field used as the row heading in the list, e.g. "title"
  viewSubField?: string; // secondary field shown under the heading
  fields: FieldConfig[];
  orderBy: Record<string, "asc" | "desc">;
  // Narrow interface covering the subset of a Prisma model delegate this factory needs.
  model: {
    findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
    findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    deleteMany: (args: unknown) => Promise<unknown>;
  };
}

function coerce(field: FieldConfig, raw: unknown) {
  const value = raw === undefined || raw === null ? "" : String(raw).trim();
  if (value === "") {
    return field.required ? undefined : null;
  }
  switch (field.type) {
    case "number":
      return Number.isNaN(Number(value)) ? null : Number(value);
    case "date":
      return new Date(value);
    default:
      return field.type === "textarea" ? value : value.slice(0, 500);
  }
}

// Press mentions, awards, events, and testimonials are all simple
// "belongs to one profile, flat field list" resources with identical
// list/create/edit/delete flows — one factory drives all four instead of
// four near-duplicate route files.
export function createSimpleResourceRouter(config: SimpleResourceConfig): Router {
  const router = Router({ mergeParams: true });

  async function requireProfile(profileId: number) {
    return prisma.profile.findUnique({ where: { id: profileId } });
  }

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const profileId = Number(req.params.profileId);
      const profile = await requireProfile(profileId);
      if (!profile) {
        req.flash("error", "Profile not found.");
        return res.redirect("/admin/profiles");
      }
      const items = await config.model.findMany({ where: { profileId }, orderBy: config.orderBy });
      res.render("admin/simple-resource/index", {
        title: `${config.resourcePluralLabel} — ${profile.fullName}`,
        config,
        profile,
        items,
        basePath: `/admin/profiles/${profileId}/${config.slug}`,
      });
    })
  );

  router.get(
    "/new",
    asyncHandler(async (req, res) => {
      const profileId = Number(req.params.profileId);
      const profile = await requireProfile(profileId);
      if (!profile) {
        req.flash("error", "Profile not found.");
        return res.redirect("/admin/profiles");
      }
      res.render("admin/simple-resource/form", {
        title: `New ${config.resourceLabel.toLowerCase()}`,
        config,
        profile,
        item: null,
        basePath: `/admin/profiles/${profileId}/${config.slug}`,
      });
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const profileId = Number(req.params.profileId);
      const profile = await requireProfile(profileId);
      if (!profile) {
        req.flash("error", "Profile not found.");
        return res.redirect("/admin/profiles");
      }

      const data: Record<string, unknown> = { profileId };
      for (const field of config.fields) {
        const value = coerce(field, req.body[field.name]);
        if (value === undefined) {
          req.flash("error", `${field.label} is required.`);
          return res.redirect(`/admin/profiles/${profileId}/${config.slug}/new`);
        }
        data[field.name] = value;
      }

      await config.model.create({ data });
      req.flash("success", `${config.resourceLabel} added.`);
      res.redirect(`/admin/profiles/${profileId}/${config.slug}`);
    })
  );

  router.get(
    "/:itemId/edit",
    asyncHandler(async (req, res) => {
      const profileId = Number(req.params.profileId);
      const profile = await requireProfile(profileId);
      if (!profile) {
        req.flash("error", "Profile not found.");
        return res.redirect("/admin/profiles");
      }
      const item = await config.model.findFirst({ where: { id: Number(req.params.itemId), profileId } });
      if (!item) {
        req.flash("error", `${config.resourceLabel} not found.`);
        return res.redirect(`/admin/profiles/${profileId}/${config.slug}`);
      }
      res.render("admin/simple-resource/form", {
        title: `Edit ${config.resourceLabel.toLowerCase()}`,
        config,
        profile,
        item,
        basePath: `/admin/profiles/${profileId}/${config.slug}`,
      });
    })
  );

  router.put(
    "/:itemId",
    asyncHandler(async (req, res) => {
      const profileId = Number(req.params.profileId);
      const itemId = Number(req.params.itemId);
      const existing = await config.model.findFirst({ where: { id: itemId, profileId } });
      if (!existing) {
        req.flash("error", `${config.resourceLabel} not found.`);
        return res.redirect(`/admin/profiles/${profileId}/${config.slug}`);
      }

      const data: Record<string, unknown> = {};
      for (const field of config.fields) {
        const value = coerce(field, req.body[field.name]);
        if (value === undefined) {
          req.flash("error", `${field.label} is required.`);
          return res.redirect(`/admin/profiles/${profileId}/${config.slug}/${itemId}/edit`);
        }
        data[field.name] = value;
      }

      await config.model.update({ where: { id: itemId }, data });
      req.flash("success", `${config.resourceLabel} updated.`);
      res.redirect(`/admin/profiles/${profileId}/${config.slug}`);
    })
  );

  router.delete(
    "/:itemId",
    asyncHandler(async (req, res) => {
      const profileId = Number(req.params.profileId);
      await config.model.deleteMany({ where: { id: Number(req.params.itemId), profileId } });
      req.flash("success", `${config.resourceLabel} deleted.`);
      res.redirect(`/admin/profiles/${profileId}/${config.slug}`);
    })
  );

  return router;
}
