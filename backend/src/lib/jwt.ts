import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in .env");
}

// This is the "shape" of data we embed inside every token.
// Putting role + organizationId here means every request can be
// authorized WITHOUT hitting the database — the token itself proves
// who the user is and what org they belong to.
export type TokenPayload = {
  userId: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "END_USER";
  organizationId: string | null;
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
