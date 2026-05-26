import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "../_components/PageHeader";
import {
  updateOrgAction,
  inviteMemberAction,
  changeRoleAction,
  addPositionAction,
  addServiceTypeAction,
} from "./actions";
import { formatDateTime } from "@/lib/utils";

const ROLES = ["OWNER", "ADMIN", "STAFF", "GROUP_LEADER", "VOLUNTEER", "MEMBER"] as const;

export default async function SettingsPage() {
  const ctx = await requireTenant();
  requirePermission(ctx, "org:manage");
  const data = await withTenant(ctx.organizationId, async (tx) => {
    const [org, memberships, invitations, positions, serviceTypes, auditLog] =
      await Promise.all([
        tx.organization.findUnique({ where: { id: ctx.organizationId } }),
        tx.membership.findMany({
          include: { user: true, person: true },
          orderBy: { createdAt: "asc" },
        }),
        tx.invitation.findMany({
          where: { acceptedAt: null, expiresAt: { gte: new Date() } },
          orderBy: { createdAt: "desc" },
        }),
        tx.position.findMany({ orderBy: { name: "asc" } }),
        tx.serviceType.findMany({ orderBy: { name: "asc" } }),
        tx.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { actor: { select: { name: true, email: true } } },
        }),
      ]);
    return { org, memberships, invitations, positions, serviceTypes, auditLog };
  });

  if (!data.org) return null;

  return (
    <>
      <PageHeader title="Settings" description="Organization, team, and configuration" />
      <div className="p-6 space-y-8 max-w-5xl">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Organization</h2>
          <form action={updateOrgAction} className="mt-3 grid grid-cols-3 gap-3">
            <label className="block col-span-3">
              <span className="text-xs text-slate-600">Name</span>
              <input name="name" defaultValue={data.org.name} required className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Timezone</span>
              <input name="timezone" defaultValue={data.org.timezone} required className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Currency (3-letter)</span>
              <input name="currency" defaultValue={data.org.currency} required maxLength={3} className="input mt-1" />
            </label>
            <div className="col-span-3">
              <button className="btn">Save</button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Team ({data.memberships.length})</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left py-1 font-medium">Email</th>
                <th className="text-left py-1 font-medium">Person</th>
                <th className="text-left py-1 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.memberships.map((m) => (
                <tr key={m.id}>
                  <td className="py-2">{m.user.email}</td>
                  <td className="py-2 text-slate-600">
                    {m.person ? `${m.person.firstName} ${m.person.lastName}` : "—"}
                  </td>
                  <td className="py-2">
                    <form
                      action={(fd) => {
                        const r = String(fd.get("role") ?? "MEMBER") as typeof ROLES[number];
                        return changeRoleAction(m.id, r);
                      }}
                    >
                      <select name="role" defaultValue={m.role} className="input">
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button className="ml-2 text-xs underline">Update</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="mt-6 font-medium text-slate-900 text-sm">Invite a teammate</h3>
          <form action={inviteMemberAction} className="mt-2 flex gap-2 max-w-2xl">
            <input name="email" type="email" required placeholder="name@church.org" className="input" />
            <select name="role" defaultValue="STAFF" className="input">
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button className="btn whitespace-nowrap">Send invite</button>
          </form>
          {data.invitations.length > 0 && (
            <div className="mt-3 text-xs text-slate-500">
              Pending invitations:{" "}
              {data.invitations.map((i) => i.email).join(", ")}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-medium">Service Types</h3>
            <ul className="mt-2 text-sm text-slate-700 space-y-1">
              {data.serviceTypes.map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
            <form action={addServiceTypeAction} className="mt-3 flex gap-2">
              <input name="name" required placeholder="e.g. Evening Service" className="input" />
              <button className="btn">Add</button>
            </form>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-medium">Volunteer Positions</h3>
            <ul className="mt-2 text-sm text-slate-700 space-y-1">
              {data.positions.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
            <form action={addPositionAction} className="mt-3 flex gap-2">
              <input name="name" required placeholder="e.g. Worship Leader" className="input" />
              <button className="btn">Add</button>
            </form>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Audit log (recent 30)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left py-1 font-medium">When</th>
                  <th className="text-left py-1 font-medium">Actor</th>
                  <th className="text-left py-1 font-medium">Action</th>
                  <th className="text-left py-1 font-medium">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.auditLog.map((a) => (
                  <tr key={a.id}>
                    <td className="py-1 text-slate-500">{formatDateTime(a.createdAt)}</td>
                    <td className="py-1">{a.actor?.email ?? "system"}</td>
                    <td className="py-1 font-mono text-xs">{a.action}</td>
                    <td className="py-1 text-slate-600">{a.entityType} {a.entityId ? `#${a.entityId.slice(0, 8)}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
