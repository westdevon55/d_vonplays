"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, dbAdmin } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { verifyTotp } from "@/lib/totp";
import { audit } from "@/lib/audit";

const LoginInput = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  totp: z.string().optional(),
});

const GENERIC_ERR = "Invalid email or password.";

export async function loginAction(
  _prev: { error: string | null } | null,
  formData: FormData,
): Promise<{ error: string | null; needsTotp?: boolean }> {
  const parsed = LoginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    totp: (formData.get("totp") as string) || undefined,
  });
  if (!parsed.success) return { error: GENERIC_ERR };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`login:${ip}:${parsed.data.email}`, 8, 15 * 60 * 1000);
  if (!rl.ok) {
    return { error: "Too many login attempts. Try again later." };
  }

  // Auth bootstrap reads Membership across orgs (no tenant context yet)
  // → dbAdmin. User and Session tables are not tenant-scoped.
  const user = await dbAdmin.user.findUnique({
    where: { email: parsed.data.email },
    include: { memberships: { take: 1, orderBy: { createdAt: "asc" } } },
  });
  if (!user) return { error: GENERIC_ERR };
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: "Account temporarily locked. Try again later." };
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failed,
        lockedUntil:
          failed >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
    return { error: GENERIC_ERR };
  }

  if (user.totpEnabled) {
    if (!parsed.data.totp) return { error: "", needsTotp: true };
    const totpOk =
      user.totpSecret && verifyTotp(parsed.data.totp, user.totpSecret);
    if (!totpOk) {
      return { error: "Invalid 2FA code.", needsTotp: true };
    }
  }

  const orgId = user.memberships[0]?.organizationId ?? null;

  await db.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  await createSession(user.id, orgId);
  if (orgId) {
    await audit({
      organizationId: orgId,
      actorUserId: user.id,
      action: "login.success",
      entityType: "User",
      entityId: user.id,
    });
  }

  redirect(orgId ? "/dashboard" : "/signup");
}
