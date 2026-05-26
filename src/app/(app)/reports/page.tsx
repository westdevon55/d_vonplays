import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "../_components/PageHeader";
import { formatMoney } from "@/lib/utils";

export default async function ReportsPage() {
  const ctx = await requireTenant();
  requirePermission(ctx, "reports:read");

  const data = await withTenant(ctx.organizationId, async (tx) => {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const monthStart = (m: number) => new Date(year, m, 1);
    const monthEnd = (m: number) => new Date(year, m + 1, 1);

    const givingByMonth = await Promise.all(
      Array.from({ length: 12 }, async (_, m) => {
        const agg = await tx.donation.aggregate({
          where: {
            status: "COMPLETED",
            donatedAt: { gte: monthStart(m), lt: monthEnd(m) },
          },
          _sum: { amountCents: true },
          _count: true,
        });
        return {
          month: m,
          totalCents: agg._sum.amountCents ?? 0,
          count: agg._count,
        };
      }),
    );

    const [activePeople, totalGroups, ytdGiving, attendanceLast] =
      await Promise.all([
        tx.person.count({ where: { status: "ACTIVE" } }),
        tx.group.count({ where: { isActive: true } }),
        tx.donation.aggregate({
          _sum: { amountCents: true },
          _count: true,
          where: { status: "COMPLETED", donatedAt: { gte: start } },
        }),
        tx.groupAttendance.findMany({
          where: { meetingDate: { gte: start } },
          include: { records: true },
          orderBy: { meetingDate: "desc" },
          take: 50,
        }),
      ]);

    const totalPresent = attendanceLast.reduce(
      (acc, a) => acc + a.records.filter((r) => r.present).length,
      0,
    );

    const givingByFund = await tx.donation.groupBy({
      by: ["fundId"],
      _sum: { amountCents: true },
      where: { status: "COMPLETED", donatedAt: { gte: start } },
    });
    const fundNames = await tx.fund.findMany({
      where: { id: { in: givingByFund.map((g) => g.fundId) } },
    });
    const givingByFundNamed = givingByFund.map((g) => ({
      fund: fundNames.find((f) => f.id === g.fundId)?.name ?? "—",
      amount: g._sum.amountCents ?? 0,
    }));

    return {
      activePeople,
      totalGroups,
      ytdGiving,
      givingByMonth,
      attendanceLast,
      totalPresent,
      givingByFundNamed,
    };
  });

  const maxMonth = Math.max(1, ...data.givingByMonth.map((m) => m.totalCents));

  return (
    <>
      <PageHeader title="Reports" description="Year-to-date metrics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat label="Active People" value={data.activePeople.toString()} />
          <Stat label="Active Groups" value={data.totalGroups.toString()} />
          <Stat
            label="YTD Giving"
            value={formatMoney(data.ytdGiving._sum.amountCents ?? 0)}
          />
          <Stat
            label="Donations YTD"
            value={data.ytdGiving._count.toString()}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="font-medium mb-3">Giving by month</div>
          <div className="flex items-end gap-1 h-32">
            {data.givingByMonth.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-slate-900 rounded-t"
                  style={{ height: `${(m.totalCents / maxMonth) * 100}%` }}
                  title={formatMoney(m.totalCents)}
                />
                <div className="mt-1 text-xs text-slate-400">
                  {new Date(2025, m.month).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="font-medium mb-3">Giving by fund (YTD)</div>
            <ul className="text-sm space-y-1">
              {data.givingByFundNamed.length === 0 && (
                <li className="text-slate-500">No giving recorded.</li>
              )}
              {data.givingByFundNamed.map((f) => (
                <li key={f.fund} className="flex justify-between">
                  <span className="text-slate-700">{f.fund}</span>
                  <span className="font-medium">{formatMoney(f.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="font-medium mb-3">Group attendance</div>
            <div className="text-sm text-slate-600">
              {data.totalPresent} present across {data.attendanceLast.length}{" "}
              recent meetings.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
