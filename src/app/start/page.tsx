import type { Metadata } from "next";
import Link from "next/link";
import { Zap, BookOpen, PenLine, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Start a quote — Euphoria Print",
  description: "Choose how you'd like to get your print quote.",
};

const PATHS = [
  {
    href: "/quote/products",
    icon: Zap,
    title: "Instant quote",
    body: "Business cards, flyers and brochures — priced live as you choose.",
    cta: "Start instant quote",
    featured: true,
  },
  {
    href: "/quote/booklets",
    icon: BookOpen,
    title: "Booklets & programs",
    body: "Multi-page, saddle-stitched or perfect-bound pieces, quoted by page count.",
    cta: "Quote a booklet",
  },
  {
    href: "/quote/custom",
    icon: PenLine,
    title: "Custom project",
    body: "Something unique? Tell us the details and we'll tailor a price.",
    cta: "Request custom quote",
  },
];

export default function StartPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Let's get you a price
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-[var(--color-ink-soft)]">
          Pick the path that fits your project.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {PATHS.map(({ href, icon: Icon, title, body, cta, featured }) => (
          <Link
            key={href}
            href={href}
            className={`card group flex flex-col p-7 transition-shadow hover:shadow-lg ${
              featured ? "ring-2 ring-[var(--color-brand)]" : ""
            }`}
          >
            <span className="gradient-brand grid h-11 w-11 place-items-center rounded-xl text-white">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p className="mt-1.5 flex-1 text-sm text-[var(--color-muted)]">
              {body}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-dark)]">
              {cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
