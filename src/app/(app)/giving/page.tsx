import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../_components/PageHeader";
import { createDonationAction } from "./actions";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function GivingPage() {
  const ctx = await requireTenant();
  if (!hasPermission(ctx.role, "giving:read")) {
    return (
      <>
        <PageHeader title="Giving" />
        <div className="p-6 text-slate-500">
          You don't have access to giving records.
        </div>
      </>
    );
  }
  const data = await withTenant(ctx.organizationId, async (tx) => {
    const [donations, funds, people, totals] = await Promise.all([
      tx.donation.findMany({
        include: { fund: true, person: true },
        orderBy: { donatedAt: "desc" },
        take: 100,
      }),
      tx.fund.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      tx.person.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 500,
      }),
      tx.donation.aggregate({
        _sum: { amountCents: true },
        _count: true,
        where: {
          status: "COMPLETED",
          donatedAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
        },
      }),
    ]);
    return { donations, funds, people, totals };
  });
  const canWrite = hasPermission(ctx.role, "giving:write");
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Giving"
        description="Donations and contributions"
        actions={
          <Link href="/giving/funds" className="btn btn-secondary">
            Manage funds
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Year-to-date</div>
            <div className="mt-2 text-2xl font-semibold">
              {formatMoney(data.totals._sum.amountCents ?? 0)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Donations YTD</div>
            <div className="mt-2 text-2xl font-semibold">{data.totals._count}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Active funds</div>
            <div className="mt-2 text-2xl font-semibold">{data.funds.length}</div>
          </div>
        </div>

        {canWrite && (
          <details className="rounded-xl border border-slate-200 bg-white p-4" open>
            <summary className="cursor-pointer font-medium text-slate-900">
              Record a donation
            </summary>
            <form action={createDonationAction} className="mt-4 grid grid-cols-2 gap-3 max-w-2xl">
              <label className="block">
                <span className="text-xs text-slate-600">Person</span>
                <select name="personId" className="input mt-1">
                  <option value="">— Anonymous —</option>
                  {data.people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Fund</span>
                <select name="fundId" required className="input mt-1">
                  {data.funds.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Amount (USD)</span>
                <input name="amount" type="number" step="0.01" min="0" required className="input mt-1" />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Method</span>
                <select name="method" defaultValue="CASH" className="input mt-1">
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                  <option value="CARD">Card</option>
                  <option value="ACH">ACH</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Date</span>
                <input name="donatedAt" type="date" required defaultValue={todayIso} className="input mt-1" />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Reference (check #)</span>
                <input name="reference" className="input mt-1" />
              </label>
              <label className="block col-span-2">
                <span className="text-xs text-slate-600">Notes</span>
                <textarea name="notes" rows={2} className="input mt-1" />
              </label>
              <div className="col-span-2">
                <button className="btn">Record donation</button>
              </div>
            </form>
          </details>
        )}

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Donor</th>
                <th className="text-left px-4 py-2 font-medium">Fund</th>
                <th className="text-left px-4 py-2 font-medium">Method</th>
                <th className="text-right px-4 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.donations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No donations recorded.
                  </td>
                </tr>
              )}
              {data.donations.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2">{formatDate(d.donatedAt)}</td>
                  <td className="px-4 py-2">
                    {d.person
                      ? `${d.person.firstName} ${d.person.lastName}`
                      : "Anonymous"}
                  </td>
                  <td className="px-4 py-2">{d.fund.name}</td>
                  <td className="px-4 py-2 text-slate-600">{d.method}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatMoney(d.amountCents, d.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
