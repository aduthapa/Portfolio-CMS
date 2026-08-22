import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";

let cachedSettings: Awaited<ReturnType<typeof prisma.siteSetting.findUnique>> | null = null;
let cachedAt = 0;
const CACHE_MS = 30_000;

export async function getSiteSettings() {
  const now = Date.now();
  if (!cachedSettings || now - cachedAt > CACHE_MS) {
    cachedSettings = await prisma.siteSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    cachedAt = now;
  }
  return cachedSettings;
}

export function invalidateSiteSettingsCache() {
  cachedSettings = null;
}

// Makes the logged-in user, flash messages, and site settings available
// to every EJS view without each route having to fetch/pass them.
export const injectLocals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.locals.currentUser = req.currentUser || null;
  res.locals.settings = await getSiteSettings();
  res.locals.currentPath = req.path;
  res.locals.flashSuccess = req.flash ? req.flash("success") : [];
  res.locals.flashError = req.flash ? req.flash("error") : [];
  next();
});
