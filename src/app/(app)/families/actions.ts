"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";

const FamilyInput = z.object({
  name: z.string().min(1).max(120),
  addressLine1: z.string().max(160).optional().or(z.literal("")),
  addressLine2: z.string().max(160).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  state: z.string().max(80).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  homePhone: z.string().max(40).optional().or(z.literal("")),
});

const norm = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

export async function createFamilyAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "people:write");
  const data = FamilyInput.parse(Object.fromEntries(formData));
  const family = await withTenant(ctx.organizationId, (tx) =>
    tx.family.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        addressLine1: norm(data.addressLine1),
        addressLine2: norm(data.addressLine2),
        city: norm(data.city),
        state: norm(data.state),
        postalCode: norm(data.postalCode),
        country: norm(data.country),
        homePhone: norm(data.homePhone),
      },
    }),
  );
  revalidatePath("/families");
  redirect(`/families/${family.id}`);
}

export async function updateFamilyAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "people:write");
  const data = FamilyInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, (tx) =>
    tx.family.update({
      where: { id },
      data: {
        name: data.name,
        addressLine1: norm(data.addressLine1),
        addressLine2: norm(data.addressLine2),
        city: norm(data.city),
        state: norm(data.state),
        postalCode: norm(data.postalCode),
        country: norm(data.country),
        homePhone: norm(data.homePhone),
      },
    }),
  );
  revalidatePath("/families");
  revalidatePath(`/families/${id}`);
  redirect(`/families/${id}`);
}
