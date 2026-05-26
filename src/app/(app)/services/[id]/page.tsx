import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import {
  addRunSheetItemAction,
  deleteRunSheetItemAction,
  addScheduleAction,
  deleteScheduleAction,
} from "../actions";
import { formatDateTime } from "@/lib/utils";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenant();

  const data = await withTenant(ctx.organizationId, async (tx) => {
    const service = await tx.service.findUnique({
      where: { id },
      include: {
        serviceType: true,
        runSheetItems: {
          orderBy: { position: "asc" },
          include: { song: true },
        },
        schedules: {
          include: { position: true, person: true },
        },
      },
    });
    if (!service) return null;
    const [positions, songs, people] = await Promise.all([
      tx.position.findMany({ orderBy: { name: "asc" } }),
      tx.song.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
      tx.person.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);
    return { service, positions, songs, people };
  });
  if (!data) notFound();
  const { service, positions, songs, people } = data;
  const canWrite = hasPermission(ctx.role, "services:write");
  const canSchedule = hasPermission(ctx.role, "services:schedule");

  return (
    <>
      <PageHeader
        title={service.title}
        description={`${service.serviceType.name} · ${formatDateTime(service.serviceDate)}`}
      />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Run sheet
          </h2>
          <ol className="space-y-2 mb-4">
            {service.runSheetItems.length === 0 && (
              <li className="text-sm text-slate-500">No items yet.</li>
            )}
            {service.runSheetItems.map((it, i) => (
              <li
                key={it.id}
                className="rounded-lg border border-slate-200 bg-white p-3 flex justify-between gap-3"
              >
                <div>
                  <div className="text-xs text-slate-400">
                    {i + 1} · {it.kind}
                  </div>
                  <div className="font-medium text-slate-900">{it.title}</div>
                  {it.song && (
                    <div className="text-xs text-slate-500">
                      Song: <Link href={`/songs/${it.song.id}`} className="underline">
                        {it.song.title}
                      </Link>
                    </div>
                  )}
                  {it.notes && (
                    <div className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">
                      {it.notes}
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-slate-500">
                  {it.durationMinutes && <div>{it.durationMinutes} min</div>}
                  {canWrite && (
                    <form action={deleteRunSheetItemAction.bind(null, id, it.id)}>
                      <button className="text-red-600 hover:underline mt-2">
                        Remove
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {canWrite && (
            <form
              action={addRunSheetItemAction.bind(null, id)}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
            >
              <h3 className="font-medium text-slate-900">Add item</h3>
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-600">Kind</span>
                  <select name="kind" className="input mt-1">
                    <option value="ITEM">Item</option>
                    <option value="HEADING">Heading</option>
                    <option value="SONG">Song</option>
                  </select>
                </label>
                <label className="block col-span-2">
                  <span className="text-xs text-slate-600">Title</span>
                  <input name="title" required className="input mt-1" />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-600">Duration (min)</span>
                  <input name="durationMinutes" type="number" className="input mt-1" />
                </label>
                <label className="block col-span-2">
                  <span className="text-xs text-slate-600">Song (optional)</span>
                  <select name="songId" className="input mt-1">
                    <option value="">— None —</option>
                    {songs.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-slate-600">Notes</span>
                <textarea name="notes" rows={2} className="input mt-1" />
              </label>
              <button className="btn">Add to run sheet</button>
            </form>
          )}
        </section>

        <aside>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Roster
          </h2>
          <ul className="space-y-2 mb-4">
            {service.schedules.length === 0 && (
              <li className="text-sm text-slate-500">No volunteers scheduled.</li>
            )}
            {service.schedules.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-slate-200 bg-white p-3 text-sm flex justify-between"
              >
                <div>
                  <div className="font-medium text-slate-900">{s.position.name}</div>
                  <div className="text-slate-600">
                    {s.person
                      ? `${s.person.firstName} ${s.person.lastName}`
                      : "Unassigned"}
                  </div>
                  <div className="text-xs text-slate-400">{s.status}</div>
                </div>
                {canSchedule && (
                  <form action={deleteScheduleAction.bind(null, id, s.id)}>
                    <button className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {canSchedule && (
            <form
              action={addScheduleAction.bind(null, id)}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
            >
              <h3 className="font-medium text-slate-900">Add to roster</h3>
              <select name="positionId" required className="input">
                <option value="">Position…</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select name="personId" className="input">
                <option value="">Unassigned</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              <button className="btn w-full">Add</button>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
