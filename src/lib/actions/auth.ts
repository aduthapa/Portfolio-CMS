"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { getSession } from "../session";

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
