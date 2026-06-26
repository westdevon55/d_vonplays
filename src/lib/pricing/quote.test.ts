/**
 * Acceptance + edge-case tests for the pricing engine.
 *
 * Run with:  npm test   (tsx src/lib/pricing/quote.test.ts)
 *
 * The five section-5 cases come straight from the operator's hand-calculated
 * examples. The pricing function is correct ONLY if it returns these totals.
 */

import { quote, CLICK_RATES, type QuoteInput } from "./quote";
import { CATALOG, getProduct } from "./catalog";

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const ok = Object.is(actual, expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}\n      expected: ${expected}\n      actual:   ${actual}`);
  }
}

function expectThrows(name: string, fn: () => unknown) {
  try {
    fn();
    failed++;
    console.error(`  ✗ ${name}\n      expected a thrown error, but none was thrown`);
  } catch {
    passed++;
    console.log(`  ✓ ${name}`);
  }
}

/* ---------------------------------------------------------------- *
 * Section 5 acceptance tests — must reproduce EXACTLY.
 * Each row resolves nUp/costPerSheet/mult/fee from the seed catalog,
 * proving the catalog and the formula agree end-to-end.
 * ---------------------------------------------------------------- */

interface AcceptanceCase {
  quantity: number;
  productId: string;
  colorMode: QuoteInput["colorMode"];
  sides: QuoteInput["sides"];
  expectedTotal: number;
}

const ACCEPTANCE: AcceptanceCase[] = [
  { quantity: 500, productId: "bc", colorMode: "color", sides: 2, expectedTotal: 70.44 },
  { quantity: 500, productId: "f57", colorMode: "color", sides: 2, expectedTotal: 156.4 },
  { quantity: 1000, productId: "f85", colorMode: "color", sides: 2, expectedTotal: 606.7 },
  { quantity: 500, productId: "tri1", colorMode: "color", sides: 2, expectedTotal: 559.75 },
  { quantity: 500, productId: "tri2", colorMode: "color", sides: 2, expectedTotal: 301.0 },
];

console.log("Section 5 — acceptance tests (must match operator's numbers):");
for (const c of ACCEPTANCE) {
  const product = getProduct(c.productId);
  if (!product) {
    failed++;
    console.error(`  ✗ catalog missing product ${c.productId}`);
    continue;
  }
  const result = quote({
    quantity: c.quantity,
    nUp: product.nUp,
    costPerSheet: product.stocks[0].costPerSheet,
    colorMode: c.colorMode,
    sides: c.sides,
    jobMultiplier: product.defaultMultiplier,
    flatFee: product.defaultFee,
  });
  check(
    `${c.quantity} × ${product.label} (${c.colorMode}, ${c.sides}-sided) = $${c.expectedTotal}`,
    result.total,
    c.expectedTotal,
  );
}

/* ---------------------------------------------------------------- *
 * Intermediate-value checks (catch silent off-by-one in sheets etc).
 * ---------------------------------------------------------------- */

console.log("\nIntermediate values (business cards, 500 qty):");
{
  const bc = getProduct("bc")!;
  const r = quote({
    quantity: 500,
    nUp: bc.nUp,
    costPerSheet: bc.stocks[0].costPerSheet,
    colorMode: "color",
    sides: 2,
    jobMultiplier: bc.defaultMultiplier,
    flatFee: bc.defaultFee,
  });
  check("sheets = ceil(500/24) = 21", r.sheets, 21);
  check("paper  = 21 × 0.23 = 4.83", r.paper, 4.83);
  check("clicks = 21 × 0.0728 = 1.53", r.clicks, 1.53);
  check("subtotal = 6.36", r.subtotal, 6.36);
}

/* ---------------------------------------------------------------- *
 * Click-rate table integrity.
 * ---------------------------------------------------------------- */

console.log("\nClick-rate table:");
check("color 1-sided", CLICK_RATES.color[1], 0.0364);
check("color 2-sided", CLICK_RATES.color[2], 0.0728);
check("bw 1-sided", CLICK_RATES.bw[1], 0.0042);
check("bw 2-sided", CLICK_RATES.bw[2], 0.0084);
check("mixed ignores sides (1)", CLICK_RATES.mixed[1], 0.0406);
check("mixed ignores sides (2)", CLICK_RATES.mixed[2], 0.0406);

/* ---------------------------------------------------------------- *
 * Dream Makers 10% discount.
 * ---------------------------------------------------------------- */

console.log("\nDream Makers discount:");
{
  const base: QuoteInput = {
    quantity: 1000,
    nUp: 2,
    costPerSheet: 0.315,
    colorMode: "color",
    sides: 2,
    jobMultiplier: 3,
    flatFee: 25,
  };
  const full = quote(base).total; // 606.70
  const discounted = quote({ ...base, dreamMakersDiscount: true }).total;
  check("full price = 606.70", full, 606.7);
  check("−10% applied to final total", discounted, 546.03); // 606.70 × 0.9
}

/* ---------------------------------------------------------------- *
 * Edge cases / guards.
 * ---------------------------------------------------------------- */

console.log("\nGuards & edge cases:");
expectThrows("quantity = 0 throws", () =>
  quote({ quantity: 0, nUp: 2, costPerSheet: 0.3, colorMode: "color", sides: 2, jobMultiplier: 3, flatFee: 25 }),
);
expectThrows("negative quantity throws", () =>
  quote({ quantity: -5, nUp: 2, costPerSheet: 0.3, colorMode: "color", sides: 2, jobMultiplier: 3, flatFee: 25 }),
);
expectThrows("nUp = 0 throws", () =>
  quote({ quantity: 100, nUp: 0, costPerSheet: 0.3, colorMode: "color", sides: 2, jobMultiplier: 3, flatFee: 25 }),
);
expectThrows("NaN quantity throws", () =>
  quote({ quantity: NaN, nUp: 2, costPerSheet: 0.3, colorMode: "color", sides: 2, jobMultiplier: 3, flatFee: 25 }),
);
{
  // qty exactly divisible by nUp — no extra sheet
  const r = quote({ quantity: 48, nUp: 24, costPerSheet: 0.23, colorMode: "bw", sides: 1, jobMultiplier: 4, flatFee: 45 });
  check("48/24 = exactly 2 sheets (no ceil bump)", r.sheets, 2);
  // qty of 1 still produces 1 sheet
  const r2 = quote({ quantity: 1, nUp: 24, costPerSheet: 0.23, colorMode: "bw", sides: 1, jobMultiplier: 4, flatFee: 45 });
  check("qty 1 → 1 sheet", r2.sheets, 1);
}

/* ---------------------------------------------------------------- *
 * Catalog integrity — every product is internally consistent.
 * ---------------------------------------------------------------- */

console.log("\nCatalog integrity:");
check("catalog has 5 seed products", CATALOG.length, 5);
for (const p of CATALOG) {
  const valid =
    p.nUp > 0 &&
    p.stocks.length > 0 &&
    p.stocks.every((s) => s.costPerSheet >= 0) &&
    p.defaultMultiplier >= 3 &&
    p.defaultMultiplier <= 6 &&
    [25, 45, 75].includes(p.defaultFee) &&
    p.colorModes.includes(p.defaultColorMode) &&
    p.allowedSides.includes(p.defaultSides);
  check(`product "${p.id}" is internally consistent`, valid, true);
}

/* ---------------------------------------------------------------- */

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
