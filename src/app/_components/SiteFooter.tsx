import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--color-line)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="gradient-brand grid h-7 w-7 place-items-center rounded-md text-xs font-black text-white">
              E
            </span>
            <span className="font-extrabold tracking-tight">
              Euphoria<span className="text-[var(--color-brand)]">Print</span>
            </span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-[var(--color-muted)]">
            Instant, honest print quotes. Business cards, flyers, brochures and
            more — priced in seconds.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-[var(--color-ink-soft)]">
          <Link href="/quote/products" className="hover:text-[var(--color-brand-dark)]">
            Products
          </Link>
          <Link href="/quote/booklets" className="hover:text-[var(--color-brand-dark)]">
            Booklets
          </Link>
          <Link href="/quote/custom" className="hover:text-[var(--color-brand-dark)]">
            Custom quote
          </Link>
          <Link href="/start" className="hover:text-[var(--color-brand-dark)]">
            Start a quote
          </Link>
        </nav>
      </div>
      <div className="border-t border-[var(--color-line)] py-4 text-center text-xs text-[var(--color-muted)]">
        © {new Date().getFullYear()} Euphoria Print. All rights reserved.
      </div>
    </footer>
  );
}
