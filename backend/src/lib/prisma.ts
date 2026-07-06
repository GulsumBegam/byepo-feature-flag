import { PrismaClient } from "@prisma/client";

// In dev, ts-node-dev restarts the process on every file change,
// which would normally create a brand-new PrismaClient (and a new DB
// connection) each time. We stash a single instance on `global` so it
// survives hot-reloads instead of leaking connections.

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = global.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
