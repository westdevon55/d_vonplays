import Link from "next/link";

const NAV = [
  { href: "/quote/products", label: "Products" },
  { href: "/quote/booklets", label: "Booklets" },
  { href: "/quote/custom", label: "Custom quote" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="gradient-brand grid h-8 w-8 place-items-center rounded-lg text-sm font-black text-white">
            E
          </span>
          <span className="text-lg font-extrabold tracking-tight text-[var(--color-ink)]">
            Euphoria<span className="text-[var(--color-brand)]">Print</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-[var(--color-ink-soft)] md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[var(--color-brand-dark)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/start" className="btn btn-primary !px-4 !py-2 text-sm">
          Start a quote
        </Link>
      </div>
    </header>
  );
}
