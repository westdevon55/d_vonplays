import type { Metadata } from "next";
import { toClientCatalog } from "@/lib/pricing/catalog";
import { Calculator } from "./Calculator";

export const metadata: Metadata = {
  title: "Instant quote — Euphoria Print",
  description:
    "Configure your print job and see an instant, accurate total. Business cards, flyers and brochures.",
};

export default async function ProductsPage({
  searchParams,
}: {
  // Next.js 16: searchParams is async.
  searchParams: Promise<{ product?: string; canceled?: string }>;
}) {
  const { product, canceled } = await searchParams;
  const catalog = toClientCatalog();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-black tracking-tight">Build your quote</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Pick a product and options — your price updates live. When it looks
          right, pay online or send it to us as a request.
        </p>
      </header>

      {canceled && (
        <div className="mb-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
          Checkout canceled — your selections are still here whenever you're
          ready.
        </div>
      )}

      <Calculator catalog={catalog} initialProductId={product} />
    </div>
  );
}
