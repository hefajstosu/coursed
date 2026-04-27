import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const log = process.env.NODE_ENV === "development" ? ["error" as const, "warn" as const] : ["error" as const];

  // prisma+postgres:// — Prisma Dev / Accelerate
  if (url.startsWith("prisma+")) {
    return new PrismaClient({ accelerateUrl: url, log });
  }

  // postgres:// — bezpośrednio przez driver adapter (lokalny PG / Neon TCP)
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }), log });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
