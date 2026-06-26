import type { Metadata } from "next";
import { QuoteRequestForm } from "@/app/_components/QuoteRequestForm";
import { getProduct } from "@/lib/pricing/catalog";

export const metadata: Metadata = {
  title: "Custom quote — Euphoria Print",
  description:
    "Need something outside our standard products? Tell us about your job and we'll send a tailored quote.",
};

export default async function CustomQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; qty?: string }>;
}) {
  const { product, qty } = await searchParams;
  const productLabel = product ? getProduct(product)?.label ?? "" : "";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tight">Custom quote</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Have something special in mind? Share the details and our team will
          get back to you with a tailored price.
        </p>
      </header>

      <QuoteRequestForm
        kind="custom"
        defaultProduct={productLabel}
        defaultQuantity={qty ?? ""}
        submitLabel="Request my quote"
      />
    </div>
  );
}
