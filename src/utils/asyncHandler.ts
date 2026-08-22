import { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express 4 doesn't await route handlers, so a rejected promise from an
// async controller would otherwise crash the process instead of hitting
// the error middleware. Wrapping every async route closes that gap.
export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
