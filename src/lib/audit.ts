import { headers } from "next/headers";
import { withTenant } from "./tenant";

export type AuditAction =
  | "login.success"
  | "login.failed"
  | "login.locked"
  | "logout"
  | "user.signup"
  | "org.create"
  | "person.create"
  | "person.update"
  | "person.delete"
  | "donation.create"
  | "donation.refund"
  | "donation.stripe_completed"
  | "member.role_change"
  | "form.submission"
  | "campaign.sent";

export async function audit(params: {
  organizationId: string;
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  let ip: string | null = null;
  try {
    const h = await headers();
    ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
  } catch {
    // outside a request context (e.g., background job)
  }
  // Wrap in withTenant so the INSERT passes RLS for the right organization.
  await withTenant(params.organizationId, (tx) =>
    tx.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadata: params.metadata
          ? JSON.parse(JSON.stringify(params.metadata))
          : null,
        ipAddress: ip,
      },
    }),
  );
}
