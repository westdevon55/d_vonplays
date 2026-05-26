import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../_components/PageHeader";
import { formatDateTime } from "@/lib/utils";

export default async function ServicesPage() {
  const ctx = await requireTenant();
  const services = await withTenant(ctx.organizationId, (tx) =>
    tx.service.findMany({
      include: {
        serviceType: true,
        _count: { select: { runSheetItems: true, schedules: true } },
      },
      orderBy: { serviceDate: "desc" },
      take: 100,
    }),
  );
  return (
    <>
      <PageHeader
        title="Services"
        description="Service plans, run sheets, and scheduling"
        actions={
          <Link href="/services/new" className="btn">+ Plan Service</Link>
        }
      />
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Service</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Items</th>
                <th className="text-left px-4 py-2 font-medium">Roster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No services planned. <Link href="/services/new" className="underline">Plan one</Link>.
                  </td>
                </tr>
              )}
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/services/${s.id}`} className="hover:underline font-medium">
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{s.serviceType.name}</td>
                  <td className="px-4 py-2 text-slate-600">{formatDateTime(s.serviceDate)}</td>
                  <td className="px-4 py-2 text-slate-600">{s._count.runSheetItems}</td>
                  <td className="px-4 py-2 text-slate-600">{s._count.schedules}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
