import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { env } from "../config/env";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

function storageFor(subdir: string) {
  const dest = path.join(UPLOAD_ROOT, subdir);
  fs.mkdirSync(dest, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = ALLOWED_MIME[file.mimetype] || path.extname(file.originalname) || "";
      const unique = crypto.randomBytes(12).toString("hex");
      cb(null, `${Date.now()}-${unique}${ext}`);
    },
  });
}

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (ALLOWED_MIME[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
}

const limits = { fileSize: env.maxUploadMb * 1024 * 1024 };

export const uploadProfileImage = multer({ storage: storageFor("profiles"), fileFilter, limits });
export const uploadPortfolioMedia = multer({ storage: storageFor("portfolio"), fileFilter, limits });
export const uploadMediaAsset = multer({ storage: storageFor("media"), fileFilter, limits });

export function publicUrlFor(subdir: string, filename: string): string {
  return `/uploads/${subdir}/${filename}`;
}
