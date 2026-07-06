import { prisma } from "../lib/prisma";

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
      metadata: metadata ?? undefined,
    },
  });
}
