import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: required("DATABASE_URL"),
  sessionSecret: process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me",
  siteUrl: process.env.SITE_URL || "http://localhost:3000",
  maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || "25", 10),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@localhost",
  },
};
