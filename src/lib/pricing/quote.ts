/**
 * Euphoria Print — Quote Engine (pure pricing module)
 *
 *   Customer Price = (Paper + Clicks) × Job Multiplier + Flat Job Fee
 *
 *   Paper       = Sheets Used × Cost Per Sheet
 *   Sheets Used = ceil(Quantity ÷ N-up)
 *   Clicks      = Sheets Used × click rate   (rate depends on color mode + sides)
 *   Optional    −10% Dream Makers discount on the final total
 *
 * This module is pure (no I/O, no UI). It runs identically on the server and
 * in tests. The operator-only levers (jobMultiplier, flatFee) are inputs here
 * but are NEVER sent to the browser — see lib/pricing/catalog.ts and the
 * server action that calls this function.
 */

export type ColorMode = "color" | "bw" | "mixed";
export type Sides = 1 | 2;

/** Click rate (cost per sheet) by color mode and number of sides. */
export const CLICK_RATES: Record<ColorMode, Record<Sides, number>> = {
  color: { 1: 0.0364, 2: 0.0728 },
  bw: { 1: 0.0042, 2: 0.0084 },
  // "Mixed" has a single published rate — same value regardless of sides.
  mixed: { 1: 0.0406, 2: 0.0406 },
};

export interface QuoteInput {
  quantity: number;
  nUp: number; // pieces per parent sheet (from catalog)
  costPerSheet: number; // from catalog stock choice
  colorMode: ColorMode;
  sides: Sides;
  jobMultiplier: number; // 3–6 (operator default, overridable) — server-side only
  flatFee: number; // 25 | 45 | 75 (operator default, overridable) — server-side only
  dreamMakersDiscount?: boolean;
}

export interface QuoteResult {
  sheets: number;
  paper: number;
  clicks: number;
  subtotal: number; // paper + clicks
  total: number; // final customer price
}

/** Round to 2 decimals (currency). Guards against -0 and float dust. */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Compute a quote. Throws on inputs that can't yield a sensible price so that
 * callers fail loudly rather than returning NaN/Infinity to the customer.
 */
export function quote(input: QuoteInput): QuoteResult {
  const { quantity, nUp, costPerSheet, colorMode, sides } = input;

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`quote: quantity must be a positive number (got ${quantity})`);
  }
  if (!Number.isFinite(nUp) || nUp <= 0) {
    throw new Error(`quote: nUp must be a positive number (got ${nUp})`);
  }
  if (!Number.isFinite(costPerSheet) || costPerSheet < 0) {
    throw new Error(`quote: costPerSheet must be >= 0 (got ${costPerSheet})`);
  }
  const rate = CLICK_RATES[colorMode]?.[sides];
  if (rate === undefined) {
    throw new Error(`quote: no click rate for colorMode=${colorMode} sides=${sides}`);
  }
  if (!Number.isFinite(input.jobMultiplier) || input.jobMultiplier <= 0) {
    throw new Error(`quote: jobMultiplier must be positive (got ${input.jobMultiplier})`);
  }
  if (!Number.isFinite(input.flatFee) || input.flatFee < 0) {
    throw new Error(`quote: flatFee must be >= 0 (got ${input.flatFee})`);
  }

  const sheets = Math.ceil(quantity / nUp);
  const paper = sheets * costPerSheet;
  const clicks = sheets * rate;
  const subtotal = paper + clicks;
  let total = subtotal * input.jobMultiplier + input.flatFee;
  if (input.dreamMakersDiscount) total *= 0.9;

  return {
    sheets,
    paper: round2(paper),
    clicks: round2(clicks),
    subtotal: round2(subtotal),
    total: round2(total),
  };
}
