import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { redirectIfAuthed } from "../../middleware/auth";
import { getSiteSettings } from "../../middleware/locals";
import { sendPasswordResetOtpEmail } from "../../config/mailer";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "../../utils/otp";
import { logError, logInfo } from "../../utils/logger";

export const authRouter = Router();

const OTP_TTL_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

// Generic response for the "forgot password" step, used whether or not the
// email actually matches an account, so the form can't be used to enumerate
// registered users.
const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, we've sent a password reset code. It expires in 10 minutes.";

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

authRouter.get("/signup", redirectIfAuthed, (_req, res) => {
  res.render("admin/signup", { title: "Create account" });
});

authRouter.post(
  "/signup",
  redirectIfAuthed,
  asyncHandler(async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      req.flash("error", "Please fill in your name, email, and password.");
      return res.redirect("/admin/signup");
    }
    if (String(password).length < 8) {
      req.flash("error", "Password must be at least 8 characters.");
      return res.redirect("/admin/signup");
    }
    if (password !== confirmPassword) {
      req.flash("error", "Passwords don't match.");
      return res.redirect("/admin/signup");
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      req.flash("error", "An account with that email already exists.");
      return res.redirect("/admin/signup");
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    // New self-service accounts start as inactive Editors — an existing
    // Admin must approve them from Team before they can sign in. Without
    // this gate, anyone who finds this page could grant themselves access
    // to client data.
    await prisma.user.create({
      data: { name: String(name).trim(), email: normalizedEmail, passwordHash, role: "EDITOR", active: false },
    });

    req.flash(
      "success",
      "Account created. An administrator needs to approve your account before you can sign in."
    );
    res.redirect("/admin/login");
  })
);

authRouter.get("/forgot-password", redirectIfAuthed, (req, res) => {
  res.render("admin/forgot-password", { title: "Forgot password", email: req.query.email || "" });
});

authRouter.post(
  "/forgot-password",
  redirectIfAuthed,
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) {
      req.flash("error", "Please enter your email address.");
      return res.redirect("/admin/forgot-password");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.active) {
      const recentOtp = await prisma.passwordResetOtp.findFirst({
        where: { userId: user.id, createdAt: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000) } },
        orderBy: { createdAt: "desc" },
      });

      if (!recentOtp) {
        const code = generateOtpCode();
        const codeHash = await hashOtpCode(code);
        await prisma.passwordResetOtp.create({
          data: {
            userId: user.id,
            codeHash,
            expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
          },
        });

        try {
          const settings = await getSiteSettings();
          await sendPasswordResetOtpEmail(user.email, code, settings.siteName);
          logInfo("forgot-password", `Reset email sent to ${user.email}`);
        } catch (err) {
          logError(`forgot-password: sending reset email to ${user.email}`, err);
        }
      }
    }

    // Always the same response, regardless of whether the email matched an
    // account, was inactive, or mail sending failed server-side.
    req.flash("success", GENERIC_RESET_MESSAGE);
    res.redirect(`/admin/reset-password?email=${encodeURIComponent(email)}`);
  })
);

authRouter.get("/reset-password", redirectIfAuthed, (req, res) => {
  res.render("admin/reset-password", { title: "Reset password", email: req.query.email || "" });
});

authRouter.post(
  "/reset-password",
  redirectIfAuthed,
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "").toLowerCase().trim();
    const code = String(req.body.code || "").trim();
    const { password, confirmPassword } = req.body;

    const redirectBack = () => res.redirect(`/admin/reset-password?email=${encodeURIComponent(email)}`);

    if (!email || !code || !password) {
      req.flash("error", "Please fill in the code and your new password.");
      return redirectBack();
    }
    if (String(password).length < 8) {
      req.flash("error", "Password must be at least 8 characters.");
      return redirectBack();
    }
    if (password !== confirmPassword) {
      req.flash("error", "Passwords don't match.");
      return redirectBack();
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const otp = user
      ? await prisma.passwordResetOtp.findFirst({
          where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (!user || !otp) {
      req.flash("error", "That code is invalid or has expired. Please request a new one.");
      return res.redirect("/admin/forgot-password");
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      await prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
      req.flash("error", "Too many incorrect attempts. Please request a new code.");
      return res.redirect("/admin/forgot-password");
    }

    const codeMatches = await verifyOtpCode(code, otp.codeHash);
    if (!codeMatches) {
      await prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      req.flash("error", "Incorrect code. Please try again.");
      return redirectBack();
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    ]);

    req.flash("success", "Your password has been updated. Please sign in.");
    res.redirect("/admin/login");
  })
);

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});
