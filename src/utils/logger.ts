import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

// cPanel/Passenger's own stdout/stderr capture isn't reliably reachable on
// every host, so errors also get appended to a plain file inside the app
// directory that's always at a known, predictable path: logs/app.log.
function write(level: "ERROR" | "INFO", context: string, detail: string) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const line = `[${new Date().toISOString()}] ${level} ${context}: ${detail}\n`;
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    // If we can't write the log file, there's nothing more we can do here
    // without risking crashing the request that triggered the log call.
  }
}

function toDetail(err: unknown): string {
  if (err instanceof Error) {
    return err.stack || err.message;
  }
  return String(err);
}

export function logError(context: string, err: unknown): void {
  const detail = toDetail(err);
  write("ERROR", context, detail);
  console.error(`${context}:`, err);
}

export function logInfo(context: string, message: string): void {
  write("INFO", context, message);
}
