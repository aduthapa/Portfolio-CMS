import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { logError } from "../utils/logger";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).render(req.path.startsWith("/admin") ? "admin/404" : "public/404", {
    title: "Page not found",
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let message = "Something went wrong. Please try again.";

  if (err instanceof MulterError) {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "That file is too large." : err.message;
  } else if (err instanceof Error && (err as { status?: number }).status) {
    status = (err as { status?: number }).status as number;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  logError(`${req.method} ${req.originalUrl}`, err);

  const isAdmin = req.path.startsWith("/admin");
  if (isAdmin && req.flash) {
    req.flash("error", message);
    return res.redirect("back");
  }

  res.status(status).render(isAdmin ? "admin/error" : "public/error", {
    title: "Error",
    message,
    status,
  });
}
