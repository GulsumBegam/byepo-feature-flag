import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

type LogParams = {
  action: string;
  performedById: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
};

// Central place to write an audit trail entry. Called from inside route
// handlers right after a write operation succeeds — never on failed
// requests, since we only want to log things that actually happened.
export async function logAction({
  action,
  performedById,
  organizationId,
  metadata,
}: LogParams) {
  await prisma.auditLog.create({
    data: {
      action,
      performedById,
      organizationId,
      // Prisma's Json field expects its own InputJsonValue type, which a
      // plain Record<string, unknown> doesn't structurally satisfy under
      // strict TypeScript. Since we already control what we pass in here
      // (small, JSON-safe objects), casting is safe.
      metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}