import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";

// Populates req.currentUser from the session on every request so views
// and downstream middleware can rely on it without re-querying.
export const loadCurrentUser = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (req.session.userId) {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    if (user && user.active) {
      req.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      };
    } else {
      req.session.userId = undefined;
    }
  }
  next();
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/admin/login");
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return res.redirect("/admin/login");
  }
  if (req.currentUser.role !== "ADMIN") {
    req.flash?.("error", "That area is restricted to administrators.");
    return res.redirect("/admin");
  }
  next();
}

export function redirectIfAuthed(req: Request, res: Response, next: NextFunction) {
  if (req.currentUser) {
    return res.redirect("/admin");
  }
  next();
}
