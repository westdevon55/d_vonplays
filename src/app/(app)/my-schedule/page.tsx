import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../_components/PageHeader";
import { respondScheduleAction } from "../services/actions";
import { formatDateTime } from "@/lib/utils";

export default async function MySchedulePage() {
  const ctx = await requireTenant();
  const schedules = await withTenant(ctx.organizationId, async (tx) => {
    const membership = await tx.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: ctx.userId,
          organizationId: ctx.organizationId,
        },
      },
    });
    if (!membership?.personId) return [];
    return tx.schedule.findMany({
      where: {
        personId: membership.personId,
        service: { serviceDate: { gte: new Date() } },
      },
      include: { service: { include: { serviceType: true } }, position: true },
      orderBy: { service: { serviceDate: "asc" } },
    });
  });

  return (
    <>
      <PageHeader title="My Schedule" description="Your upcoming volunteer assignments" />
      <div className="p-6">
        {schedules.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming assignments.</p>
        ) : (
          <ul className="space-y-3 max-w-2xl">
            {schedules.map((s) => (
              <li key={s.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{s.service.title}</div>
                    <div className="text-sm text-slate-600">
                      {formatDateTime(s.service.serviceDate)} · {s.position.name}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {s.status === "ACCEPTED" && <span className="text-emerald-600">Accepted</span>}
                    {s.status === "DECLINED" && <span className="text-red-600">Declined</span>}
                    {s.status === "UNCONFIRMED" && (
                      <div className="flex gap-2">
                        <form action={respondScheduleAction.bind(null, s.id, "ACCEPTED")}>
                          <button className="btn text-xs px-2 py-1">Accept</button>
                        </form>
                        <form action={respondScheduleAction.bind(null, s.id, "DECLINED")}>
                          <button className="btn btn-secondary text-xs px-2 py-1">
                            Decline
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
