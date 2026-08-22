import https from "https";
import nodemailer, { Transporter } from "nodemailer";
import { env } from "./env";
import { logInfo } from "../utils/logger";

// Uses Node's built-in https module directly (rather than fetch/undici) —
// a lower-level, maximally-compatible HTTP client, and every response is
// logged in full (status + body) regardless of success or failure, so the
// raw Brevo reply is always visible in logs/app.log even when the call
// "succeeds" but nothing actually gets delivered.
function sendViaBrevoApi(to: string, subject: string, html: string, text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { email: env.smtp.from },
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
          "api-key": env.brevoApiKey,
        },
        timeout: 15000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          logInfo("brevo-api", `to=${to} status=${res.statusCode} body=${body}`);
          const ok = typeof res.statusCode === "number" && res.statusCode >= 200 && res.statusCode < 300;
          if (ok) {
            resolve(body);
          } else {
            reject(new Error(`Brevo API error (${res.statusCode}): ${body}`));
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Brevo API request timed out after 15s"));
    });
    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
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

// Returns a short human-readable result string (Brevo's raw response body,
// or a fixed message for SMTP) so callers can surface real evidence of
// what happened, not just "it didn't throw".
export async function sendMail(to: string, subject: string, html: string, text: string): Promise<string> {
  if (env.brevoApiKey) {
    return sendViaBrevoApi(to, subject, html, text);
  }

  if (!env.smtp.host) {
    throw new Error("No email transport is configured (set BREVO_API_KEY or SMTP_HOST).");
  }

  const info = await getSmtpTransporter().sendMail({ from: env.smtp.from, to, subject, html, text });
  logInfo("smtp", `to=${to} messageId=${info.messageId} response=${info.response}`);
  return `SMTP accepted (messageId: ${info.messageId})`;
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

// Returns the raw transport result so the caller (the admin-only "send
// test email" button) can display it directly in the browser.
export async function sendTestEmail(to: string, siteName: string): Promise<string> {
  const transport = env.brevoApiKey ? "Brevo API" : env.smtp.host ? `SMTP (${env.smtp.host}:${env.smtp.port})` : "none";
  const subject = `${siteName}: test email`;
  const text = `This is a test email from ${siteName}, sent via ${transport}. If you received this, outbound email is working.`;
  const html = `<p>This is a test email from <strong>${siteName}</strong>, sent via <strong>${transport}</strong>.</p><p>If you received this, outbound email is working correctly.</p>`;
  const result = await sendMail(to, subject, html, text);
  return `${transport}: ${result}`;
}
