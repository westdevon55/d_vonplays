import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import { createFundAction } from "../actions";

export default async function FundsPage() {
  const ctx = await requireTenant();
  const funds = await withTenant(ctx.organizationId, (tx) =>
    tx.fund.findMany({
      include: {
        _count: { select: { donations: true } },
      },
      orderBy: { name: "asc" },
    }),
  );
  const canWrite = hasPermission(ctx.role, "giving:write");
  return (
    <>
      <PageHeader title="Funds" description="Categories that donations are tracked against" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Fund</th>
                <th className="text-left px-4 py-2 font-medium">Description</th>
                <th className="text-left px-4 py-2 font-medium">Donations</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funds.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-2 font-medium">{f.name}</td>
                  <td className="px-4 py-2 text-slate-600">{f.description ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{f._count.donations}</td>
                  <td className="px-4 py-2">{f.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canWrite && (
          <form action={createFundAction} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="font-medium">Add fund</h3>
            <label className="block">
              <span className="text-xs text-slate-600">Name</span>
              <input name="name" required className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Description</span>
              <textarea name="description" rows={2} className="input mt-1" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked />
              Active
            </label>
            <button className="btn w-full">Add fund</button>
          </form>
        )}
      </div>
    </>
  );
}
