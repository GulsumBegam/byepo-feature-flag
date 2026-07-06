import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { logAction } from "../utils/audit";
import {
  createFlagSchema,
  updateFlagSchema,
  checkFlagSchema,
} from "../validators/schemas";

const router = Router();

// ─────────────────────────────────────────────
// Org Admin routes — manage flags for YOUR OWN organization only.
// authenticate + requireRole runs first, so req.user.organizationId is
// guaranteed to exist and be trustworthy (it came from the signed JWT,
// not from anything the client typed).
// ─────────────────────────────────────────────

router.get(
  "/",
  authenticate,
  requireRole("ORG_ADMIN"),
  asyncHandler(async (req, res) => {
    const flags = await prisma.featureFlag.findMany({
      where: { organizationId: req.user!.organizationId! },
      orderBy: { createdAt: "desc" },
    });
    res.json({ flags });
  })
);

router.post(
  "/",
  authenticate,
  requireRole("ORG_ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = createFlagSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const organizationId = req.user!.organizationId!;

    const existing = await prisma.featureFlag.findUnique({
      where: { organizationId_key: { organizationId, key: parsed.data.key } },
    });
    if (existing) {
      return res.status(409).json({ error: "A flag with this key already exists" });
    }

    const flag = await prisma.featureFlag.create({
      data: { key: parsed.data.key, organizationId },
    });

    await logAction({
      action: "FLAG_CREATED",
      performedById: req.user!.userId,
      organizationId,
      metadata: { flagKey: flag.key },
    });

    res.status(201).json({ flag });
  })
);

// PATCH /flags/:id — toggle enabled on/off
router.patch(
  "/:id",
  authenticate,
  requireRole("ORG_ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = updateFlagSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const organizationId = req.user!.organizationId!;

    // Critical tenant-isolation check: the flag must belong to THIS
    // admin's organization. Without this, Org A's admin could toggle
    // Org B's flag just by guessing an ID.
    const flag = await prisma.featureFlag.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!flag) {
      return res.status(404).json({ error: "Flag not found" });
    }

    const updated = await prisma.featureFlag.update({
      where: { id: flag.id },
      data: { enabled: parsed.data.enabled },
    });

    await logAction({
      action: "FLAG_TOGGLED",
      performedById: req.user!.userId,
      organizationId,
      metadata: { flagKey: flag.key, from: flag.enabled, to: updated.enabled },
    });

    res.json({ flag: updated });
  })
);

// DELETE /flags/:id
router.delete(
  "/:id",
  authenticate,
  requireRole("ORG_ADMIN"),
  asyncHandler(async (req, res) => {
    const organizationId = req.user!.organizationId!;

    const flag = await prisma.featureFlag.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!flag) {
      return res.status(404).json({ error: "Flag not found" });
    }

    await prisma.featureFlag.delete({ where: { id: flag.id } });

    await logAction({
      action: "FLAG_DELETED",
      performedById: req.user!.userId,
      organizationId,
      metadata: { flagKey: flag.key },
    });

    res.status(204).send();
  })
);

// ─────────────────────────────────────────────
// End User check — the assignment doesn't require End User signup/login,
// only that they can check a flag for "their organization." Since there's
// no End User auth system in scope, the trade-off we chose is: the End
// User frontend lets them pick their organization from a public list,
// then enter a feature key. Documented as a deliberate scope decision in
// the README, not an oversight.
// ─────────────────────────────────────────────
router.post(
  "/check",
  asyncHandler(async (req, res) => {
    const parsed = checkFlagSchema
      .extend({ organizationId: checkFlagSchema.shape.key })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { organizationId, key } = parsed.data;

    const flag = await prisma.featureFlag.findUnique({
      where: { organizationId_key: { organizationId, key } },
    });

    // If the flag doesn't exist at all for this org, we treat it as
    // disabled rather than a 404 — from the end user's perspective, an
    // unknown feature and a disabled feature should look the same.
    res.json({ enabled: flag?.enabled ?? false });
  })
);

export default router;
