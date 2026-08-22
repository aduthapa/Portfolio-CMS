import crypto from "crypto";
import bcrypt from "bcryptjs";

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
