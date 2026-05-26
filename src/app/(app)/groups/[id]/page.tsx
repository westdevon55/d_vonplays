import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import { GroupForm } from "../_components/GroupForm";
import {
  updateGroupAction,
  addGroupMemberAction,
  removeGroupMemberAction,
  recordAttendanceAction,
} from "../actions";
import { formatDate } from "@/lib/utils";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenant();

  const data = await withTenant(ctx.organizationId, async (tx) => {
    const group = await tx.group.findUnique({
      where: { id },
      include: {
        category: true,
        members: { include: { person: true }, orderBy: { role: "asc" } },
        attendances: {
          orderBy: { meetingDate: "desc" },
          take: 6,
          include: { records: true },
        },
      },
    });
    if (!group) return null;
    const [categories, people] = await Promise.all([
      tx.groupCategory.findMany({ orderBy: { name: "asc" } }),
      tx.person.findMany({
        where: {
          status: "ACTIVE",
          groupMembers: { none: { groupId: id } },
        },
        select: { id: true, firstName: true, lastName: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 500,
      }),
    ]);
    return { group, categories, people };
  });

  if (!data) notFound();
  const { group, categories, people } = data;
  const canWrite = hasPermission(ctx.role, "groups:write");
  const update = updateGroupAction.bind(null, id);
  const addMember = addGroupMemberAction.bind(null, id);
  const recordAtt = recordAttendanceAction.bind(null, id);

  return (
    <>
      <PageHeader title={group.name} description={group.description ?? undefined} />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {canWrite && (
            <section>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                Group details
              </h2>
              <GroupForm
                action={update}
                defaults={group}
                categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                submitLabel="Save changes"
              />
            </section>
          )}

          <section>
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
              Attendance
            </h2>
            {canWrite && (
              <form
                action={recordAtt}
                className="rounded-xl border border-slate-200 bg-white p-4 mb-4"
              >
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Meeting date
                  </span>
                  <input
                    name="meetingDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="input mt-1 max-w-xs"
                  />
                </label>
                <div className="mt-3 space-y-1">
                  {group.members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name={`present_${m.id}`} defaultChecked />
                      {m.person.firstName} {m.person.lastName}
                    </label>
                  ))}
                </div>
                <button className="btn mt-3">Record attendance</button>
              </form>
            )}

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-left px-4 py-2 font-medium">Present</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.attendances.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                        No attendance recorded.
                      </td>
                    </tr>
                  )}
                  {group.attendances.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2">{formatDate(a.meetingDate)}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {a.records.filter((r) => r.present).length} / {a.records.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-medium text-slate-900">Members ({group.members.length})</div>
            <ul className="mt-3 space-y-1 text-sm">
              {group.members.map((m) => (
                <li key={m.id} className="flex justify-between items-center">
                  <Link
                    href={`/people/${m.person.id}`}
                    className="text-slate-700 hover:underline"
                  >
                    {m.person.firstName} {m.person.lastName}
                  </Link>
                  <span className="text-xs text-slate-400">{m.role}</span>
                  {canWrite && (
                    <form action={removeGroupMemberAction.bind(null, id, m.id)}>
                      <button className="text-xs text-red-600 hover:underline ml-2">
                        Remove
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            {canWrite && (
              <form action={addMember} className="mt-4 space-y-2">
                <select name="personId" required className="input">
                  <option value="">Add person…</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
                <select name="role" defaultValue="MEMBER" className="input">
                  <option value="MEMBER">Member</option>
                  <option value="CO_LEADER">Co-leader</option>
                  <option value="LEADER">Leader</option>
                </select>
                <button className="btn w-full">Add to group</button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
