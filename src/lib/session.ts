import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db } from "./db";

const COOKIE_NAME = "church_cms_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export type AppSession = {
  userId: string;
  email: string;
  name: string | null;
  currentOrgId: string | null;
  expiresAt: Date;
};

/**
 * Create a fresh session row + set the cookie. Called after a successful
 * login or signup. The token is opaque (random 256-bit); the DB row maps
 * token → user, with rotation possible by re-issuing a new token.
 */
export async function createSession(
  userId: string,
  currentOrgId: string | null,
): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: { userId, token, currentOrgId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const row = await db.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!row) return null;
  if (row.expiresAt < new Date()) {
    await db.session.delete({ where: { id: row.id } }).catch(() => {});
    return null;
  }

  return {
    userId: row.user.id,
    email: row.user.email,
    name: row.user.name,
    currentOrgId: row.currentOrgId,
    expiresAt: row.expiresAt,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function switchOrg(organizationId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) throw new Error("UNAUTHENTICATED");
  const session = await db.session.findUnique({ where: { token } });
  if (!session) throw new Error("UNAUTHENTICATED");

  // verify the user actually belongs to this org
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.userId,
        organizationId,
      },
    },
  });
  if (!membership) throw new Error("FORBIDDEN");

  await db.session.update({
    where: { id: session.id },
    data: { currentOrgId: organizationId },
  });
}
