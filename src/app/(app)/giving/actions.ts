"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { getStripe } from "@/lib/stripe";

const norm = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

const FundInput = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  isActive: z.string().optional(),
});

export async function createFundAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "giving:write");
  const data = FundInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, (tx) =>
    tx.fund.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        description: norm(data.description),
        isActive: data.isActive === "on" || data.isActive === "true",
      },
    }),
  );
  revalidatePath("/giving/funds");
}

const DonationInput = z.object({
  personId: z.string().optional().or(z.literal("")),
  fundId: z.string().min(1),
  amount: z.string().min(1),
  method: z.enum(["CASH", "CHECK", "CARD", "ACH", "OTHER"]).default("CASH"),
  donatedAt: z.string().min(1),
  reference: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createDonationAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "giving:write");
  const data = DonationInput.parse(Object.fromEntries(formData));
  const amountDollars = Number(data.amount);
  if (!Number.isFinite(amountDollars) || amountDollars <= 0) {
    throw new Error("Amount must be a positive number.");
  }
  const amountCents = Math.round(amountDollars * 100);

  const donation = await withTenant(ctx.organizationId, (tx) =>
    tx.donation.create({
      data: {
        organizationId: ctx.organizationId,
        personId: norm(data.personId),
        fundId: data.fundId,
        amountCents,
        method: data.method,
        status: "COMPLETED",
        donatedAt: new Date(data.donatedAt),
        reference: norm(data.reference),
        notes: norm(data.notes),
      },
    }),
  );
  await audit({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: "donation.create",
    entityType: "Donation",
    entityId: donation.id,
    metadata: { amountCents, fundId: data.fundId },
  });
  revalidatePath("/giving");
}

// Create a Stripe Checkout session for an online gift.
export async function createOnlineGiftCheckoutAction(
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "giving:give");
  const fundId = String(formData.get("fundId") ?? "");
  const amountStr = String(formData.get("amount") ?? "");
  const amount = Number(amountStr);
  if (!fundId || !Number.isFinite(amount) || amount < 1) {
    throw new Error("Invalid amount.");
  }
  const amountCents = Math.round(amount * 100);

  const stripe = getStripe();
  if (!stripe) {
    throw new Error(
      "Online giving not configured. Set STRIPE_SECRET_KEY in environment.",
    );
  }

  const { fundName, donorEmail, donorPersonId } = await withTenant(
    ctx.organizationId,
    async (tx) => {
      const fund = await tx.fund.findUnique({ where: { id: fundId } });
      if (!fund) throw new Error("Fund not found");
      const m = await tx.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.userId,
            organizationId: ctx.organizationId,
          },
        },
        include: { person: true },
      });
      return {
        fundName: fund.name,
        donorEmail: m?.person?.email ?? null,
        donorPersonId: m?.personId ?? null,
      };
    },
  );

  const origin =
    process.env.AUTH_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: `Gift to ${fundName}` },
        },
        quantity: 1,
      },
    ],
    customer_email: donorEmail ?? undefined,
    metadata: {
      organizationId: ctx.organizationId,
      fundId,
      personId: donorPersonId ?? "",
    },
    success_url: `${origin}/giving/give?status=success`,
    cancel_url: `${origin}/giving/give?status=cancelled`,
  });
  redirect(session.url!);
}
