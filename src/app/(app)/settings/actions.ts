"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";

const OrgInput = z.object({
  name: z.string().min(2).max(120),
  timezone: z.string().max(60),
  currency: z.string().length(3),
});

export async function updateOrgAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "org:manage");
  const data = OrgInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, (tx) =>
    tx.organization.update({
      where: { id: ctx.organizationId },
      data: {
        name: data.name,
        timezone: data.timezone,
        currency: data.currency,
      },
    }),
  );
  revalidatePath("/settings");
}

export async function inviteMemberAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "org:invite");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") ?? "MEMBER") as
    | "OWNER"
    | "ADMIN"
    | "STAFF"
    | "GROUP_LEADER"
    | "VOLUNTEER"
    | "MEMBER";
  if (!email) throw new Error("Email required");

  const token = randomBytes(24).toString("base64url");
  await withTenant(ctx.organizationId, (tx) =>
    tx.invitation.create({
      data: {
        organizationId: ctx.organizationId,
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    }),
  );
  revalidatePath("/settings");
}

export async function changeRoleAction(
  membershipId: string,
  role: "OWNER" | "ADMIN" | "STAFF" | "GROUP_LEADER" | "VOLUNTEER" | "MEMBER",
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "org:manage");
  await withTenant(ctx.organizationId, (tx) =>
    tx.membership.update({ where: { id: membershipId }, data: { role } }),
  );
  await audit({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: "member.role_change",
    entityType: "Membership",
    entityId: membershipId,
    metadata: { role },
  });
  revalidatePath("/settings");
}

export async function addPositionAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "services:schedule");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  await withTenant(ctx.organizationId, (tx) =>
    tx.position.create({
      data: { organizationId: ctx.organizationId, name },
    }),
  );
  revalidatePath("/settings");
}

export async function addServiceTypeAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "services:write");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  await withTenant(ctx.organizationId, (tx) =>
    tx.serviceType.create({
      data: { organizationId: ctx.organizationId, name },
    }),
  );
  revalidatePath("/settings");
}
