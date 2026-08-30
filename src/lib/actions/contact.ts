"use server";

import { prisma } from "../prisma";

export interface ContactState {
  error?: string;
  success?: boolean;
}

// Mirrors src/routes/public.routes.ts's POST /contact: a general inquiry
// with no profileId, same required fields.
export async function submitContactForm(_prevState: ContactState, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !message) {
    return { error: "Please fill in your name, email, and message." };
  }

  await prisma.inquiry.create({
    data: {
      name: name.slice(0, 190),
      email: email.slice(0, 190),
      phone: phone ? phone.slice(0, 60) : null,
      subject: subject ? subject.slice(0, 190) : null,
      message: message.slice(0, 4000),
    },
  });

  return { success: true };
}
