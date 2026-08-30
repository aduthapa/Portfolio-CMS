"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { getSession } from "../session";
import { getSiteSettings } from "../settings";
import { sendPasswordResetOtpEmail } from "../mailer";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "../../utils/otp";

export interface LoginState {
  error?: string;
}

// Mirrors src/routes/admin/auth.routes.ts's POST /login exactly: lowercase
// + trim the email, only bcrypt-compare when the user exists and is
// active, and a single generic error either way so the form can't be used
// to enumerate registered emails.
export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const valid = user && user.active ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    return { error: "Incorrect email or password." };
  }

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  redirect("/admin");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}

const OTP_TTL_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, we've sent a password reset code. It expires in 10 minutes.";

export async function signupAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!name || !email || !password) return { error: "Please fill in your name, email, and password." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 12);
  // New self-service accounts start as inactive Editors — an existing
  // Admin must approve them from Team before they can sign in.
  await prisma.user.create({ data: { name, email, passwordHash, role: "EDITOR", active: false } });

  redirect("/admin/login?notice=signup-pending");
}

export async function forgotPasswordAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  if (!email) return { error: "Please enter your email address." };

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
        data: { userId: user.id, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000) },
      });

      try {
        const settings = await getSiteSettings();
        await sendPasswordResetOtpEmail(user.email, code, settings.siteName);
      } catch {
        // Same-response-either-way below already avoids leaking this to
        // the client; a real send failure still needs investigating via
        // server logs, which this app doesn't have wired up yet.
      }
    }
  }

  // Same response regardless of whether the email matched an account, was
  // inactive, or mail sending failed — prevents user enumeration.
  redirect(`/admin/reset-password?email=${encodeURIComponent(email)}&notice=${encodeURIComponent(GENERIC_RESET_MESSAGE)}`);
}

export async function resetPasswordAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const code = String(formData.get("code") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!email || !code || !password) return { error: "Please fill in the code and your new password." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const user = await prisma.user.findUnique({ where: { email } });
  const otp = user
    ? await prisma.passwordResetOtp.findFirst({
        where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (!user || !otp) {
    redirect("/admin/forgot-password");
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    redirect("/admin/forgot-password");
  }

  const codeMatches = await verifyOtpCode(code, otp.codeHash);
  if (!codeMatches) {
    await prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { error: "Incorrect code. Please try again." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
  ]);

  redirect("/admin/login?notice=password-reset");
}
