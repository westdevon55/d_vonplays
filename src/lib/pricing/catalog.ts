/**
 * Euphoria Print — product catalog.
 *
 * Stored as a config file to start (a Supabase table later if it needs an admin
 * UI, per the spec). Each product carries the layout + stock info the pricing
 * formula needs.
 *
 * IMPORTANT — margin protection (open decision #7):
 * `defaultMultiplier`, `defaultFee`, and per-stock `costPerSheet` are operator
 * margin logic. They live ONLY in this module, which is imported exclusively by
 * server code. The browser receives the `ClientProduct` projection
 * (`toClientCatalog`), which omits every margin lever. The client never computes
 * a price — it asks a server action, which returns the final total only.
 */

import type { ColorMode, Sides } from "./quote";

export interface Stock {
  label: string;
  costPerSheet: number; // SERVER-ONLY margin input
}

export interface Product {
  id: string;
  label: string;
  description: string;
  category: "cards" | "flyers" | "brochures";
  finishedSize: string; // e.g. "8.5×11"
  parentSheet: string; // e.g. "12×18"
  nUp: number; // pieces per parent sheet
  stocks: Stock[];
  colorModes: ColorMode[]; // color options offered for this product
  defaultColorMode: ColorMode;
  allowedSides: Sides[];
  defaultSides: Sides;
  defaultMultiplier: number; // 3–6  — SERVER-ONLY
  defaultFee: number; //  25|45|75  — SERVER-ONLY
}

const ALL_COLOR: ColorMode[] = ["color", "bw", "mixed"];

/**
 * Seed catalog — reproduces the operator's five hand-calculated examples
 * exactly (see lib/pricing/quote.test.ts).
 */
export const CATALOG: Product[] = [
  {
    id: "bc",
    label: "Business cards",
    description: "Standard 3.5×2 business cards, printed full-color front and back.",
    category: "cards",
    finishedSize: "3.5×2",
    parentSheet: "12×18",
    nUp: 24,
    stocks: [{ label: "14pt gloss cover", costPerSheet: 0.23 }],
    colorModes: ALL_COLOR,
    defaultColorMode: "color",
    allowedSides: [1, 2],
    defaultSides: 2, // cards print front & back (open decision #6)
    defaultMultiplier: 4,
    defaultFee: 45,
  },
  {
    id: "f57",
    label: "5×7 flyers",
    description: "Postcard-size 5×7 flyers, great for mailers and handouts.",
    category: "flyers",
    finishedSize: "5×7",
    parentSheet: "11×17",
    nUp: 4,
    stocks: [{ label: "100lb gloss text", costPerSheet: 0.15 }],
    colorModes: ALL_COLOR,
    defaultColorMode: "color",
    allowedSides: [1, 2],
    defaultSides: 2,
    defaultMultiplier: 4,
    defaultFee: 45,
  },
  {
    id: "f85",
    label: "8.5×11 flyers",
    description: "Full-page 8.5×11 flyers for events, menus, and promotions.",
    category: "flyers",
    finishedSize: "8.5×11",
    parentSheet: "12×18",
    nUp: 2,
    stocks: [{ label: "100lb gloss text", costPerSheet: 0.315 }],
    colorModes: ALL_COLOR,
    defaultColorMode: "color",
    allowedSides: [1, 2],
    defaultSides: 2,
    defaultMultiplier: 3,
    defaultFee: 25,
  },
  {
    id: "tri1",
    label: "Tri-fold pamphlet (12×18)",
    description: "Tri-fold brochure on a 12×18 parent sheet.",
    category: "brochures",
    finishedSize: "tri-fold",
    parentSheet: "12×18",
    nUp: 2,
    stocks: [{ label: "100lb gloss text", costPerSheet: 0.315 }],
    colorModes: ALL_COLOR,
    defaultColorMode: "color",
    allowedSides: [1, 2],
    defaultSides: 2,
    defaultMultiplier: 5,
    defaultFee: 75,
  },
  {
    id: "tri2",
    label: "Tri-fold pamphlet (17×18)",
    description: "Larger tri-fold brochure on a 17×18 parent sheet.",
    category: "brochures",
    finishedSize: "tri-fold",
    parentSheet: "17×18",
    nUp: 2,
    stocks: [{ label: "80lb gloss text", costPerSheet: 0.108 }],
    colorModes: ALL_COLOR,
    defaultColorMode: "color",
    allowedSides: [1, 2],
    defaultSides: 2,
    defaultMultiplier: 5,
    defaultFee: 75,
  },
];

export function getProduct(id: string): Product | undefined {
  return CATALOG.find((p) => p.id === id);
}

/* ------------------------------------------------------------------ *
 * Client-safe projection — NO margin levers (no multiplier/fee/cost).
 * ------------------------------------------------------------------ */

export interface ClientStock {
  label: string;
}

export interface ClientProduct {
  id: string;
  label: string;
  description: string;
  category: Product["category"];
  finishedSize: string;
  parentSheet: string;
  nUp: number;
  stocks: ClientStock[];
  colorModes: ColorMode[];
  defaultColorMode: ColorMode;
  allowedSides: Sides[];
  defaultSides: Sides;
}

export function toClientProduct(p: Product): ClientProduct {
  return {
    id: p.id,
    label: p.label,
    description: p.description,
    category: p.category,
    finishedSize: p.finishedSize,
    parentSheet: p.parentSheet,
    nUp: p.nUp,
    stocks: p.stocks.map((s) => ({ label: s.label })),
    colorModes: p.colorModes,
    defaultColorMode: p.defaultColorMode,
    allowedSides: p.allowedSides,
    defaultSides: p.defaultSides,
  };
}

export function toClientCatalog(): ClientProduct[] {
  return CATALOG.map(toClientProduct);
}

export const COLOR_LABELS: Record<ColorMode, string> = {
  color: "Full color",
  bw: "Black & white",
  mixed: "Mixed (color + B&W)",
};
