import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 },
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 },
    );
  }

  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      payment_intent: string | null;
      amount_total: number | null;
      currency: string;
      metadata: Record<string, string> | null;
      customer_email: string | null;
    };
    const md = session.metadata ?? {};
    const organizationId = md.organizationId;
    const fundId = md.fundId;
    const personId = md.personId || null;
    if (!organizationId || !fundId || !session.amount_total) {
      return NextResponse.json({ received: true });
    }

    // Idempotency: don't double-record if the same payment_intent arrives twice.
    const pi = session.payment_intent ?? session.id;
    const existing = await db.donation.findUnique({
      where: { stripePaymentIntentId: pi },
    });
    if (existing) return NextResponse.json({ received: true });

    const donation = await db.donation.create({
      data: {
        organizationId,
        personId,
        fundId,
        amountCents: session.amount_total,
        currency: (session.currency || "usd").toUpperCase(),
        method: "CARD",
        status: "COMPLETED",
        donatedAt: new Date(),
        stripePaymentIntentId: pi,
      },
    });
    await audit({
      organizationId,
      action: "donation.stripe_completed",
      entityType: "Donation",
      entityId: donation.id,
      metadata: { amount: session.amount_total, currency: session.currency },
    });
  }

  return NextResponse.json({ received: true });
}
