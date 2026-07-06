import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { createOrganizationSchema } from "../validators/schemas";

const router = Router();

// PUBLIC route — no auth. Returns only id + name, nothing sensitive.
// Used by the End User frontend so people can pick their organization
// from a dropdown before checking a feature flag.
router.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    res.json({ organizations });
  })
);

// Everything below requires a valid token AND the SUPER_ADMIN role.
router.use(authenticate, requireRole("SUPER_ADMIN"));

// GET /organizations — list every organization on the platform (full detail)
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ organizations });
  })
);

// POST /organizations — create a new organization
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createOrganizationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const organization = await prisma.organization.create({
      data: { name: parsed.data.name },
    });

    res.status(201).json({ organization });
  })
);

export default router;
