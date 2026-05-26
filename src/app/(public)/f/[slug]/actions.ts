"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { dbAdmin } from "@/lib/db";
import { withTenant } from "@/lib/tenant";
import { rateLimit } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";

export async function submitFormAction(
  formId: string,
  formData: FormData,
): Promise<void> {
  // Rate-limit unauthenticated submissions per IP.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`form:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.ok) throw new Error("Too many submissions. Try again later.");

  // Find the form. Cross-tenant lookup → admin client. We never accept a
  // submission for an unpublished form.
  const form = await dbAdmin.form.findFirst({
    where: { id: formId, isPublished: true },
    include: { fields: true },
  });
  if (!form) throw new Error("Form not available");

  // Build the submission payload from registered fields only (ignores any
  // extra/forged fields). Validates required fields server-side.
  const data: Record<string, string | boolean | null> = {};
  for (const f of form.fields) {
    const raw = formData.get(`field_${f.id}`);
    if (f.kind === "CHECKBOX") {
      data[f.label] = raw === "on";
      continue;
    }
    const str = typeof raw === "string" ? raw : "";
    if (f.required && str.trim() === "") {
      throw new Error(`Missing required field: ${f.label}`);
    }
    data[f.label] = str || null;
  }

  // The submission row is RLS-scoped via parent Form → use withTenant for
  // the correct org.
  await withTenant(form.organizationId, (tx) =>
    tx.formSubmission.create({
      data: {
        formId,
        data,
        ipAddress: ip,
      },
    }),
  );

  await audit({
    organizationId: form.organizationId,
    action: "form.submission",
    entityType: "Form",
    entityId: form.id,
  });

  redirect(`/f/${form.slug}?status=ok`);
}
