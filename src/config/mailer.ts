import nodemailer, { Transporter } from "nodemailer";
import { env } from "./env";

async function sendViaBrevoApi(to: string, subject: string, html: string, text: string): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.brevoApiKey,
    },
    body: JSON.stringify({
      sender: { email: env.smtp.from },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API error (${res.status}): ${body || res.statusText}`);
  }
}

function getSmtpTransporter(): Transporter {
  // Built fresh per call rather than cached module-wide, so a config
  // change never survives longer than intended in a running process.
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
}

export async function sendMail(to: string, subject: string, html: string, text: string): Promise<void> {
  if (env.brevoApiKey) {
    await sendViaBrevoApi(to, subject, html, text);
    return;
  }

  if (!env.smtp.host) {
    throw new Error("No email transport is configured (set BREVO_API_KEY or SMTP_HOST).");
  }

  await getSmtpTransporter().sendMail({ from: env.smtp.from, to, subject, html, text });
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

export async function sendTestEmail(to: string, siteName: string): Promise<void> {
  const transport = env.brevoApiKey ? "Brevo API" : env.smtp.host ? `SMTP (${env.smtp.host}:${env.smtp.port})` : "none";
  const subject = `${siteName}: test email`;
  const text = `This is a test email from ${siteName}, sent via ${transport}. If you received this, outbound email is working.`;
  const html = `<p>This is a test email from <strong>${siteName}</strong>, sent via <strong>${transport}</strong>.</p><p>If you received this, outbound email is working correctly.</p>`;
  await sendMail(to, subject, html, text);
}
