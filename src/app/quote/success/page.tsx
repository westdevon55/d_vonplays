import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Order confirmed — Euphoria Print",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <span className="gradient-brand mx-auto grid h-16 w-16 place-items-center rounded-full text-white">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-4xl font-black tracking-tight">
        Order confirmed
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[var(--color-ink-soft)]">
        Thank you! Your payment went through and your print job is in our queue.
        We've emailed your receipt and we'll be in touch with proof and timing.
      </p>
      {session_id && (
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Reference: {session_id}
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/quote/products" className="btn btn-primary">
          Start another quote
        </Link>
        <Link href="/" className="btn btn-secondary">
          Back home
        </Link>
      </div>
    </div>
  );
}
