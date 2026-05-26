"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";

const norm = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

const GroupInput = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  meetingDay: z.string().max(40).optional().or(z.literal("")),
  meetingTime: z.string().max(40).optional().or(z.literal("")),
  location: z.string().max(120).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  isActive: z.string().optional(),
});

export async function createGroupAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "groups:write");
  const data = GroupInput.parse(Object.fromEntries(formData));
  const group = await withTenant(ctx.organizationId, (tx) =>
    tx.group.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        description: norm(data.description),
        meetingDay: norm(data.meetingDay),
        meetingTime: norm(data.meetingTime),
        location: norm(data.location),
        categoryId: norm(data.categoryId),
        isActive: data.isActive === "on" || data.isActive === "true",
      },
    }),
  );
  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function updateGroupAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "groups:write");
  const data = GroupInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, (tx) =>
    tx.group.update({
      where: { id },
      data: {
        name: data.name,
        description: norm(data.description),
        meetingDay: norm(data.meetingDay),
        meetingTime: norm(data.meetingTime),
        location: norm(data.location),
        categoryId: norm(data.categoryId),
        isActive: data.isActive === "on" || data.isActive === "true",
      },
    }),
  );
  revalidatePath("/groups");
  revalidatePath(`/groups/${id}`);
}

export async function addGroupMemberAction(
  groupId: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "groups:write");
  const personId = String(formData.get("personId") ?? "");
  const role = (String(formData.get("role") ?? "MEMBER") as
    | "LEADER"
    | "CO_LEADER"
    | "MEMBER");
  if (!personId) throw new Error("personId required");

  await withTenant(ctx.organizationId, async (tx) => {
    const grp = await tx.group.findUnique({ where: { id: groupId } });
    if (!grp) throw new Error("Group not found");
    await tx.groupMember.create({
      data: { groupId, personId, role },
    });
  });
  revalidatePath(`/groups/${groupId}`);
}

export async function removeGroupMemberAction(
  groupId: string,
  memberId: string,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "groups:write");
  await withTenant(ctx.organizationId, (tx) =>
    tx.groupMember.delete({ where: { id: memberId } }),
  );
  revalidatePath(`/groups/${groupId}`);
}

export async function recordAttendanceAction(
  groupId: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "groups:write");
  const meetingDateStr = String(formData.get("meetingDate") ?? "");
  if (!meetingDateStr) throw new Error("meetingDate required");
  const meetingDate = new Date(meetingDateStr);

  await withTenant(ctx.organizationId, async (tx) => {
    const members = await tx.groupMember.findMany({ where: { groupId } });
    const att = await tx.groupAttendance.upsert({
      where: { groupId_meetingDate: { groupId, meetingDate } },
      create: { groupId, meetingDate },
      update: {},
    });
    await tx.attendanceRecord.deleteMany({
      where: { attendanceId: att.id },
    });
    const records = members.map((m) => ({
      attendanceId: att.id,
      memberId: m.id,
      present: formData.get(`present_${m.id}`) === "on",
    }));
    if (records.length > 0) {
      await tx.attendanceRecord.createMany({ data: records });
    }
  });
  revalidatePath(`/groups/${groupId}`);
}
