import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../_components/PageHeader";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const ctx = await requireTenant();

  const stats = await withTenant(ctx.organizationId, async (tx) => {
    const [peopleCount, groupCount, upcomingServices, monthGiving] =
      await Promise.all([
        tx.person.count({ where: { status: "ACTIVE" } }),
        tx.group.count({ where: { isActive: true } }),
        tx.service.findMany({
          where: { serviceDate: { gte: new Date() } },
          orderBy: { serviceDate: "asc" },
          take: 5,
          include: { serviceType: true },
        }),
        tx.donation.aggregate({
          _sum: { amountCents: true },
          where: {
            status: "COMPLETED",
            donatedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);
    return { peopleCount, groupCount, upcomingServices, monthGiving };
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your church"
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat label="Active People" value={stats.peopleCount.toString()} href="/people" />
          <Stat label="Active Groups" value={stats.groupCount.toString()} href="/groups" />
          <Stat
            label="Giving this Month"
            value={formatMoney(stats.monthGiving._sum.amountCents ?? 0)}
            href="/giving"
          />
          <Stat
            label="Upcoming Services"
            value={stats.upcomingServices.length.toString()}
            href="/services"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-medium text-slate-900">Upcoming Services</h2>
            <Link href="/services" className="text-sm text-slate-500 hover:text-slate-900">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {stats.upcomingServices.length === 0 && (
              <li className="px-5 py-6 text-sm text-slate-500">
                No upcoming services scheduled.
              </li>
            )}
            {stats.upcomingServices.map((s) => (
              <li key={s.id} className="px-5 py-3 flex justify-between text-sm">
                <Link href={`/services/${s.id}`} className="text-slate-900 hover:underline">
                  {s.title}
                </Link>
                <span className="text-slate-500">
                  {new Date(s.serviceDate).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 block"
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </Link>
  );
}
