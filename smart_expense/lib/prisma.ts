import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Strip channel_binding param — not supported by @neondatabase/serverless
  const rawUrl = process.env.DATABASE_URL ?? "";
  const connectionString = rawUrl.replace(/[&?]channel_binding=require/g, "");
  // PrismaNeon accepts a PoolConfig (plain object), not a Pool instance
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
