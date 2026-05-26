import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdmin?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

/**
 * System-level client used for narrow operations that must cross tenant
 * boundaries: the Stripe webhook (writes a Donation derived from signed
 * metadata) and the public form submission endpoint (looks up org from
 * the form's slug). When SYSTEM_DATABASE_URL isn't set, falls back to
 * DATABASE_URL — in dev this is fine; in production, use a dedicated
 * lower-privilege role with narrow GRANTs rather than a superuser.
 */
export const dbAdmin =
  globalForPrisma.prismaAdmin ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.SYSTEM_DATABASE_URL ?? databaseUrl,
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaAdmin = dbAdmin;
}
