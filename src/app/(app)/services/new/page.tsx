import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import { createServiceAction } from "../actions";

export default async function NewServicePage() {
  const ctx = await requireTenant();
  requirePermission(ctx, "services:write");
  const serviceTypes = await withTenant(ctx.organizationId, (tx) =>
    tx.serviceType.findMany({ orderBy: { name: "asc" } }),
  );
  const today = new Date();
  today.setHours(10, 0, 0, 0);
  const defaultDate = today.toISOString().slice(0, 16);

  return (
    <>
      <PageHeader title="Plan Service" />
      <div className="p-6">
        <form action={createServiceAction} className="space-y-4 max-w-xl">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Service title</span>
            <input name="title" required className="input mt-1" placeholder="e.g. Sunday Morning" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Service type</span>
            <select name="serviceTypeId" required className="input mt-1">
              {serviceTypes.length === 0 && (
                <option value="">Create a service type in settings</option>
              )}
              {serviceTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Date & time</span>
            <input
              name="serviceDate"
              type="datetime-local"
              required
              defaultValue={defaultDate}
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea name="notes" rows={3} className="input mt-1" />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn">Create service</button>
            <Link href="/services" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
