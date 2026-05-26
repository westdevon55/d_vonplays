import { notFound } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../../_components/PageHeader";
import { checkInAction, checkOutAction } from "../actions";
import { formatDateTime } from "@/lib/utils";

export default async function CheckinSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenant();
  const data = await withTenant(ctx.organizationId, async (tx) => {
    const session = await tx.checkinSession.findUnique({
      where: { id },
      include: {
        records: {
          include: { person: true },
          orderBy: { checkedInAt: "desc" },
        },
        event: true,
      },
    });
    if (!session) return null;
    const people = await tx.person.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    return { session, people };
  });
  if (!data) notFound();
  const { session, people } = data;
  const open = session.records.filter((r) => !r.checkedOutAt);
  const done = session.records.filter((r) => r.checkedOutAt);

  return (
    <>
      <PageHeader
        title={session.name}
        description={`Started ${formatDateTime(session.startAt)}`}
      />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <section>
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
              Currently checked in ({open.length})
            </h2>
            <ul className="space-y-2">
              {open.length === 0 && (
                <li className="text-sm text-slate-500">Nobody checked in.</li>
              )}
              {open.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {r.person.firstName} {r.person.lastName}
                    </div>
                    <div className="text-xs text-slate-500">
                      Guardian: {r.guardianName ?? "—"} · Code{" "}
                      <span className="font-mono text-slate-900">{r.guardianCode}</span>
                    </div>
                  </div>
                  <form action={checkOutAction.bind(null, id, r.id)} className="flex gap-2">
                    <input
                      name="guardianCode"
                      placeholder="Code"
                      className="input w-24 uppercase font-mono"
                      required
                    />
                    <button className="btn btn-secondary">Check out</button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
          {done.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                Checked out ({done.length})
              </h2>
              <ul className="space-y-1 text-sm text-slate-600">
                {done.map((r) => (
                  <li key={r.id}>
                    {r.person.firstName} {r.person.lastName} ·{" "}
                    {formatDateTime(r.checkedOutAt)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <form
          action={checkInAction.bind(null, id)}
          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 h-fit"
        >
          <h3 className="font-medium">Check in</h3>
          <select name="personId" required className="input">
            <option value="">Person…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
          <label className="block">
            <span className="text-xs text-slate-600">Guardian name</span>
            <input name="guardianName" className="input mt-1" />
          </label>
          <button className="btn w-full">Check in</button>
        </form>
      </div>
    </>
  );
}
