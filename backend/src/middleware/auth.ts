import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../lib/jwt";

// Extend Express's Request type so `req.user` is recognized by TypeScript
// everywhere else in the app after this middleware runs.
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Step 1: Verify the JWT and attach the decoded payload to req.user.
// Every protected route runs this first.
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.split(" ")[1];

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Step 2: The "bouncer" — checks the already-verified user's role against
// a list of allowed roles for this route. Use AFTER `authenticate`.
export function requireRole(...allowedRoles: TokenPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
