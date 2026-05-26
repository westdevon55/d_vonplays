"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";

const norm = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;
const normNum = (v: unknown) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const ServiceInput = z.object({
  title: z.string().min(1).max(160),
  serviceTypeId: z.string().min(1),
  serviceDate: z.string().min(1),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createServiceAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "services:write");
  const data = ServiceInput.parse(Object.fromEntries(formData));
  const service = await withTenant(ctx.organizationId, (tx) =>
    tx.service.create({
      data: {
        organizationId: ctx.organizationId,
        title: data.title,
        serviceTypeId: data.serviceTypeId,
        serviceDate: new Date(data.serviceDate),
        notes: norm(data.notes),
      },
    }),
  );
  revalidatePath("/services");
  redirect(`/services/${service.id}`);
}

export async function updateServiceAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "services:write");
  const data = ServiceInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, (tx) =>
    tx.service.update({
      where: { id },
      data: {
        title: data.title,
        serviceTypeId: data.serviceTypeId,
        serviceDate: new Date(data.serviceDate),
        notes: norm(data.notes),
      },
    }),
  );
  revalidatePath("/services");
  revalidatePath(`/services/${id}`);
}

const RunSheetItemInput = z.object({
  kind: z.enum(["HEADING", "ITEM", "SONG"]).default("ITEM"),
  title: z.string().min(1).max(200),
  durationMinutes: z.string().optional().or(z.literal("")),
  songId: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function addRunSheetItemAction(
  serviceId: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "services:write");
  const data = RunSheetItemInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, async (tx) => {
    const last = await tx.runSheetItem.findFirst({
      where: { serviceId },
      orderBy: { position: "desc" },
    });
    await tx.runSheetItem.create({
      data: {
        serviceId,
        kind: data.kind,
        title: data.title,
        durationMinutes: normNum(data.durationMinutes),
        songId: norm(data.songId),
        notes: norm(data.notes),
        position: (last?.position ?? 0) + 1,
      },
    });
  });
  revalidatePath(`/services/${serviceId}`);
}

export async function deleteRunSheetItemAction(
  serviceId: string,
  itemId: string,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "services:write");
  await withTenant(ctx.organizationId, (tx) =>
    tx.runSheetItem.delete({ where: { id: itemId } }),
  );
  revalidatePath(`/services/${serviceId}`);
}

export async function addScheduleAction(
  serviceId: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "services:schedule");
  const positionId = String(formData.get("positionId") ?? "");
  const personId = norm(formData.get("personId"));
  if (!positionId) throw new Error("position required");
  await withTenant(ctx.organizationId, (tx) =>
    tx.schedule.create({
      data: { serviceId, positionId, personId },
    }),
  );
  revalidatePath(`/services/${serviceId}`);
}

export async function respondScheduleAction(
  scheduleId: string,
  status: "ACCEPTED" | "DECLINED",
): Promise<void> {
  const ctx = await requireTenant();
  await withTenant(ctx.organizationId, async (tx) => {
    const sched = await tx.schedule.findUnique({
      where: { id: scheduleId },
      include: { service: true, person: { include: { membership: true } } },
    });
    if (!sched) throw new Error("Not found");
    // Only the assigned person (or staff) can respond.
    const isStaff =
      ctx.role === "OWNER" ||
      ctx.role === "ADMIN" ||
      ctx.role === "STAFF";
    const isAssigned = sched.person?.membership?.userId === ctx.userId;
    if (!isStaff && !isAssigned) throw new Error("FORBIDDEN");
    await tx.schedule.update({ where: { id: scheduleId }, data: { status } });
  });
  revalidatePath("/my-schedule");
}

export async function deleteScheduleAction(
  serviceId: string,
  scheduleId: string,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "services:schedule");
  await withTenant(ctx.organizationId, (tx) =>
    tx.schedule.delete({ where: { id: scheduleId } }),
  );
  revalidatePath(`/services/${serviceId}`);
}
