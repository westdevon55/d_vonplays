"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, CreditCard, FileText } from "lucide-react";
import Link from "next/link";
import type { ClientProduct } from "@/lib/pricing/catalog";
import { COLOR_LABELS } from "@/lib/pricing/catalog";
import { priceQuote } from "@/lib/pricing/actions";
import { createCheckout } from "@/lib/pricing/checkout";
import type { ColorMode, Sides } from "@/lib/pricing/quote";

const QTY_PRESETS = [100, 250, 500, 1000, 2500];

const SIDES_LABEL: Record<Sides, { title: string; sub: string }> = {
  1: { title: "Single-sided", sub: "Front only" },
  2: { title: "Double-sided", sub: "Front & back" },
};

export function Calculator({
  catalog,
  initialProductId,
}: {
  catalog: ClientProduct[];
  initialProductId?: string;
}) {
  const initial =
    catalog.find((p) => p.id === initialProductId) ?? catalog[0];

  const [productId, setProductId] = useState(initial.id);
  const product = catalog.find((p) => p.id === productId) ?? catalog[0];

  const [stockIndex, setStockIndex] = useState(0);
  const [quantity, setQuantity] = useState(500);
  const [colorMode, setColorMode] = useState<ColorMode>(product.defaultColorMode);
  const [sides, setSides] = useState<Sides>(product.defaultSides);
  const [promoCode, setPromoCode] = useState("");

  const [total, setTotal] = useState<number | null>(null);
  const [unit, setUnit] = useState<number | null>(null);
  const [dreamMakers, setDreamMakers] = useState(false);
  const [pricing, setPricing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // When the product changes, reset dependent selections to its defaults.
  function selectProduct(id: string) {
    const p = catalog.find((x) => x.id === id);
    if (!p) return;
    setProductId(id);
    setStockIndex(0);
    setColorMode(p.defaultColorMode);
    setSides(p.defaultSides);
  }

  // Live pricing — debounced, with a request id to ignore stale responses.
  const reqId = useRef(0);
  useEffect(() => {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setTotal(null);
      setUnit(null);
      setError(null);
      return;
    }
    const id = ++reqId.current;
    setPricing(true);
    setError(null);
    const t = setTimeout(async () => {
      const res = await priceQuote({
        productId,
        stockIndex,
        quantity: qty,
        colorMode,
        sides,
        promoCode: promoCode || undefined,
      });
      if (id !== reqId.current) return; // a newer request superseded this one
      setPricing(false);
      if (res.ok && res.total != null) {
        setTotal(res.total);
        setUnit(res.unit ?? null);
        setDreamMakers(!!res.dreamMakers);
      } else {
        setTotal(null);
        setUnit(null);
        setError(res.error ?? "Could not price this configuration.");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [productId, stockIndex, quantity, colorMode, sides, promoCode]);

  async function handleCheckout() {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) return;
    setCheckingOut(true);
    setError(null);
    const res = await createCheckout({
      productId,
      stockIndex,
      quantity: qty,
      colorMode,
      sides,
      promoCode: promoCode || undefined,
    });
    if (res.ok && res.url) {
      window.location.href = res.url;
    } else {
      setCheckingOut(false);
      setError(res.error ?? "Could not start checkout.");
    }
  }

  const qtyValid = Number.isInteger(Number(quantity)) && Number(quantity) > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Configuration ------------------------------------------- */}
      <div className="space-y-7">
        {/* Product */}
        <Field label="Product">
          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.map((p) => (
              <button
                key={p.id}
                type="button"
                className="option"
                aria-pressed={p.id === productId}
                onClick={() => selectProduct(p.id)}
              >
                {p.label}
                <small>
                  {p.finishedSize !== "—" ? `${p.finishedSize} · ` : ""}
                  {p.nUp}-up on {p.parentSheet}
                </small>
              </button>
            ))}
          </div>
        </Field>

        {/* Stock */}
        {product.stocks.length > 1 && (
          <Field label="Paper stock">
            <div className="grid gap-2 sm:grid-cols-2">
              {product.stocks.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  className="option"
                  aria-pressed={i === stockIndex}
                  onClick={() => setStockIndex(i)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Quantity */}
        <Field label="Quantity">
          <div className="flex flex-wrap gap-2">
            {QTY_PRESETS.map((q) => (
              <button
                key={q}
                type="button"
                className="option !w-auto !flex-row"
                aria-pressed={Number(quantity) === q}
                onClick={() => setQuantity(q)}
              >
                {q.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value === "" ? ("" as unknown as number) : Number(e.target.value),
              )
            }
            className="input mt-3 max-w-[200px]"
            aria-label="Custom quantity"
            placeholder="Custom amount"
          />
          {!qtyValid && (
            <p className="mt-2 text-sm text-[var(--color-accent)]">
              Enter a whole number greater than zero.
            </p>
          )}
        </Field>

        {/* Color */}
        <Field label="Color">
          <div className="grid gap-2 sm:grid-cols-3">
            {product.colorModes.map((c) => (
              <button
                key={c}
                type="button"
                className="option"
                aria-pressed={c === colorMode}
                onClick={() => setColorMode(c)}
              >
                {COLOR_LABELS[c]}
              </button>
            ))}
          </div>
        </Field>

        {/* Sides */}
        <Field label="Sides">
          <div className="grid gap-2 sm:grid-cols-2">
            {product.allowedSides.map((s) => (
              <button
                key={s}
                type="button"
                className="option"
                aria-pressed={s === sides}
                onClick={() => setSides(s)}
              >
                {SIDES_LABEL[s].title}
                <small>{SIDES_LABEL[s].sub}</small>
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* Sticky price summary ------------------------------------ */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden">
          <div className="gradient-brand px-6 py-5 text-white">
            <p className="text-sm font-medium opacity-90">Your price</p>
            <div className="mt-1 flex items-end gap-2">
              {pricing ? (
                <Loader2 className="my-2 h-7 w-7 animate-spin" />
              ) : total != null ? (
                <span className="text-4xl font-black tabular-nums">
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              ) : (
                <span className="text-2xl font-bold opacity-80">—</span>
              )}
            </div>
            {total != null && unit != null && (
              <p className="mt-1 text-sm opacity-90">
                ${unit.toFixed(2)} per piece · {Number(quantity).toLocaleString()} qty
              </p>
            )}
            {dreamMakers && (
              <p className="mt-2 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                Dream Makers −10% applied
              </p>
            )}
          </div>

          <div className="space-y-3 p-6">
            <dl className="space-y-1.5 text-sm">
              <Row k="Product" v={product.label} />
              <Row k="Quantity" v={qtyValid ? Number(quantity).toLocaleString() : "—"} />
              <Row k="Color" v={COLOR_LABELS[colorMode]} />
              <Row k="Sides" v={SIDES_LABEL[sides].title} />
              <Row k="Stock" v={product.stocks[stockIndex]?.label ?? "—"} />
            </dl>

            <div>
              <label className="label" htmlFor="promo">
                Promo code (optional)
              </label>
              <input
                id="promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="input"
                placeholder="e.g. DREAMMAKERS"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-sm text-[var(--color-accent)]">
                {error}
              </p>
            )}

            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleCheckout}
              disabled={!qtyValid || total == null || checkingOut || pricing}
            >
              {checkingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {checkingOut ? "Starting checkout…" : "Pay & order"}
            </button>

            <Link
              href={`/quote/custom?product=${productId}&qty=${qtyValid ? quantity : ""}`}
              className="btn btn-secondary w-full"
            >
              <FileText className="h-4 w-4" /> Request this quote
            </Link>

            <p className="text-center text-xs text-[var(--color-muted)]">
              Final total shown — no hidden fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--color-muted)]">{k}</dt>
      <dd className="font-semibold text-[var(--color-ink)]">{v}</dd>
    </div>
  );
}
