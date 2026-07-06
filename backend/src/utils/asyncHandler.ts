import { Request, Response, NextFunction, RequestHandler } from "express";

// Express does NOT automatically catch errors thrown inside async route
// handlers — a rejected promise just hangs or crashes the process instead
// of reaching our error middleware. This wrapper catches that and forwards
// it to next(), so every route gets consistent error handling for free.
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
