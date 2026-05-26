import { db, dbAdmin } from "./db";
import { getSession } from "./session";

/**
 * Run a function inside a transaction with `app.current_org` set, so that
 * Postgres Row-Level Security policies scope every query to the given org.
 *
 * This is the ONLY supported way to read tenant-owned data. Calls go through
 * the `tx` client passed to the callback — never the bare `db`.
 */
export async function withTenant<T>(
  organizationId: string,
  fn: (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  if (!organizationId) {
    throw new Error("withTenant: organizationId is required");
  }
  return db.$transaction(async (tx) => {
    // set_config(name, value, is_local=true) — scoped to this transaction.
    await tx.$executeRaw`SELECT set_config('app.current_org', ${organizationId}, true)`;
    return fn(tx);
  });
}

export type TenantContext = {
  userId: string;
  organizationId: string;
  role:
    | "OWNER"
    | "ADMIN"
    | "STAFF"
    | "GROUP_LEADER"
    | "VOLUNTEER"
    | "MEMBER";
};

/**
 * Derive the tenant context from the authenticated session. The
 * `organizationId` comes from the SESSION (never request input), so callers
 * cannot tamper with which org they're acting in.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getSession();
  if (!session) return null;
  if (!session.currentOrgId) return null;

  // dbAdmin: we need to look up the membership BEFORE we know the org
  // context (the whole point of this lookup is to derive the role for the
  // current org). The query is constrained by the user+org composite key,
  // so it returns at most a single row.
  const membership = await dbAdmin.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.userId,
        organizationId: session.currentOrgId,
      },
    },
  });
  if (!membership) return null;

  return {
    userId: session.userId,
    organizationId: session.currentOrgId,
    role: membership.role,
  };
}

export async function requireTenant(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx) {
    throw new Error("UNAUTHENTICATED");
  }
  return ctx;
}
