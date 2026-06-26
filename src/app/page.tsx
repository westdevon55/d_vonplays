import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { toClientCatalog } from "@/lib/pricing/catalog";

export default function Home() {
  const products = toClientCatalog();

  return (
    <div>
      {/* Hero ----------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[var(--color-brand)] opacity-[0.12] blur-3xl" />
          <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-[var(--color-accent)] opacity-10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-1.5 text-sm font-semibold text-[var(--color-brand-dark)]">
            <Sparkles className="h-4 w-4" /> Instant quotes, real shop pricing
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Print pricing that's
            <br />
            <span className="gradient-text">euphorically simple.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--color-ink-soft)]">
            Choose a product, quantity, color and sides — and see your exact
            total in seconds. No back-and-forth, no surprises.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/quote/products" className="btn btn-primary">
              Get an instant quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/quote/custom" className="btn btn-secondary">
              Request a custom quote
            </Link>
          </div>
        </div>
      </section>

      {/* Value props ---------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Priced in seconds",
              body: "Live pricing updates as you choose. No waiting for a callback.",
            },
            {
              icon: ShieldCheck,
              title: "Honest, shop-accurate",
              body: "The same formula our press operators use — what you see is real.",
            },
            {
              icon: Sparkles,
              title: "Made to look great",
              body: "Premium stocks and full-color printing on every product.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <span className="gradient-brand grid h-10 w-10 place-items-center rounded-xl text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-[var(--color-muted)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular products ----------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              Popular products
            </h2>
            <p className="mt-2 text-[var(--color-muted)]">
              Pick one to start an instant quote.
            </p>
          </div>
          <Link
            href="/quote/products"
            className="hidden text-sm font-semibold text-[var(--color-brand-dark)] hover:underline sm:block"
          >
            View all →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/quote/products?product=${p.id}`}
              className="card group p-6 transition-shadow hover:shadow-lg"
            >
              <span className="inline-block rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--color-brand-dark)]">
                {p.category}
              </span>
              <h3 className="mt-4 text-xl font-bold">{p.label}</h3>
              <p className="mt-1.5 text-sm text-[var(--color-muted)]">
                {p.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-dark)]">
                Quote it{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
