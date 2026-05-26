import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../_components/PageHeader";

export default async function GroupsPage() {
  const ctx = await requireTenant();
  const groups = await withTenant(ctx.organizationId, (tx) =>
    tx.group.findMany({
      include: {
        category: true,
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    }),
  );
  return (
    <>
      <PageHeader
        title="Groups"
        description="Small groups, teams, and ministries"
        actions={
          <Link href="/groups/new" className="btn">
            + Add Group
          </Link>
        }
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.length === 0 && (
          <p className="text-slate-500 text-sm">No groups yet.</p>
        )}
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/groups/${g.id}`}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
          >
            <div className="flex justify-between items-start">
              <div className="font-medium text-slate-900">{g.name}</div>
              {!g.isActive && (
                <span className="text-xs text-slate-400">inactive</span>
              )}
            </div>
            {g.category && (
              <div className="mt-1 text-xs text-slate-500">{g.category.name}</div>
            )}
            <div className="mt-3 text-sm text-slate-600">
              {g._count.members} member{g._count.members === 1 ? "" : "s"}
            </div>
            {g.meetingDay && (
              <div className="mt-2 text-xs text-slate-500">
                {g.meetingDay} {g.meetingTime ?? ""}
                {g.location ? ` · ${g.location}` : ""}
              </div>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
