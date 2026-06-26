import type { Metadata } from "next";
import { BookOpen, Layers, Info } from "lucide-react";
import { QuoteRequestForm } from "@/app/_components/QuoteRequestForm";

export const metadata: Metadata = {
  title: "Booklets & programs — Euphoria Print",
  description:
    "Saddle-stitched booklets, event programs and multi-page pieces. Request a page-count-based quote.",
};

export default function BookletsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 text-center">
        <span className="gradient-brand mx-auto grid h-12 w-12 place-items-center rounded-2xl text-white">
          <BookOpen className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight">
          Booklets & programs
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[var(--color-ink-soft)]">
          Multi-page pieces — event programs, catalogs, saddle-stitched
          booklets. Because price depends on page count and binding, these are
          quoted by request.
        </p>
      </header>

      <div className="card mb-8 flex gap-3 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand)]" />
        <p className="text-sm text-[var(--color-ink-soft)]">
          <span className="font-semibold text-[var(--color-ink)]">
            Why a request, not an instant price?
          </span>{" "}
          Our instant calculator prices single-sheet products. Booklets add
          per-page imposition and binding, so we hand-quote them to keep the
          number honest. Tell us the page count below and we'll be quick.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: Layers,
            title: "Saddle-stitched",
            body: "Folded & stapled — ideal for 8–48 page programs and catalogs.",
          },
          {
            icon: BookOpen,
            title: "Perfect bound",
            body: "Square-spine binding for thicker booklets and lookbooks.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-5">
            <Icon className="h-5 w-5 text-[var(--color-brand)]" />
            <h3 className="mt-3 font-bold">{title}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{body}</p>
          </div>
        ))}
      </div>

      <QuoteRequestForm kind="booklet" submitLabel="Request booklet quote" />
    </div>
  );
}
