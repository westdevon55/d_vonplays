"use server";

/**
 * Stripe checkout for a computed quote.
 *
 * Security: the price is ALWAYS recomputed here from the catalog + selections.
 * A client-sent total is never trusted. If Stripe isn't configured the action
 * returns a friendly error instead of throwing, so the UI degrades gracefully.
 */

import { headers } from "next/headers";
import { z } from "zod";
import { quote } from "./quote";
import { getProduct, COLOR_LABELS } from "./catalog";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const CheckoutRequest = z.object({
  productId: z.string(),
  stockIndex: z.number().int().min(0),
  quantity: z.number().int().positive().max(1_000_000),
  colorMode: z.enum(["color", "bw", "mixed"]),
  sides: z.union([z.literal(1), z.literal(2)]),
  promoCode: z.string().trim().max(40).optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutRequest>;

export interface CheckoutResponse {
  ok: boolean;
  url?: string;
  error?: string;
}

const DREAM_MAKERS_CODE = "DREAMMAKERS";

export async function createCheckout(
  raw: CheckoutInput,
): Promise<CheckoutResponse> {
  if (!isStripeConfigured()) {
    return {
      ok: false,
      error:
        "Online payment isn't enabled yet. Use “Request this quote” and we'll follow up to finalize payment.",
    };
  }

  const parsed = CheckoutRequest.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid selection." };
  const input = parsed.data;

  const product = getProduct(input.productId);
  if (!product) return { ok: false, error: "Unknown product." };
  const stock = product.stocks[input.stockIndex];
  if (!stock) return { ok: false, error: "Unknown stock option." };

  const dreamMakers =
    !!input.promoCode && input.promoCode.toUpperCase() === DREAM_MAKERS_CODE;

  let total: number;
  try {
    total = quote({
      quantity: input.quantity,
      nUp: product.nUp,
      costPerSheet: stock.costPerSheet,
      colorMode: input.colorMode,
      sides: input.sides,
      jobMultiplier: product.defaultMultiplier,
      flatFee: product.defaultFee,
      dreamMakersDiscount: dreamMakers,
    }).total;
  } catch {
    return { ok: false, error: "Could not price this configuration." };
  }

  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "Payment is temporarily unavailable." };

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const host = hdrs.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  const description = [
    `${input.quantity.toLocaleString()} × ${product.label}`,
    `${COLOR_LABELS[input.colorMode]}, ${input.sides}-sided`,
    stock.label,
    dreamMakers ? "Dream Makers −10%" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(total * 100), // dollars → cents
            product_data: {
              name: `${product.label} — print order`,
              description,
            },
          },
        },
      ],
      success_url: `${origin}/quote/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/quote/products?canceled=1`,
      metadata: {
        productId: input.productId,
        quantity: String(input.quantity),
        colorMode: input.colorMode,
        sides: String(input.sides),
        stock: stock.label,
        dreamMakers: String(dreamMakers),
      },
    });

    if (!session.url) return { ok: false, error: "Could not start checkout." };
    return { ok: true, url: session.url };
  } catch {
    return { ok: false, error: "Could not start checkout. Please try again." };
  }
}
