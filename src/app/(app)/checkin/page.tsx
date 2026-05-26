import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../_components/PageHeader";
import { startCheckinSessionAction } from "./actions";
import { formatDateTime } from "@/lib/utils";

export default async function CheckinPage() {
  const ctx = await requireTenant();
  const data = await withTenant(ctx.organizationId, async (tx) => {
    const [sessions, events] = await Promise.all([
      tx.checkinSession.findMany({
        include: {
          event: true,
          _count: { select: { records: true } },
        },
        orderBy: { startAt: "desc" },
        take: 20,
      }),
      tx.event.findMany({
        where: { startAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        orderBy: { startAt: "asc" },
      }),
    ]);
    return { sessions, events };
  });

  return (
    <>
      <PageHeader title="Check-in" description="Secure child check-in with guardian codes" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Session</th>
                <th className="text-left px-4 py-2 font-medium">Started</th>
                <th className="text-left px-4 py-2 font-medium">Checked in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.sessions.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                    No check-in sessions yet.
                  </td>
                </tr>
              )}
              {data.sessions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2">
                    <Link href={`/checkin/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                    {s.event && (
                      <div className="text-xs text-slate-500">{s.event.title}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{formatDateTime(s.startAt)}</td>
                  <td className="px-4 py-2">{s._count.records}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={startCheckinSessionAction} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 h-fit">
          <h3 className="font-medium">Start new session</h3>
          <label className="block">
            <span className="text-xs text-slate-600">Session name</span>
            <input name="name" required className="input mt-1" placeholder="e.g. Sunday Kids" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-600">Linked event (optional)</span>
            <select name="eventId" className="input mt-1">
              <option value="">— None —</option>
              {data.events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </label>
          <button className="btn w-full">Start session</button>
        </form>
      </div>
    </>
  );
}
