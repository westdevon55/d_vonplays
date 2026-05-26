import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../../_components/PageHeader";
import { FamilyForm } from "../_components/FamilyForm";
import { updateFamilyAction } from "../actions";

export default async function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenant();
  const family = await withTenant(ctx.organizationId, (tx) =>
    tx.family.findUnique({
      where: { id },
      include: {
        members: { orderBy: [{ familyRelation: "asc" }, { firstName: "asc" }] },
      },
    }),
  );
  if (!family) notFound();
  const update = updateFamilyAction.bind(null, id);
  return (
    <>
      <PageHeader title={family.name} description="Family details and members" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FamilyForm action={update} defaults={family} submitLabel="Save changes" />
        </div>
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="font-medium text-slate-900">Members</div>
          {family.members.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No members linked. Edit a person to assign them to this family.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {family.members.map((m) => (
                <li key={m.id} className="flex justify-between">
                  <Link
                    href={`/people/${m.id}`}
                    className="text-slate-700 hover:underline"
                  >
                    {m.firstName} {m.lastName}
                  </Link>
                  <span className="text-slate-400">{m.familyRelation ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}
