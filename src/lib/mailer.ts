import "server-only";
import https from "https";
import nodemailer from "nodemailer";

// Reads process.env directly rather than src/config/env.ts — that module
// eagerly validates every env var (DATABASE_URL included) the instant
// anything imports it, which breaks Next's build-time page-data
// collection (see src/lib/prisma.ts for the same issue/fix).
const smtp = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@localhost",
};
const brevoApiKey = process.env.BREVO_API_KEY || "";

// Same Brevo-over-HTTPS approach as src/config/mailer.ts: many shared
// hosts block outbound SMTP ports entirely, but HTTPS never hits since
// it's the same port every web page uses.
function sendViaBrevoApi(to: string, subject: string, html: string, text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { email: smtp.from },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    });

    const req = https.request(
      {
        hostname: "api.brevo.com",
        path: "/v3/smtp/email",
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
          "api-key": brevoApiKey,
        },
        timeout: 15000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const ok = typeof res.statusCode === "number" && res.statusCode >= 200 && res.statusCode < 300;
          if (ok) resolve(body);
          else reject(new Error(`Brevo API error (${res.statusCode}): ${body}`));
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error("Brevo API request timed out after 15s")));
    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

async function sendMail(to: string, subject: string, html: string, text: string): Promise<void> {
  if (brevoApiKey) {
    await sendViaBrevoApi(to, subject, html, text);
    return;
  }
  if (!smtp.host) throw new Error("No email transport is configured (set BREVO_API_KEY or SMTP_HOST).");

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });
  await transporter.sendMail({ from: smtp.from, to, subject, html, text });
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
