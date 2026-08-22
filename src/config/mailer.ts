import nodemailer, { Transporter } from "nodemailer";
import { env } from "./env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

export async function sendMail(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!env.smtp.host) {
    throw new Error("SMTP is not configured (SMTP_HOST is empty).");
  }
  await getTransporter().sendMail({ from: env.smtp.from, to, subject, html, text });
}

export async function sendPasswordResetOtpEmail(to: string, code: string, siteName: string): Promise<void> {
  const subject = `${siteName} password reset code`;
  const text = `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;
  const html = `
    <p>Someone requested a password reset for your ${siteName} account.</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0;">${code}</p>
    <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
  `;
  await sendMail(to, subject, html, text);
}
