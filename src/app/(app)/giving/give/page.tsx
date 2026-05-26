import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../../_components/PageHeader";
import { createOnlineGiftCheckoutAction } from "../actions";
import { isStripeConfigured } from "@/lib/stripe";

type SP = Promise<{ status?: string }>;

export default async function GiveOnlinePage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const ctx = await requireTenant();
  const { status } = await searchParams;
  const funds = await withTenant(ctx.organizationId, (tx) =>
    tx.fund.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  );
  const configured = isStripeConfigured();
  return (
    <>
      <PageHeader title="Give Online" description="Make a one-time gift" />
      <div className="p-6 max-w-xl">
        {status === "success" && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Thank you for your gift! Your contribution will appear once Stripe
            confirms the payment.
          </div>
        )}
        {status === "cancelled" && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Checkout cancelled — no charge was made.
          </div>
        )}
        {!configured && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Online giving is not yet configured. Set <code>STRIPE_SECRET_KEY</code>{" "}
            and <code>STRIPE_WEBHOOK_SECRET</code> to enable it.
          </div>
        )}
        <form action={createOnlineGiftCheckoutAction} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Fund</span>
            <select name="fundId" required className="input mt-1">
              {funds.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Amount (USD)</span>
            <input name="amount" type="number" min="1" step="0.01" required className="input mt-1" />
            <p className="mt-1 text-xs text-slate-500">
              Payment processed securely by Stripe — your card details are
              never sent to or stored by us.
            </p>
          </label>
          <button type="submit" className="btn w-full" disabled={!configured}>
            Continue to secure checkout
          </button>
        </form>
      </div>
    </>
  );
}
