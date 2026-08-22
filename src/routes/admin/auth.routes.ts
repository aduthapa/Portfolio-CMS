import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { redirectIfAuthed } from "../../middleware/auth";

export const authRouter = Router();

authRouter.get("/login", redirectIfAuthed, (_req, res) => {
  res.render("admin/login", { title: "Sign in" });
});

authRouter.post(
  "/login",
  redirectIfAuthed,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = email
      ? await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } })
      : null;

    const valid = user && user.active ? await bcrypt.compare(String(password || ""), user.passwordHash) : false;

    if (!user || !valid) {
      req.flash("error", "Incorrect email or password.");
      return res.redirect("/admin/login");
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;

    const returnTo = req.session.returnTo;
    req.session.returnTo = undefined;
    res.redirect(returnTo || "/admin");
  })
);

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});
