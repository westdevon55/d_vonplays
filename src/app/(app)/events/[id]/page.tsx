import { notFound } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import { registerForEventAction } from "../actions";
import { formatDateTime } from "@/lib/utils";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenant();
  const data = await withTenant(ctx.organizationId, async (tx) => {
    const event = await tx.event.findUnique({
      where: { id },
      include: {
        registrations: {
          include: { person: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!event) return null;
    const people = await tx.person.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    return { event, people };
  });
  if (!data) notFound();
  const { event, people } = data;
  const canWrite = hasPermission(ctx.role, "events:write");

  return (
    <>
      <PageHeader
        title={event.title}
        description={`${formatDateTime(event.startAt)}${event.location ? " · " + event.location : ""}`}
      />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {event.description && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 whitespace-pre-wrap text-sm text-slate-700">
              {event.description}
            </div>
          )}
          <h2 className="mt-6 text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Registrations ({event.registrations.length})
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-left px-4 py-2 font-medium">Attendees</th>
                  <th className="text-left px-4 py-2 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {event.registrations.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      No registrations yet.
                    </td>
                  </tr>
                )}
                {event.registrations.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">
                      {r.person
                        ? `${r.person.firstName} ${r.person.lastName}`
                        : r.guestName ?? "Guest"}
                    </td>
                    <td className="px-4 py-2">{r.attendees}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {formatDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {canWrite && event.registrationOpen && (
          <form
            action={registerForEventAction.bind(null, id)}
            className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 h-fit"
          >
            <h3 className="font-medium">Add registration</h3>
            <select name="personId" className="input">
              <option value="">— Guest —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            <label className="block">
              <span className="text-xs text-slate-600">Attendees</span>
              <input
                name="attendees"
                type="number"
                min="1"
                defaultValue="1"
                className="input mt-1"
              />
            </label>
            <button className="btn w-full">Register</button>
          </form>
        )}
      </div>
    </>
  );
}
