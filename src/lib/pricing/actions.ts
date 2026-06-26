"use server";

/**
 * Server actions for the quote engine.
 *
 * The browser NEVER computes a price and NEVER sees the operator levers
 * (multiplier, flat fee, raw sheet cost). It sends the customer-facing
 * selections here; the server resolves margin data from the catalog, runs the
 * pure `quote()` function, and returns ONLY the final total.
 */

import { z } from "zod";
import { quote } from "./quote";
import { getProduct } from "./catalog";

const PriceRequest = z.object({
  productId: z.string(),
  stockIndex: z.number().int().min(0),
  quantity: z.number().int().positive().max(1_000_000),
  colorMode: z.enum(["color", "bw", "mixed"]),
  sides: z.union([z.literal(1), z.literal(2)]),
  promoCode: z.string().trim().max(40).optional(),
});

export type PriceRequestInput = z.infer<typeof PriceRequest>;

export interface PriceResponse {
  ok: boolean;
  total?: number; // dollars
  unit?: number; // per-piece dollars
  currency?: string;
  dreamMakers?: boolean; // whether the discount was applied
  error?: string;
}

// Dream Makers loyalty code → 10% off final total (open decision #3:
// modeled as a promo code entered at quote time; trivially swappable for an
// account flag later).
const DREAM_MAKERS_CODE = "DREAMMAKERS";

export async function priceQuote(
  raw: PriceRequestInput,
): Promise<PriceResponse> {
  const parsed = PriceRequest.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid selection." };
  }
  const input = parsed.data;

  const product = getProduct(input.productId);
  if (!product) return { ok: false, error: "Unknown product." };

  const stock = product.stocks[input.stockIndex];
  if (!stock) return { ok: false, error: "Unknown stock option." };

  if (!product.colorModes.includes(input.colorMode)) {
    return { ok: false, error: "Color mode not available for this product." };
  }
  if (!product.allowedSides.includes(input.sides)) {
    return { ok: false, error: "Sides option not available for this product." };
  }

  const dreamMakers =
    !!input.promoCode &&
    input.promoCode.toUpperCase() === DREAM_MAKERS_CODE;

  try {
    const result = quote({
      quantity: input.quantity,
      nUp: product.nUp,
      costPerSheet: stock.costPerSheet,
      colorMode: input.colorMode,
      sides: input.sides,
      jobMultiplier: product.defaultMultiplier,
      flatFee: product.defaultFee,
      dreamMakersDiscount: dreamMakers,
    });

    return {
      ok: true,
      total: result.total,
      unit: Math.round((result.total / input.quantity) * 100) / 100,
      currency: "USD",
      dreamMakers,
    };
  } catch {
    // Pricing guards threw (bad qty/nUp/etc) — never leak internals.
    return { ok: false, error: "Could not price this configuration." };
  }
}
