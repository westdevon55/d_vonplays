"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";

const PersonInput = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  preferredName: z.string().max(80).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  mobilePhone: z.string().max(40).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().max(40).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  categoryId: z.string().optional().or(z.literal("")),
  familyId: z.string().optional().or(z.literal("")),
  familyRelation: z.enum(["HEAD", "SPOUSE", "CHILD", "OTHER"]).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

function normalizeOptional(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export async function createPersonAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "people:write");

  const parsed = PersonInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const data = parsed.data;

  const person = await withTenant(ctx.organizationId, (tx) =>
    tx.person.create({
      data: {
        organizationId: ctx.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        preferredName: normalizeOptional(data.preferredName),
        email: normalizeOptional(data.email)?.toLowerCase() ?? null,
        mobilePhone: normalizeOptional(data.mobilePhone),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: normalizeOptional(data.gender),
        status: data.status,
        categoryId: normalizeOptional(data.categoryId),
        familyId: normalizeOptional(data.familyId),
        familyRelation:
          (normalizeOptional(data.familyRelation) as
            | "HEAD"
            | "SPOUSE"
            | "CHILD"
            | "OTHER"
            | null) ?? null,
        notes: normalizeOptional(data.notes),
      },
    }),
  );

  await audit({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: "person.create",
    entityType: "Person",
    entityId: person.id,
  });

  revalidatePath("/people");
  redirect(`/people/${person.id}`);
}

export async function updatePersonAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "people:write");

  const parsed = PersonInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const data = parsed.data;

  await withTenant(ctx.organizationId, (tx) =>
    tx.person.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        preferredName: normalizeOptional(data.preferredName),
        email: normalizeOptional(data.email)?.toLowerCase() ?? null,
        mobilePhone: normalizeOptional(data.mobilePhone),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: normalizeOptional(data.gender),
        status: data.status,
        categoryId: normalizeOptional(data.categoryId),
        familyId: normalizeOptional(data.familyId),
        familyRelation:
          (normalizeOptional(data.familyRelation) as
            | "HEAD"
            | "SPOUSE"
            | "CHILD"
            | "OTHER"
            | null) ?? null,
        notes: normalizeOptional(data.notes),
      },
    }),
  );

  await audit({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: "person.update",
    entityType: "Person",
    entityId: id,
  });

  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  redirect(`/people/${id}`);
}

export async function deletePersonAction(id: string) {
  const ctx = await requireTenant();
  requirePermission(ctx, "people:delete");

  await withTenant(ctx.organizationId, (tx) =>
    tx.person.delete({ where: { id } }),
  );
  await audit({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: "person.delete",
    entityType: "Person",
    entityId: id,
  });
  revalidatePath("/people");
  redirect("/people");
}
