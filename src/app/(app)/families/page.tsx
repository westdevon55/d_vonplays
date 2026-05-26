import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../_components/PageHeader";

export default async function FamiliesPage() {
  const ctx = await requireTenant();
  const families = await withTenant(ctx.organizationId, (tx) =>
    tx.family.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { name: "asc" },
      take: 200,
    }),
  );
  return (
    <>
      <PageHeader
        title="Families"
        description="Households and family groupings"
        actions={
          <Link href="/families/new" className="btn">
            + Add Family
          </Link>
        }
      />
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Family</th>
                <th className="text-left px-4 py-2 font-medium">Members</th>
                <th className="text-left px-4 py-2 font-medium">City</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {families.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                    No families yet.
                  </td>
                </tr>
              )}
              {families.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-2">
                    <Link href={`/families/${f.id}`} className="hover:underline">
                      {f.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{f._count.members}</td>
                  <td className="px-4 py-2 text-slate-600">{f.city ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
