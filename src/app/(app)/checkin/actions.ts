"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { randomBytes } from "node:crypto";

function generateGuardianCode(): string {
  return randomBytes(2).toString("hex").toUpperCase();
}

const StartSessionInput = z.object({
  name: z.string().min(1).max(160),
  eventId: z.string().optional().or(z.literal("")),
});

export async function startCheckinSessionAction(
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "checkin:operate");
  const data = StartSessionInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, (tx) =>
    tx.checkinSession.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        eventId: data.eventId && data.eventId.length > 0 ? data.eventId : null,
        startAt: new Date(),
      },
    }),
  );
  revalidatePath("/checkin");
}

export async function checkInAction(
  sessionId: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "checkin:operate");
  const personId = String(formData.get("personId") ?? "");
  const guardianName = String(formData.get("guardianName") ?? "").trim() || null;
  if (!personId) throw new Error("personId required");

  await withTenant(ctx.organizationId, (tx) =>
    tx.checkinRecord.create({
      data: {
        sessionId,
        personId,
        guardianCode: generateGuardianCode(),
        guardianName,
      },
    }),
  );
  revalidatePath(`/checkin/${sessionId}`);
}

export async function checkOutAction(
  sessionId: string,
  recordId: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "checkin:operate");
  const code = String(formData.get("guardianCode") ?? "").trim().toUpperCase();

  await withTenant(ctx.organizationId, async (tx) => {
    const rec = await tx.checkinRecord.findUnique({ where: { id: recordId } });
    if (!rec) throw new Error("Record not found");
    if (rec.guardianCode !== code) {
      throw new Error("Invalid guardian code");
    }
    if (rec.checkedOutAt) return;
    await tx.checkinRecord.update({
      where: { id: recordId },
      data: { checkedOutAt: new Date(), checkedOutBy: ctx.userId },
    });
  });
  revalidatePath(`/checkin/${sessionId}`);
}
