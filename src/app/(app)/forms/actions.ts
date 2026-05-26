"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { slugify } from "@/lib/utils";

const FormInput = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional().or(z.literal("")),
  isPublished: z.string().optional(),
});

export async function createFormAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "forms:write");
  const data = FormInput.parse(Object.fromEntries(formData));

  let slug = slugify(data.title) || "form";
  let suffix = 0;
  const form = await withTenant(ctx.organizationId, async (tx) => {
    while (
      await tx.form.findUnique({
        where: { organizationId_slug: { organizationId: ctx.organizationId, slug } },
      })
    ) {
      suffix += 1;
      slug = `${slugify(data.title)}-${suffix}`;
    }
    return tx.form.create({
      data: {
        organizationId: ctx.organizationId,
        title: data.title,
        slug,
        description:
          typeof data.description === "string" && data.description.trim() !== ""
            ? data.description
            : null,
        isPublished: data.isPublished === "on" || data.isPublished === "true",
      },
    });
  });
  revalidatePath("/forms");
  redirect(`/forms/${form.id}`);
}

const FieldInput = z.object({
  label: z.string().min(1).max(160),
  kind: z.enum([
    "TEXT",
    "TEXTAREA",
    "EMAIL",
    "PHONE",
    "NUMBER",
    "DATE",
    "CHECKBOX",
    "SELECT",
  ]),
  required: z.string().optional(),
  options: z.string().optional().or(z.literal("")),
});

export async function addFormFieldAction(
  formId: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "forms:write");
  const data = FieldInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, async (tx) => {
    const last = await tx.formField.findFirst({
      where: { formId },
      orderBy: { position: "desc" },
    });
    await tx.formField.create({
      data: {
        formId,
        label: data.label,
        kind: data.kind,
        required: data.required === "on",
        options:
          data.kind === "SELECT" && data.options
            ? data.options.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        position: (last?.position ?? 0) + 1,
      },
    });
  });
  revalidatePath(`/forms/${formId}`);
}

export async function deleteFormFieldAction(
  formId: string,
  fieldId: string,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "forms:write");
  await withTenant(ctx.organizationId, (tx) =>
    tx.formField.delete({ where: { id: fieldId } }),
  );
  revalidatePath(`/forms/${formId}`);
}

export async function publishFormAction(
  formId: string,
  publish: boolean,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "forms:write");
  await withTenant(ctx.organizationId, (tx) =>
    tx.form.update({ where: { id: formId }, data: { isPublished: publish } }),
  );
  revalidatePath(`/forms/${formId}`);
}
