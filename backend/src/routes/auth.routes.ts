import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { asyncHandler } from "../utils/asyncHandler";
import {
  superAdminLoginSchema,
  orgAdminSignupSchema,
  orgAdminLoginSchema,
} from "../validators/schemas";

const router = Router();

// ─────────────────────────────────────────────
// POST /auth/super-admin/login
// Super Admin uses STATIC credentials (per assignment spec) — there is no
// database row for them. Credentials live in .env: a username and a
// bcrypt HASH of the password (never a plain password on disk).
// ─────────────────────────────────────────────
router.post(
  "/super-admin/login",
  asyncHandler(async (req, res) => {
    const parsed = superAdminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { username, password } = parsed.data;

    const validUsername = username === process.env.SUPER_ADMIN_USERNAME;
    const validPassword = validUsername
      ? await bcrypt.compare(password, process.env.SUPER_ADMIN_PASSWORD_HASH as string)
      : false;

    if (!validUsername || !validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Super Admin has no row in the User table and no organization —
    // the token itself is their entire identity.
    const token = signToken({
      userId: "super-admin",
      role: "SUPER_ADMIN",
      organizationId: null,
    });

    res.json({ token });
  })
);

// ─────────────────────────────────────────────
// POST /auth/org-admin/signup
// Creates a brand-new Organization AND its first Org Admin user, in a
// single transaction — so we never end up with an org that has no admin,
// or a user pointing at an org that doesn't exist.
// ─────────────────────────────────────────────
router.post(
  "/org-admin/signup",
  asyncHandler(async (req, res) => {
    const parsed = orgAdminSignupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { organizationName, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { organization, user } = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: organizationName },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "ORG_ADMIN",
          organizationId: organization.id,
        },
      });

      return { organization, user };
    });

    const token = signToken({
      userId: user.id,
      role: "ORG_ADMIN",
      organizationId: organization.id,
    });

    res.status(201).json({
      token,
      organization: { id: organization.id, name: organization.name },
    });
  })
);

// ─────────────────────────────────────────────
// POST /auth/org-admin/login
// ─────────────────────────────────────────────
router.post(
  "/org-admin/login",
  asyncHandler(async (req, res) => {
    const parsed = orgAdminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Same error message whether the email doesn't exist or the password
    // is wrong — avoids leaking which emails are registered.
    if (!user || user.role !== "ORG_ADMIN") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({
      userId: user.id,
      role: "ORG_ADMIN",
      organizationId: user.organizationId,
    });

    res.json({ token });
  })
);

export default router;
