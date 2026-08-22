import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAdmin } from "../../middleware/auth";
import { Role } from "@prisma/client";

export const usersRouter = Router();

usersRouter.use(requireAdmin);

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    res.render("admin/users/index", { title: "Team", users });
  })
);

usersRouter.get("/new", (_req, res) => {
  res.render("admin/users/form", { title: "New team member", user: null });
});

usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || String(password).length < 8) {
      req.flash("error", "Name, email, and a password of at least 8 characters are required.");
      return res.redirect("/admin/users/new");
    }

    const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (existing) {
      req.flash("error", "A user with that email already exists.");
      return res.redirect("/admin/users/new");
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        passwordHash,
        role: role === "ADMIN" ? Role.ADMIN : Role.EDITOR,
      },
    });

    req.flash("success", "Team member added.");
    res.redirect("/admin/users");
  })
);

usersRouter.get(
  "/:id/edit",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }
    res.render("admin/users/form", { title: `Edit ${user.name}`, user });
  })
);

usersRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, email, password, role, active } = req.body;

    const data: Record<string, unknown> = {
      name: String(name || "").trim(),
      email: String(email || "").toLowerCase().trim(),
      role: role === "ADMIN" ? Role.ADMIN : Role.EDITOR,
      active: active === "on",
    };

    if (password && String(password).length >= 8) {
      data.passwordHash = await bcrypt.hash(String(password), 12);
    }

    await prisma.user.update({ where: { id }, data });
    req.flash("success", "User updated.");
    res.redirect("/admin/users");
  })
);

usersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (req.currentUser?.id === id) {
      req.flash("error", "You can't delete your own account.");
      return res.redirect("/admin/users");
    }
    await prisma.user.delete({ where: { id } });
    req.flash("success", "User removed.");
    res.redirect("/admin/users");
  })
);
