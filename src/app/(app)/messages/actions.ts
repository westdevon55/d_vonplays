"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { sendEmail, sendSms } from "@/lib/messaging";
import { audit } from "@/lib/audit";

const norm = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

const TemplateInput = z.object({
  name: z.string().min(1).max(160),
  channel: z.enum(["EMAIL", "SMS"]).default("EMAIL"),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(1),
});

export async function createTemplateAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "messages:send");
  const data = TemplateInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, (tx) =>
    tx.messageTemplate.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        channel: data.channel,
        subject: norm(data.subject),
        body: data.body,
      },
    }),
  );
  revalidatePath("/messages/templates");
}

const CampaignInput = z.object({
  name: z.string().min(1).max(160),
  channel: z.enum(["EMAIL", "SMS"]).default("EMAIL"),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(1),
  filterStatus: z.string().optional().or(z.literal("")),
});

export async function sendCampaignAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "messages:send");
  const data = CampaignInput.parse(Object.fromEntries(formData));

  const result = await withTenant(ctx.organizationId, async (tx) => {
    const recipients = await tx.person.findMany({
      where: {
        ...(data.filterStatus && data.filterStatus !== "ALL"
          ? { status: data.filterStatus as "ACTIVE" }
          : { status: "ACTIVE" }),
        ...(data.channel === "EMAIL" ? { email: { not: null } } : {}),
        ...(data.channel === "SMS" ? { mobilePhone: { not: null } } : {}),
      },
      select: { email: true, mobilePhone: true, firstName: true },
    });
    const campaign = await tx.campaign.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        channel: data.channel,
        subject: norm(data.subject),
        body: data.body,
        status: "SENDING",
      },
    });
    return { campaignId: campaign.id, recipients };
  });

  let sent = 0;
  let failed = 0;
  for (const r of result.recipients) {
    const to =
      data.channel === "EMAIL" ? r.email : r.mobilePhone;
    if (!to) {
      failed++;
      continue;
    }
    try {
      if (data.channel === "EMAIL") {
        await sendEmail(to, data.subject || "", data.body);
      } else {
        await sendSms(to, data.body);
      }
      sent++;
      await withTenant(ctx.organizationId, (tx) =>
        tx.message.create({
          data: {
            campaignId: result.campaignId,
            toAddress: to,
            status: "sent",
            sentAt: new Date(),
          },
        }),
      );
    } catch (err) {
      failed++;
      await withTenant(ctx.organizationId, (tx) =>
        tx.message.create({
          data: {
            campaignId: result.campaignId,
            toAddress: to,
            status: "failed",
            errorMessage: (err as Error).message,
          },
        }),
      );
    }
  }

  await withTenant(ctx.organizationId, (tx) =>
    tx.campaign.update({
      where: { id: result.campaignId },
      data: {
        status: failed === 0 ? "SENT" : "FAILED",
        sentAt: new Date(),
        sentCount: sent,
        failedCount: failed,
      },
    }),
  );

  await audit({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: "campaign.sent",
    entityType: "Campaign",
    entityId: result.campaignId,
    metadata: { sent, failed, channel: data.channel },
  });

  revalidatePath("/messages");
  redirect(`/messages`);
}
